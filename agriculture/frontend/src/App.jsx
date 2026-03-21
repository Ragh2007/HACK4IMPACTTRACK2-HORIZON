import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import {
  Mic, MicOff, Globe, AlertCircle, ArrowRight,
  TrendingUp, TrendingDown, CloudRain, Sun, Wind, Droplets,
  Wheat, Sprout, Newspaper, ShoppingCart, CloudSun, ChevronRight,
  Thermometer, Volume2, RefreshCw, AlertTriangle, Zap,
  BookOpen, Leaf, BarChart2, Loader2
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { analyzeIntent, transcribeAudio } from './services/api';

// ── TRANSLATIONS ──────────────────────────────────────────────
const T = {
  en: {
    title: "Agri-Voice", sub: "Smart Farming Assistant",
    greeting: "Namaste! I'm your farming assistant.\nTap the mic and ask me anything — crop prices, weather, or farming advice.",
    mandiTitle: "Mandi", weatherTitle: "Weather", trendTitle: "Trends",
    speaking: "Speaking...", listening: "Listening — tap to stop",
    recording: "Recording — Tap to stop", transcribing: "Transcribing...",
    tapToSpeak: "Tap to Speak",
    micError: "Mic unavailable. Type your question.",
    transcribeError: "Could not transcribe. Please type your question.",
    textPlaceholder: "Ask anything about farming...",
    askThis: "Ask about this", liveLabel: "Live", readyLabel: "Online",
    noSpray: "Avoid spraying", goodIrr: "Good for irrigation", heavyRain: "Heavy rain",
    refreshNews: "Refresh", loadingNews: "Fetching news...",
    aiNews: "AI-Generated News", cachedNews: "Latest Farm News",
  },
  hi: {
    title: "एग्री-वॉयस", sub: "स्मार्ट कृषि सहायक",
    greeting: "नमस्ते! मैं आपका कृषि सहायक हूँ।\nमाइक दबाएं और फसल के भाव, मौसम या खेती की जानकारी पूछें।",
    mandiTitle: "मंडी", weatherTitle: "मौसम", trendTitle: "रुझान",
    speaking: "बोल रहा है...", listening: "सुन रहा है — रोकने के लिए दबाएं",
    recording: "रिकॉर्ड हो रहा है — रोकने के लिए दबाएं", transcribing: "ट्रांसक्राइब हो रहा है...",
    tapToSpeak: "बोलने के लिए दबाएं",
    micError: "माइक उपलब्ध नहीं। सवाल टाइप करें।",
    transcribeError: "ट्रांसक्राइब नहीं हो सका। कृपया टाइप करें।",
    textPlaceholder: "खेती के बारे में कुछ भी पूछें...",
    askThis: "इस पर पूछें", liveLabel: "लाइव", readyLabel: "ऑनलाइन",
    noSpray: "छिड़काव न करें", goodIrr: "सिंचाई करें", heavyRain: "भारी बारिश",
    refreshNews: "ताज़ा करें", loadingNews: "समाचार लोड हो रहे हैं...",
    aiNews: "AI समाचार", cachedNews: "ताज़ा खेती समाचार",
  }
};

// ── CATEGORY CONFIG ───────────────────────────────────────────
const CAT_CFG = {
  Scheme:   { color: '#6d28d9', Icon: BookOpen    },
  Alert:    { color: '#dc2626', Icon: Zap          },
  Market:   { color: '#059669', Icon: BarChart2    },
  Pest:     { color: '#d97706', Icon: AlertTriangle },
  Tip:      { color: '#0369a1', Icon: Leaf         },
  General:  { color: '#475569', Icon: Newspaper    },
  योजना:   { color: '#6d28d9', Icon: BookOpen    },
  चेतावनी: { color: '#dc2626', Icon: Zap          },
  बाज़ार:  { color: '#059669', Icon: BarChart2    },
  कीट:    { color: '#d97706', Icon: AlertTriangle },
  सुझाव:  { color: '#0369a1', Icon: Leaf         },
};
const getCfg = (cat) => CAT_CFG[cat] || CAT_CFG.General;

// ── FALLBACK NEWS ─────────────────────────────────────────────
const FALLBACK = {
  en: [
    { cat: 'Scheme', tag: 'Policy',       title: 'Wheat MSP Raised by ₹150/qtl',      body: 'Government announces new minimum support price for wheat effective Rabi season 2025–26. A major win for farmers across UP, Punjab, and Haryana.', urgent: false },
    { cat: 'Alert',  tag: 'Weather',      title: 'Heavy Rainfall Warning — Red Alert', body: 'IMD issues red alert for Maharashtra, MP & UP. Extremely heavy rain expected in next 48 hours. Avoid field operations and pesticide spraying.',   urgent: true  },
    { cat: 'Market', tag: 'Price',        title: 'Tomato Prices Surge 40% in Nasik',   body: 'Wholesale tomato prices hit ₹42/kg at Nasik mandi due to supply disruptions from Karnataka flooding. Expected to stabilize within a week.',       urgent: false },
    { cat: 'Pest',   tag: 'Pest Control', title: 'Fall Armyworm Alert in Vidarbha',    body: 'Early infestation detected in maize crops across Vidarbha. Farmers advised to inspect fields immediately and apply recommended pesticide.',          urgent: true  },
    { cat: 'Scheme', tag: 'Subsidy',      title: 'Free Drip Irrigation — Apply Now',   body: 'Up to 90% subsidy available under PM Krishi Sinchai Yojana for small farmers. Apply before March 31 at your nearest Krishi Kendra.',                urgent: false },
  ],
  hi: [
    { cat: 'योजना',   tag: 'नीति',        title: 'गेहूं MSP ₹150/क्विंटल बढ़ा',         body: 'सरकार ने रबी 2025–26 के लिए गेहूं का न्यूनतम समर्थन मूल्य बढ़ाया। UP, पंजाब और हरियाणा के किसानों के लिए बड़ी खुशखबरी।',  urgent: false },
    { cat: 'चेतावनी', tag: 'मौसम',        title: 'भारी बारिश — रेड अलर्ट जारी',         body: 'IMD ने महाराष्ट्र, MP और UP के लिए रेड अलर्ट जारी किया। अगले 48 घंटों में बहुत भारी बारिश। खेत में काम न करें।',          urgent: true  },
    { cat: 'बाज़ार',  tag: 'भाव',         title: 'टमाटर 40% महंगा — नासिक मंडी',        body: 'कर्नाटक में बाढ़ से आपूर्ति प्रभावित होने से नासिक मंडी में टमाटर ₹42/किलो पहुंचा। एक सप्ताह में स्थिर होने की उम्मीद।', urgent: false },
    { cat: 'कीट',    tag: 'कीट नियंत्रण', title: 'विदर्भ में फॉल आर्मीवर्म अलर्ट',      body: 'मक्के की फसल में कीड़े पाए गए। किसान तुरंत खेत की जांच करें और अनुशंसित कीटनाशक डालें।',                                     urgent: true  },
    { cat: 'योजना',  tag: 'सब्सिडी',     title: 'मुफ्त ड्रिप सिंचाई — अभी आवेदन करें', body: 'PM कृषि सिंचाई योजना के तहत 90% तक सब्सिडी। 31 मार्च से पहले कृषि केंद्र में आवेदन करें।',                                   urgent: false },
  ]
};

// ── MANDI DATA ────────────────────────────────────────────────
const MANDI = [
  { Icon: Wheat,  name: 'Wheat',  nameHi: 'गेहूं',  price: '2,275', unit: '₹/qtl', change: '+2.1%', up: true,  high: '2,310', low: '2,240' },
  { Icon: Sprout, name: 'Onion',  nameHi: 'प्याज',  price: '1,840', unit: '₹/qtl', change: '-1.3%', up: false, high: '1,900', low: '1,800' },
  { Icon: Sprout, name: 'Tomato', nameHi: 'टमाटर', price: '4,200', unit: '₹/qtl', change: '+8.5%', up: true,  high: '4,400', low: '3,900' },
  { Icon: Wheat,  name: 'Rice',   nameHi: 'चावल',  price: '3,100', unit: '₹/qtl', change: '+0.4%', up: true,  high: '3,150', low: '3,060' },
  { Icon: Sprout, name: 'Maize',  nameHi: 'मक्का',  price: '1,950', unit: '₹/qtl', change: '-0.8%', up: false, high: '1,980', low: '1,920' },
];

// ═════════════════════════════════════════════════════════════
export default function App() {
  const [lang,          setLang]          = useState('en');
  const [isListening,   setIsListening]   = useState(false);
  const [isRecording,   setIsRecording]   = useState(false);
  const [isTranscribing,setIsTranscribing]= useState(false);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const [micError,      setMicError]      = useState(false);
  const [transcribeError,setTranscribeError] = useState(false);
  const [textInput,     setTextInput]     = useState('');
  const [messages,      setMessages]      = useState([]);
  const [activeTab,     setActiveTab]     = useState('news');
  const [news,          setNews]          = useState(FALLBACK.en);
  const [newsLoading,   setNewsLoading]   = useState(false);
  const [newsSource,    setNewsSource]    = useState('fallback');
  const [featIdx,       setFeatIdx]       = useState(0);
  const [userLocation,  setUserLocation]  = useState(null);

  const recRef           = useRef(null);
  const finalRef         = useRef('');
  const msgEndRef        = useRef(null);
  const cycleRef         = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const streamRef        = useRef(null);
  const voicesRef        = useRef([]);

  const t = T[lang];

  // ── Init messages ──
  useEffect(() => {
    setMessages([{ role: 'system', content: t.greeting }]);
  }, []);

  // ── Geolocation ──
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.log('Geolocation denied:', err)
      );
    }
  }, []);

  // ── Preload TTS voices ──
  useEffect(() => {
    const loadVoices = () => { voicesRef.current = window.speechSynthesis?.getVoices() || []; };
    loadVoices();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      stopStream();
      if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // ── Auto-scroll chat ──
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Cycle featured card ──
  const startCycle = useCallback((len) => {
    if (cycleRef.current) clearInterval(cycleRef.current);
    if (len < 2) return;
    cycleRef.current = setInterval(() => setFeatIdx(i => (i + 1) % len), 5000);
  }, []);

  useEffect(() => {
    startCycle(news.length);
    return () => { if (cycleRef.current) clearInterval(cycleRef.current); };
  }, [news.length]);

  // ── Speech recognition setup ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setMicError(true); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true;
    rec.onstart  = () => { setIsListening(true); setMicError(false); };
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setTextInput(finalRef.current + interim);
    };
    rec.onerror = (e) => { setIsListening(false); if (e.error !== 'aborted') setMicError(true); };
    rec.onend   = () => setIsListening(false);
    recRef.current = rec;
    return () => recRef.current?.abort();
  }, []);

  useEffect(() => {
    if (recRef.current) recRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
  }, [lang]);

  // ── Fetch AI news ──
  const fetchNews = useCallback(async (currentLang) => {
    setNewsLoading(true);
    setFeatIdx(0);
    const prompt = currentLang === 'hi'
      ? `तुम एक भारतीय कृषि समाचार विशेषज्ञ हो। मार्च 2026 के संदर्भ में 5 ताज़ा खेती समाचार बनाओ। ONLY return a valid JSON array, no markdown: [{"cat":"योजना|चेतावनी|बाज़ार|कीट|सुझाव","tag":"2-word label","title":"headline","body":"2 sentences","urgent":true|false}]`
      : `You are an Indian agricultural news expert. March 2026 context. Generate 5 realistic farming news items. ONLY return a valid JSON array, no markdown: [{"cat":"Scheme|Alert|Market|Pest|Tip","tag":"2-word label","title":"headline","body":"2 sentences","urgent":true|false}]`;
    try {
      const data = await analyzeIntent(prompt, currentLang);
      const raw  = (data?.response || '').replace(/```json|```/gi, '').trim();
      const start = raw.indexOf('[');
      const end   = raw.lastIndexOf(']');
      if (start === -1 || end === -1) throw new Error('No JSON array');
      const parsed = JSON.parse(raw.slice(start, end + 1));
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty array');
      setNews(parsed);
      setNewsSource('ai');
    } catch (err) {
      console.warn('News fetch failed, using fallback:', err);
      setNews(FALLBACK[currentLang]);
      setNewsSource('fallback');
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    setNews(FALLBACK[lang]);
    setNewsSource('fallback');
    fetchNews(lang);
  }, [lang]);

  // ── TTS ──
  const speak = (text) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const targetLang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utt.lang = targetLang;
    utt.rate = lang === 'hi' ? 0.9 : 1;
    let voices = voicesRef.current;
    if (!voices.length) voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.replace('_', '-') === targetLang)
      || voices.find(v => v.lang.replace('_', '-').startsWith(lang));
    if (voice) utt.voice = voice;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend   = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  // ── Stream helpers ──
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // ── Chat mutation ──
  const mutation = useMutation({
    mutationFn: ({ text, currentLang, coords }) => analyzeIntent(text, currentLang, coords),
    onSuccess: (data) => { setMessages(p => [...p, { role: 'system', content: data.response }]); speak(data.response); },
    onError:   ()     => {
      const m = lang === 'hi' ? 'माफ करें, कुछ गड़बड़ हुई। दोबारा कोशिश करें।' : 'Something went wrong. Please try again.';
      setMessages(p => [...p, { role: 'system', content: m }]); speak(m);
    }
  });

  const sendMessage = (text) => {
    const isHindi = /[\u0900-\u097F]/.test(text);
    const cl = isHindi ? 'hi' : 'en';
    if (cl !== lang) setLang(cl);
    setMessages(p => [...p, { role: 'user', content: text }]);
    mutation.mutate({ text, currentLang: cl, coords: userLocation });
  };

  // ── MediaRecorder: start ──
  const startRecording = async () => {
    setMicError(false);
    setTranscribeError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stopStream();
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        audioChunksRef.current = [];
        await handleTranscription(audioBlob);
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setMicError(true);
    }
  };

  // ── MediaRecorder: stop ──
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // ── Transcription handler ──
  const handleTranscription = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      let transcript = await transcribeAudio(audioBlob, lang);
      if (transcript) {
        const langTagMatch = transcript.match(/^\[LANG:(hi|en)\]\s*/);
        if (langTagMatch) {
          const detectedLang = langTagMatch[1];
          transcript = transcript.replace(langTagMatch[0], '').trim();
          if (detectedLang !== lang) setLang(detectedLang);
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

  // ── Toggle mic (uses MediaRecorder) ──
  const toggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setTextInput('');
      startRecording();
    }
  };

  // ── Submit ──
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    if (isRecording) stopRecording();
    if (isListening) { recRef.current?.stop(); setIsListening(false); }
    const v = textInput.trim();
    setTextInput('');
    finalRef.current = '';
    sendMessage(v);
  };

  const quickAsk = (en, hi) => sendMessage(lang === 'hi' ? hi : en);

  // ── Derived state ──
  const featItem  = news.length > 0 ? news[Math.min(featIdx, news.length - 1)] : null;
  const featCfg   = featItem ? getCfg(featItem.cat) : null;
  const micBusy   = isTranscribing || mutation.isPending;
  const micActive = isRecording || isListening;

  let micLabel = t.tapToSpeak;
  if (isRecording)    micLabel = t.recording;
  else if (isTranscribing) micLabel = t.transcribing;
  else if (isListening)    micLabel = t.listening;
  else if (isSpeaking)     micLabel = t.speaking;

  return (
    <div className="root">
      {/* HEADER */}
      <header className="hdr">
        <div className="hdr-left">
          <div className="hdr-icon-wrap"><Sprout size={20} strokeWidth={2.5} color="#fff" /></div>
          <div>
            <div className="hdr-title">{t.title}</div>
            <div className="hdr-sub">{t.sub}</div>
          </div>
        </div>
        <button className="lang-btn" onClick={() => setLang(l => l === 'hi' ? 'en' : 'hi')}>
          <Globe size={14} strokeWidth={2} />
          <span>{lang === 'hi' ? 'हिंदी' : 'English'}</span>
        </button>
      </header>

      <div className="body">
        {/* ════ LEFT PANEL ════ */}
        <div className="lp">
          <div className="tabs">
            {[
              { id: 'news',    Icon: Newspaper,    label: lang === 'hi' ? 'समाचार' : 'News' },
              { id: 'mandi',   Icon: ShoppingCart, label: t.mandiTitle },
              { id: 'weather', Icon: CloudSun,     label: t.weatherTitle },
            ].map(({ id, Icon, label }) => (
              <button key={id} className={`tab ${activeTab === id ? 'tab-active' : ''}`} onClick={() => setActiveTab(id)}>
                <Icon size={15} strokeWidth={2} /><span>{label}</span>
              </button>
            ))}
          </div>

          {/* ── NEWS TAB ── */}
          {activeTab === 'news' && (
            <div className="feed">
              <div className="news-toolbar">
                <div className="ntb-left">
                  <span className="ntb-title">{newsSource === 'ai' ? t.aiNews : t.cachedNews}</span>
                  <span className={`ntb-badge ${newsSource === 'ai' ? 'badge-ai' : 'badge-cache'}`}>
                    {newsSource === 'ai' ? (lang === 'hi' ? 'AI द्वारा' : 'AI Powered') : (lang === 'hi' ? 'डिफ़ॉल्ट' : 'Default')}
                  </span>
                </div>
                <button className={`refresh-btn ${newsLoading ? 'loading' : ''}`} onClick={() => fetchNews(lang)} disabled={newsLoading}>
                  <RefreshCw size={13} strokeWidth={2.5} />
                  {newsLoading ? t.loadingNews : t.refreshNews}
                </button>
              </div>

              {newsLoading && news.length === 0 && (
                <>
                  {[1,2,3].map(i => (
                    <div className="skel-card" key={i}>
                      <div className="skel-strip" />
                      <div className="skel-body">
                        <div className="skel skel-tag" /><div className="skel skel-h" />
                        <div className="skel skel-p" /><div className="skel skel-p short" />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {!newsLoading && featItem && featCfg && (
                <div className="feat-card" style={{ borderColor: featCfg.color + '35', background: `linear-gradient(135deg, ${featCfg.color}08 0%, #fff 60%)` }}>
                  <div className="feat-blob" style={{ background: `radial-gradient(circle, ${featCfg.color}18 0%, transparent 70%)` }} />
                  <div className="feat-top-row">
                    <div className="feat-icon" style={{ background: featCfg.color + '18', border: `1.5px solid ${featCfg.color}28` }}>
                      <featCfg.Icon size={22} strokeWidth={1.8} color={featCfg.color} />
                    </div>
                    <div className="feat-badges">
                      {featItem.urgent && <span className="urgent-pill"><Zap size={10} strokeWidth={3} /> {lang === 'hi' ? 'तत्काल' : 'URGENT'}</span>}
                      <span className="feat-cat-pill" style={{ color: featCfg.color, background: featCfg.color + '15' }}>{featItem.cat}</span>
                      {featItem.tag && <span className="feat-tag-pill">{featItem.tag}</span>}
                    </div>
                    <div className="feat-dots">
                      {news.map((_, i) => (
                        <button key={i} className={`fdot ${i === featIdx ? 'fdot-on' : ''}`}
                          style={i === featIdx ? { background: featCfg.color, width: '18px' } : {}}
                          onClick={() => setFeatIdx(i)} />
                      ))}
                    </div>
                  </div>
                  <h2 className="feat-title">{featItem.title}</h2>
                  <p className="feat-body">{featItem.body}</p>
                  <button className="feat-ask-btn" style={{ background: featCfg.color }}
                    onClick={() => sendMessage(`Tell me more about this: ${featItem.title}`)}>
                    <Mic size={13} strokeWidth={2.5} />{t.askThis}
                  </button>
                </div>
              )}

              {news.map((item, i) => {
                const cfg = getCfg(item.cat);
                return (
                  <article key={i}
                    className={`ncard ${item.urgent ? 'ncard-urg' : ''} ${i === featIdx ? 'ncard-sel' : ''}`}
                    style={{ '--ac': cfg.color, animationDelay: `${i * 40}ms` }}
                    onClick={() => setFeatIdx(i)}>
                    <div className="ncard-bar" style={{ background: cfg.color }} />
                    <div className="ncard-content">
                      <div className="ncard-row1">
                        {item.urgent && <span className="npill-urg"><Zap size={9} strokeWidth={3}/>{lang==='hi'?'अर्जेंट':'Urgent'}</span>}
                        <span className="npill-cat" style={{ color: cfg.color, background: cfg.color+'15', borderColor: cfg.color+'30' }}>{item.cat}</span>
                        {item.tag && <span className="npill-tag">{item.tag}</span>}
                      </div>
                      <h3 className="n-title">{item.title}</h3>
                      <p className="n-body">{item.body}</p>
                      <button className="n-ask" style={{ '--c': cfg.color }}
                        onClick={(e) => { e.stopPropagation(); sendMessage(`Tell me more about this: ${item.title}`); }}>
                        <Mic size={12} strokeWidth={2.5} />{t.askThis}<ChevronRight size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* ── MANDI TAB ── */}
          {activeTab === 'mandi' && (
            <div className="feed">
              <div className="mandi-bar">
                <div>
                  <div className="mb-title">{lang==='hi'?'आज के भाव':"Today's Rates"}</div>
                  <div className="mb-sub">{lang==='hi'?'नजदीकी मंडी से पुष्टि करें':'Confirm with your local mandi'}</div>
                </div>
                <div className="live-pill"><span className="live-dot"/>{t.liveLabel}</div>
              </div>
              {MANDI.map((r, i) => (
                <div className="mcard" key={i} style={{ animationDelay: `${i*50}ms` }}
                  onClick={() => quickAsk(`Tell me about ${r.name} prices today`, `आज ${r.nameHi} का भाव बताओ`)}>
                  <div className="mi-icon" style={{ background: r.up?'#f0fdf4':'#fff5f5', border:`1.5px solid ${r.up?'#bbf7d0':'#fecaca'}` }}>
                    <r.Icon size={20} strokeWidth={1.8} color={r.up?'#16a34a':'#dc2626'} />
                  </div>
                  <div className="mi-info">
                    <div className="mi-name">{lang==='hi'?r.nameHi:r.name}</div>
                    <div className="mi-range">H: ₹{r.high} · L: ₹{r.low}</div>
                  </div>
                  <div className="mi-right">
                    <div className="mi-price">₹{r.price}</div>
                    <div className={`mi-chg ${r.up?'up':'dn'}`}>
                      {r.up?<TrendingUp size={11} strokeWidth={2.5}/>:<TrendingDown size={11} strokeWidth={2.5}/>}
                      {r.change}
                    </div>
                  </div>
                  <ChevronRight size={16} strokeWidth={2} className="mi-arrow"/>
                </div>
              ))}
            </div>
          )}

          {/* ── WEATHER TAB ── */}
          {activeTab === 'weather' && (
            <div className="feed">
              <div className="w-now">
                <div className="w-left">
                  <Sun size={52} strokeWidth={1.5} color="#f59e0b" className="w-sun"/>
                  <div>
                    <div className="w-deg">28<span>°C</span></div>
                    <div className="w-city">{lang==='hi'?'नासिक, महाराष्ट्र':'Nashik, Maharashtra'}</div>
                    <div className="w-desc">{lang==='hi'?'आंशिक बादल':'Partly Cloudy'}</div>
                  </div>
                </div>
                <div className="w-pills">
                  {[
                    {Icon:Droplets,    val:'68%',     lbl:lang==='hi'?'नमी':'Humidity'},
                    {Icon:Wind,        val:'12 km/h', lbl:lang==='hi'?'हवा':'Wind'},
                    {Icon:Thermometer, val:'UV 6',    lbl:lang==='hi'?'UV':'UV Index'},
                  ].map(({Icon,val,lbl},i) => (
                    <div className="w-pill" key={i}>
                      <Icon size={14} strokeWidth={2} color="#0ea5e9"/>
                      <span className="wp-val">{val}</span>
                      <span className="wp-lbl">{lbl}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-fc-lbl">{lang==='hi'?'अगले 3 दिन':'Next 3 Days'}</div>
              <div className="w-fc-row">
                {[
                  {DI:CloudRain, day:lang==='hi'?'कल':'Tomorrow',      hi:26,lo:19, tip:t.noSpray,   tc:'#dc2626', bg:'#fff5f5', bc:'#fecaca'},
                  {DI:CloudRain, day:lang==='hi'?'परसों':'Day 3',       hi:24,lo:17, tip:t.heavyRain, tc:'#d97706', bg:'#fffbeb', bc:'#fde68a'},
                  {DI:Sun,       day:lang==='hi'?'तीसरे दिन':'Day 4',   hi:30,lo:21, tip:t.goodIrr,   tc:'#16a34a', bg:'#f0fdf4', bc:'#bbf7d0'},
                ].map((d,i) => (
                  <div className="w-fc-card" key={i} style={{background:d.bg, borderColor:d.bc}}>
                    <div className="wfc-day">{d.day}</div>
                    <d.DI size={32} strokeWidth={1.5} color={d.tc}/>
                    <div className="wfc-temp">{d.hi}° <span>/ {d.lo}°</span></div>
                    <div className="wfc-tip" style={{color:d.tc, background:d.tc+'18'}}>{d.tip}</div>
                  </div>
                ))}
              </div>
              <button className="w-ask-btn" onClick={() => quickAsk('Give me weather advice for my farm today','आज मेरी खेती के लिए मौसम की सलाह दो')}>
                <Mic size={16} strokeWidth={2.5}/>{lang==='hi'?'मौसम की सलाह पूछें':'Ask for weather advice'}
              </button>
            </div>
          )}
        </div>

        {/* ════ RIGHT PANEL ════ */}
        <div className="rp">
          <div className="rp-head">
            <div className={`rp-av ${isSpeaking?'av-spk':''} ${micActive?'av-lst':''}`}>
              <Sprout size={20} strokeWidth={2.5} color="#fff"/>
            </div>
            <div className="rp-info">
              <div className="rp-name">{lang==='hi'?'कृषि सहायक':'Agri Assistant'}</div>
              <div className={`rp-st ${isSpeaking?'st-spk':micActive?'st-lst':'st-ok'}`}>
                <span className="st-dot"/>
                {isSpeaking ? t.speaking : micActive ? micLabel : t.readyLabel}
              </div>
            </div>
            {isSpeaking && <Volume2 size={18} strokeWidth={2} className="spk-icon"/>}
          </div>

          <div className="chat">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role==='user'?'msg-u':'msg-b'}`}>
                {m.role==='system' && <div className="msg-av"><Sprout size={14} strokeWidth={2.5} color="#fff"/></div>}
                <div className="msg-bbl" style={{whiteSpace:'pre-line'}}>{m.content}</div>
              </div>
            ))}
            {mutation.isPending && (
              <div className="msg msg-b">
                <div className="msg-av"><Sprout size={14} strokeWidth={2.5} color="#fff"/></div>
                <div className="msg-bbl typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={msgEndRef}/>
          </div>

          <div className="chips">
            <button className="chip chip-o" onClick={()=>quickAsk('Check wheat price today','आज गेहूं का भाव बताओ')}>
              <ShoppingCart size={12} strokeWidth={2.5}/> {t.mandiTitle}
            </button>
            <button className="chip chip-s" onClick={()=>quickAsk('What is the weather like','मौसम कैसा है')}>
              <CloudSun size={12} strokeWidth={2.5}/> {t.weatherTitle}
            </button>
            <button className="chip chip-g" onClick={()=>quickAsk('What are crop price trends','फसल के भाव कैसे जाएंगे')}>
              <TrendingUp size={12} strokeWidth={2.5}/> {t.trendTitle}
            </button>
          </div>

          <div className="mic-zone">
            {micError && <div className="mic-err"><AlertCircle size={14} strokeWidth={2}/>{t.micError}</div>}
            {transcribeError && <div className="mic-err"><AlertCircle size={14} strokeWidth={2}/>{t.transcribeError}</div>}
            <div className="mic-wrap">
              {micActive && <><div className="mring r1"/><div className="mring r2"/></>}
              <button
                className={`mic-btn ${micActive ? 'mic-on' : ''}`}
                onClick={toggleMic}
                disabled={micBusy && !isRecording}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isTranscribing
                  ? <Loader2 size={30} strokeWidth={2.5} color="#fff" className="spin"/>
                  : isRecording
                    ? <MicOff size={30} strokeWidth={2.5} color="#fff"/>
                    : <Mic    size={32} strokeWidth={2.5} color="#fff"/>}
              </button>
            </div>
            <div className="mic-lbl">{micLabel}</div>
          </div>

          <form className="inp-row" onSubmit={handleSubmit}>
            <input className="inp" type="text" value={textInput}
              onChange={e=>setTextInput(e.target.value)}
              placeholder={isTranscribing ? (lang==='hi'?'ट्रांसक्राइब हो रहा है...':'Transcribing...') : t.textPlaceholder}
              disabled={isTranscribing}
            />
            <button type="submit" className={`send-btn ${textInput.trim()?'send-on':''}`} disabled={!textInput.trim() || micBusy}>
              <ArrowRight size={20} strokeWidth={2.5}/>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}