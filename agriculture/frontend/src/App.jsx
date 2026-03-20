import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Mic, MicOff, Sprout, CloudSun, TrendingUp, HandCoins, Globe, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { analyzeIntent, transcribeAudio } from './services/api';

const TRANSLATIONS = {
  en: {
    title: "Agri-Voice",
    subtitle: "Smart Farming Assistant",
    greeting: "Hello! I am your farmer assistant. Tap the mic to record, then tap again to stop and transcribe your voice.",
    mandiTitle: "Mandi Prices",
    mandiDesc: "Check local rates & sell smarter",
    weatherTitle: "Weather Plan",
    weatherDesc: "3-day farm cast",
    trendTitle: "Price Trends",
    trendDesc: "AI predictions",
    trendInd: "↗ Expected to rise",
    quickActions: "Quick Actions",
    speaking: "Speaking...",
    recording: "Recording — Tap to stop",
    transcribing: "Transcribing audio...",
    tapToSpeak: "Tap to speak",
    micError: "Microphone not accessible. Please check browser permissions.",
    transcribeError: "Could not transcribe audio. Please type your question.",
    textPlaceholder: "Ask me a question...",
    btnSend: "Send",
  },
  hi: {
    title: "एग्री-वॉयस",
    subtitle: "स्मार्ट कृषक सहायक",
    greeting: "नमस्ते! माइक दबाकर रिकॉर्ड करें, फिर रोकने के लिए दोबारा दबाएं — आपकी बात टेक्स्ट में आ जाएगी।",
    mandiTitle: "मंडी के भाव",
    mandiDesc: "स्थानीय रेट्स की जांच करें",
    weatherTitle: "मौसम की जानकारी",
    weatherDesc: "अगले 3 दिनों का पूर्वानुमान",
    trendTitle: "बाज़ार के रुझान",
    trendDesc: "एआई भविष्यवाणियां",
    trendInd: "↗ भाव बढ़ने की उम्मीद",
    quickActions: "त्वरित कार्रवाई",
    speaking: "बोल रहा है...",
    recording: "रिकॉर्ड हो रहा है — रोकने के लिए दबाएं",
    transcribing: "ऑडियो ट्रांसक्राइब हो रहा है...",
    tapToSpeak: "बोलने के लिए दबाएं",
    micError: "माइक उपलब्ध नहीं है। ब्राउज़र की अनुमति जांचें।",
    transcribeError: "ऑडियो ट्रांसक्राइब नहीं हो सका। कृपया टाइप करें।",
    textPlaceholder: "मुझसे कुछ भी पूछें...",
    btnSend: "भेजें / पुष्टि करें",
  }
};

