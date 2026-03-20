import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { Mic, MicOff, Sprout, CloudSun, TrendingUp, HandCoins, Globe, AlertCircle, ArrowRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { analyzeIntent } from './services/api';

const TRANSLATIONS = {
  en: {
    title: "Agri-Voice",
    subtitle: "Smart Farming Assistant",
    greeting: "Hello! I am your farmer assistant. Tap the mic to speak, review your text below, and send it to get market prices or farming advice.",
    mandiTitle: "Mandi Prices",
    mandiDesc: "Check local rates & sell smarter",
    weatherTitle: "Weather Plan",
    weatherDesc: "3-day farm cast",
    trendTitle: "Price Trends",
    trendDesc: "AI predictions",
    trendInd: "↗ Expected to rise",
    quickActions: "Quick Actions",
    speaking: "Speaking...",
    listening: "Listening - Tap to stop",
    tapToSpeak: "Tap to speak",
    micError: "Mic error. Try typing instead.",
    textPlaceholder: "Ask me a question...",
    btnSend: "Send",
    // Mock responses dynamic wrappers
    weatherResp: "The weather will be clear for the next 3 days. It is a good time for irrigation.",
    seedResp: "Sowing Kharif crops is profitable right now.",
    unknownResp: "I am not sure about that. Try asking about weather or crop prices."
  },
  hi: {
    title: "एग्री-वॉयस",
    subtitle: "स्मार्ट कृषक सहायक",
    greeting: "नमस्ते! मैं आपका कृषक मित्र हूँ। माइक दबाकर बोलें, नीचे टेक्स्ट जांचें और मंडी भाव/खेती की जानकारी के लिए भेजें।",
    mandiTitle: "मंडी के भाव",
    mandiDesc: "स्थानीय रेट्स की जांच करें",
    weatherTitle: "मौसम की जानकारी",
    weatherDesc: "अगले 3 दिनों का पूर्वानुमान",
    trendTitle: "बाज़ार के रुझान",
    trendDesc: "एआई भविष्यवाणियां",
    trendInd: "↗ भाव बढ़ने की उम्मीद",
    quickActions: "त्वरित कार्रवाई",
    speaking: "बोल रहा है...",
    listening: "सुन रहा है - रोकने के लिए दबाएं",
    tapToSpeak: "बोलने के लिए दबाएं",
    micError: "माइक त्रुटि। कृपया टाइप करें।",
    textPlaceholder: "मुझसे कुछ भी पूछें...",
    btnSend: "भेजें / पुष्टि करें",
    weatherResp: "अगले 3 दिनों तक मौसम साफ रहेगा। आप सिंचाई की योजना बना सकते हैं।",
    seedResp: "इस मौसम में खरीफ फसलों की बुवाई फायदेमंद रहेगी।",
    unknownResp: "मुझे इस बारे में पक्का नहीं पता। कृपया मौसम या फसलों के दाम के बारे में पूछें।"
  }
};

// Client-side mock logic removed in favor of backend API calls

const App = () => {
  const [lang, setLang] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState([]);
  
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'system')) {
      setMessages([{ role: 'system', content: t.greeting }]);
    }
  }, [lang, t.greeting]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsListening(true);
        setMicError(false);
      };
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        // Sync to text box for user confirmation
        setTextInput(finalTranscriptRef.current + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech error:", event.error);
        setIsListening(false);
        // Don't show error if aborted purposely
        if (event.error !== 'aborted') {
          setMicError(true);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setMicError(true);
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang(l => l === 'hi' ? 'en' : 'hi');
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
      utterance.lang = targetLang;
      
      const voices = window.speechSynthesis.getVoices();
      const nativeVoice = voices.find(v => v.lang.replace('_', '-').includes(targetLang) || v.lang.startsWith(lang));
      if (nativeVoice) {
        utterance.voice = nativeVoice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const intentMutation = useMutation({
    mutationFn: ({text, currentLang}) => analyzeIntent(text, currentLang),
    onSuccess: (data) => {
      const respText = data.response;
      setMessages(prev => [...prev, { role: 'system', content: respText }]);
      speak(respText);
    },
    onError: (error) => {
      console.error("API Error:", error);
      const errorMsg = lang === 'hi' ? "क्षमा करें, सर्वर से जुड़ने में त्रुटि आई।" : "Sorry, an error occurred connecting to the server.";
      setMessages(prev => [...prev, { role: 'system', content: errorMsg }]);
      speak(errorMsg);
    }
  });

  const handleUserMessage = async (transcript) => {
    // Auto language detection based on Hindi Unicode range
    const isHindi = /[\u0900-\u097F]/.test(transcript);
    const currentLang = isHindi ? 'hi' : 'en';
    if (currentLang !== lang) {
      setLang(currentLang);
    }
    
    setMessages(prev => [...prev, { role: 'user', content: transcript }]);
    intentMutation.mutate({ text: transcript, currentLang });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    // Stop listening if user confirms submission
    if (isListening) toggleMic();

    const input = textInput;
    setTextInput("");
    finalTranscriptRef.current = ""; // clear buffer
    handleUserMessage(input);
  };

  const toggleMic = () => {
    if (isListening) {
      // Tap to Stop
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Tap to Speak
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      finalTranscriptRef.current = ""; 
      setTextInput(""); // Clear field for fresh dictation
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleQuickAction = async (actionTriggerEn, actionTriggerHi) => {
    const triggerText = lang === 'hi' ? actionTriggerHi : actionTriggerEn;
    handleUserMessage(triggerText);
  };

  const lastSystemMessage = messages.slice().reverse().find(m => m.role === 'system');
  const recentUserMessage = messages.slice().reverse().find(m => m.role === 'user');

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
          <button className="lang-toggle" onClick={toggleLanguage} aria-label="Toggle language">
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
                {lastSystemMessage?.content}
              </div>
            </div>

            <div className="interaction-dock">
              {micError && (
                <div className="error-banner">
                  <AlertCircle size={16} /> <span>{t.micError}</span>
                </div>
              )}

              <div className="voice-controls">
                <div className="mic-wrapper">
                  {isListening && <div className="mic-rings"></div>}
                  <button 
                    className={`mic-button ${isListening ? 'listening' : ''}`}
                    onClick={toggleMic}
                    aria-label={isListening ? "Stop listening" : "Start speaking"}
                  >
                    {isListening ? <MicOff size={34} /> : <Mic size={38} />}
                  </button>
                </div>
                <p className="voice-status">
                  {isListening ? t.listening : t.tapToSpeak}
                </p>
              </div>

              {/* Typed / Verified Input Box */}
              <form className="text-input-form" onSubmit={handleSubmit}>
                <input 
                  type="text" 
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t.textPlaceholder}
                  className="text-input"
                />
                <button 
                  type="submit" 
                  className={`send-btn ${textInput.trim() ? 'pulse-ready' : ''}`} 
                  disabled={!textInput.trim()}
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
              <div className="action-card highlight" onClick={() => handleQuickAction('check wheat price', 'गेहूँ के भाव')}>
                <div className="action-icon" style={{color: '#64eda1'}}><HandCoins size={28} /></div>
                <div>
                  <h4>{t.mandiTitle}</h4>
                  <p>{t.mandiDesc}</p>
                </div>
              </div>

              <div className="action-card" onClick={() => handleQuickAction('weather forecast', 'मौसम की जानकारी')}>
                <div className="action-icon" style={{color: '#8bd9f7'}}><CloudSun size={26} /></div>
                <h4>{t.weatherTitle}</h4>
                <p>{t.weatherDesc}</p>
              </div>

              <div className="action-card" onClick={() => handleQuickAction('price trends', 'बाज़ार के रुझान')}>
                <div className="action-icon" style={{color: '#f7a731'}}><TrendingUp size={26} /></div>
                <h4>{t.trendTitle}</h4>
                <p>{t.trendDesc}</p>
                <div className="trend-indicator">{t.trendInd}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;