const App = () => {
  const [lang, setLang] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState(false);
  const [transcribeError, setTranscribeError] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const voicesRef = useRef([]);

  const t = TRANSLATIONS[lang];

  // ── Init: greeting + geolocation ────────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'system')) {
      setMessages([{ role: 'system', content: t.greeting }]);
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.log('Geolocation denied:', err)
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // ── Preload speech synthesis voices ───────────────────────────────────────────
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis?.getVoices() || [];
    };
    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      stopStream();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.lang = targetLang;
    utterance.rate = lang === 'hi' ? 0.9 : 1;

    // Use preloaded voices; fallback to fresh fetch
    let voices = voicesRef.current;
    if (!voices.length) voices = window.speechSynthesis.getVoices();

    // Try exact match first, then prefix match
    const voice = voices.find(v => v.lang.replace('_', '-') === targetLang)
      || voices.find(v => v.lang.replace('_', '-').startsWith(lang));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  // ── Intent mutation ──────────────────────────────────────────────────────────
  const intentMutation = useMutation({
    mutationFn: ({ text, currentLang, coords }) => analyzeIntent(text, currentLang, coords),
    onSuccess: (data) => {
      const respText = data.response;
      setMessages(prev => [...prev, { role: 'system', content: respText }]);
      speak(respText);
    },
    onError: (error) => {
      console.error('API Error:', error);
      const errorMsg = lang === 'hi'
        ? 'क्षमा करें, सर्वर से जुड़ने में त्रुटि आई।'
        : 'Sorry, an error occurred connecting to the server.';
      setMessages(prev => [...prev, { role: 'system', content: errorMsg }]);
      speak(errorMsg);
    }
  });

  const handleUserMessage = (transcript) => {
    const isHindi = /[\u0900-\u097F]/.test(transcript);
    const currentLang = isHindi ? 'hi' : 'en';
    if (currentLang !== lang) setLang(currentLang);
    setMessages(prev => [...prev, { role: 'user', content: transcript }]);
    intentMutation.mutate({ text: transcript, currentLang, coords: userLocation });
  };

  // ── MediaRecorder: start recording ──────────────────────────────────────────
  const startRecording = async () => {
    setMicError(false);
    setTranscribeError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer webm/opus (Chrome); fall back gracefully
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopStream();
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        await handleTranscription(audioBlob);
      };

      recorder.start(250); // collect chunks every 250ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setMicError(true);
    }
  };

  // ── MediaRecorder: stop recording → transcribe ───────────────────────────────
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // triggers onstop → handleTranscription
    }
    setIsRecording(false);
  };

  const handleTranscription = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      let transcript = await transcribeAudio(audioBlob, lang);
      if (transcript) {
        // Parse [LANG:xx] tag from STT response for reliable language detection
        const langTagMatch = transcript.match(/^\[LANG:(hi|en)\]\s*/);
        if (langTagMatch) {
          const detectedLang = langTagMatch[1];
          transcript = transcript.replace(langTagMatch[0], '').trim();
          if (detectedLang !== lang) {
            setLang(detectedLang);
          }
        }
        setTextInput(transcript);
      } else {
        setTranscribeError(true);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setTranscribeError(true);
    } finally {
      setIsTranscribing(false);
    }
  };

  // ── Toggle mic button ────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setTextInput('');
      startRecording();
    }
  };

  // ── Submit text ──────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    if (isRecording) stopRecording();
    const input = textInput.trim();
    setTextInput('');
    handleUserMessage(input);
  };

  const handleQuickAction = (actionEn, actionHi) => {
    handleUserMessage(lang === 'hi' ? actionHi : actionEn);
  };

  const lastSystemMessage = messages.slice().reverse().find(m => m.role === 'system');
  const recentUserMessage = messages.slice().reverse().find(m => m.role === 'user');

  // ── Mic button state ─────────────────────────────────────────────────────────
  const micBusy = isTranscribing || intentMutation.isPending;
  let voiceStatusText = t.tapToSpeak;
  if (isRecording) voiceStatusText = t.recording;
  else if (isTranscribing) voiceStatusText = t.transcribing;
  else if (isSpeaking) voiceStatusText = t.speaking;

  return (
    <div className="layout-container">
      <div className="bg-shape shape1"></div>
      <div className="bg-shape shape2"></div>

      <div className="app-wrapper">
        <header className="app-header">
          <div className="app-header-title">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <button className="lang-toggle" onClick={() => setLang(l => l === 'hi' ? 'en' : 'hi')} aria-label="Toggle language">
            <Globe size={18} />
            <span>{lang === 'hi' ? 'हिंदी (HI)' : 'English (EN)'}</span>
          </button>
        </header>

        <div className="app-body">
          <main className="conversation-panel">
            <div className="response-container">
              {recentUserMessage && (
                <div className="user-query">
                  "{recentUserMessage.content}"
                </div>
              )}

              <div className="ai-avatar-wrapper">
                <div className={`ai-avatar ${isSpeaking ? 'speaking' : ''}`}>
                  <Sprout size={28} color="#fff" />
                </div>
                {isSpeaking && <span className="status-text">{t.speaking}</span>}
              </div>

              <div className="response-bubble">
                {intentMutation.isPending
                  ? <span className="thinking-dots">Thinking<span>.</span><span>.</span><span>.</span></span>
                  : lastSystemMessage?.content}
              </div>
            </div>

            <div className="interaction-dock">
              {/* Error banners */}
              {micError && (
                <div className="error-banner">
                  <AlertCircle size={16} /> <span>{t.micError}</span>
                </div>
              )}
              {transcribeError && (
                <div className="error-banner">
                  <AlertCircle size={16} /> <span>{t.transcribeError}</span>
                </div>
              )}

              <div className="voice-controls">
                <div className="mic-wrapper">
                  {isRecording && <div className="mic-rings"></div>}
                  <button
                    className={`mic-button ${isRecording ? 'listening' : ''} ${micBusy && !isRecording ? 'disabled' : ''}`}
                    onClick={toggleMic}
                    disabled={micBusy && !isRecording}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    {isTranscribing
                      ? <Loader2 size={34} className="spin" />
                      : isRecording
                        ? <MicOff size={34} />
                        : <Mic size={38} />}
                  </button>
                </div>
                <p className="voice-status">{voiceStatusText}</p>
              </div>

              {/* Typed / Verified Input Box */}
              <form className="text-input-form" onSubmit={handleSubmit}>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isTranscribing ? (lang === 'hi' ? 'ट्रांसक्राइब हो रहा है...' : 'Transcribing...') : t.textPlaceholder}
                  className="text-input"
                  disabled={isTranscribing}
                />
                <button
                  type="submit"
                  className={`send-btn ${textInput.trim() ? 'pulse-ready' : ''}`}
                  disabled={!textInput.trim() || micBusy}
                  title={t.btnSend}
                >
                  <ArrowRight size={20} />
                </button>
              </form>
            </div>
          </main>

          <aside className="actions-panel">
            <h3>{t.quickActions}</h3>

            <div className="actions-grid">
              <div className="action-card" onClick={() => handleQuickAction('check wheat price', 'गेहूँ के भाव')}>
                <div className="action-icon" style={{color: '#64eda1'}}><HandCoins size={24} /></div>
                <div className="action-card-content">
                  <h4>{t.mandiTitle}</h4>
                  <p>{t.mandiDesc}</p>
                </div>
              </div>

              <div className="action-card" onClick={() => handleQuickAction('weather forecast', 'मौसम की जानकारी')}>
                <div className="action-icon" style={{color: '#8bd9f7'}}><CloudSun size={24} /></div>
                <div className="action-card-content">
                  <h4>{t.weatherTitle}</h4>
                  <p>{t.weatherDesc}</p>
                </div>
              </div>

              <div className="action-card" onClick={() => handleQuickAction('price trends for crops', 'फसलों के बाज़ार के रुझान')}>
                <div className="action-icon" style={{color: '#fbbf24'}}><TrendingUp size={24} /></div>
                <div className="action-card-content">
                  <h4>{t.trendTitle}</h4>
                  <p>{t.trendDesc}</p>
                </div>
                <div className="trend-indicator">↗</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;
