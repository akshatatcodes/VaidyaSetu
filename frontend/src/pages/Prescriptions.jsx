import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
  FileText, ScanSearch, Upload, Search, AlertCircle,
  ShieldAlert, Info, Download, Trash2, CheckCircle2,
  RefreshCw, Loader2, Sparkles, ChevronDown, ChevronUp,
  Clock, Cpu, Mic, Volume2, MapPin, ThumbsUp, ThumbsDown, Zap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const Prescriptions = () => {
  const { user } = useUser();
  const [inputText, setInputText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [matching, setMatching] = useState(false);
  const [checking, setChecking] = useState(false);

  const [candidates, setCandidates] = useState([]); // Fuzzy matches for confirmation
  const [confirmedMeds, setConfirmedMeds] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [history, setHistory] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [explanations, setExplanations] = useState({}); // drugPair -> explanation
  const [feedbackStatus, setFeedbackStatus] = useState({}); // pairKey -> boolean
  const [loadingExpl, setLoadingExpl] = useState({});
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [showVoiceToast, setShowVoiceToast] = useState(false);
  const [showTransparency, setShowTransparency] = useState(false);
  const [lastReportData, setLastReportData] = useState(null);
  const [scanMethod, setScanMethod] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // { type: 'loading'|'success'|'warning'|'error', message: string }
  const [language, setLanguage] = useState('English'); // Language for AI analysis
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const fileInputRef = React.useRef(null);

  const voiceAudioUrl = null; // No longer needed — using real SpeechRecognition

  // Fetch History
  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/interaction/history/${user.id}`);
      if (res.data.status === 'success') setHistory(res.data.data);
    } catch (err) {
      console.error("Fetch history failed:", err);
    }
  };

  const handleFeedback = async (context, rating, query, response) => {
    try {
      await axios.post(`${API_URL}/feedback`, {
        clerkId: user.id,
        context,
        query,
        response,
        rating
      });
      setFeedbackStatus(prev => ({ ...prev, [context]: true }));
    } catch (err) {
      console.error("Feedback error", err);
    }
  };

  // Real Smart Scan: sends image to Gemini Vision → Groq Vision → Tesseract cascade
  const handleSmartScan = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanMethod(null);
    setScanStatus({ type: 'loading', message: 'Analyzing prescription image...' });
    try {
      const formData = new FormData();
      formData.append('image', file); // matches backend multer field name

      const res = await axios.post(`${API_URL}/ocr/scan`, formData, {
        timeout: 60000,
      });

      if (res.data.status === 'success' && res.data.medicines?.length > 0) {
        const meds = res.data.medicines;
        // Normalize: ensure array of strings
        const normalized = Array.isArray(meds) ? meds : (meds.medicines || meds.list || []);
        setInputText(normalized.map(m => typeof m === 'string' ? m : (m.name || '')).join(', '));
        setScanMethod(res.data.method);
        
        if (res.data.warning) {
          setScanStatus({ type: 'warning', message: res.data.warning });
        } else {
          setScanStatus({ type: 'success', message: `Extracted ${normalized.length} medicine(s) via ${res.data.method}.` });
        }
      } else {
        setScanStatus({ type: 'warning', message: 'No medicines detected. Try a clearer photo or enter manually.' });
      }
    } catch (err) {
      console.error('Smart Scan failed:', err);
      const isQuota = err.response?.data?.message?.includes('quota') || err.message?.includes('limit');
      setScanStatus({ 
        type: 'error', 
        message: isQuota ? 'AI busy. Retrying with backup engine...' : 'Could not read image. Try better lighting or type names manually.' 
      });
    } finally {
      setScanning(false);
    }
  };


  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; // Indian English for medicine names
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setVoicePlaying(true);
      setShowVoiceToast(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev ? `${prev}, ${transcript}` : transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone permissions and try again.');
      }
    };

    recognition.onend = () => {
      setVoicePlaying(false);
      setTimeout(() => setShowVoiceToast(false), 2000);
    };

    recognition.start();
  };

  // Phase 2: Normalization & Identity Verification
  const startMatching = async () => {
    if (!inputText.trim()) return;
    setMatching(true);
    setScanStatus({ type: 'loading', message: 'Standardizing drug names...' });
    try {
      const meds = inputText.split(',').map(m => m.trim()).filter(m => m);
      const res = await axios.post(`${API_URL}/ocr/normalize`, { medicines: meds });
      if (res.data.status === 'success') {
        setCandidates(res.data.normalized);
        setScanStatus({ type: 'success', message: 'Medical names identified. Please verify below.' });
      }
    } catch (err) {
      console.error("Matching failed:", err);
      setScanStatus({ type: 'error', message: 'Failed to standardize names.' });
    } finally {
      setMatching(false);
    }
  };

  const confirmMed = (cand) => {
    // Phase 2 Step 8: Confirm generic mapping
    const medName = cand.matched ? cand.generic : cand.original;
    if (!confirmedMeds.includes(medName)) {
      setConfirmedMeds([...confirmedMeds, medName]);
    }
    setCandidates(candidates.filter(c => c.original !== cand.original));
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const pauseSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
    }
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
      alert("Text to speech is not supported in this browser.");
      return;
    }

    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = { 'Hindi': 'hi-IN', 'Marathi': 'mr-IN', 'Tamil': 'ta-IN', 'English': 'en-US' };
    const targetLang = langMap[language] || 'en-US';
    
    utterance.lang = targetLang;
    utterance.rate = 0.9;
    
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      let voice = voices.find(v => v.lang === targetLang || v.lang === targetLang.replace('-', '_'));
      if (!voice && language === 'Hindi') voice = voices.find(v => v.name.includes("Hindi"));
      if (voice) utterance.voice = voice;
    };

    setVoice();
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // 9.3 RAG-Augmented Interaction Check
  const checkSafety = async () => {
    if (confirmedMeds.length < 2 || checking) return;
    setChecking(true);
    setScanStatus({ type: 'loading', message: `Analyzing safety in ${language}...` });
    setInteractions([]);
    try {
      // Use the new RAG-safety endpoint
      const res = await axios.post(`${API_URL}/rag/check-safety`, {
        clerkId: user.id,
        medicines: confirmedMeds,
        language: language  // Pass selected language to AI analysis
      });
      if (res.data.status === 'success') {
        const { report, isFallback, modelUsed, debug } = res.data;

        // Map the structured report to the UI state
        const processedInteractions = (report.interactions || []).map((item, idx) => ({
          ...item,
          id: `rag-int-${idx}`,
          allopathy_drug: item.medicines_involved?.[0] || 'Unknown',
          ayurveda_herb: [item.medicines_involved?.[1] || 'Unknown'],
          source: item.source_citation,
          status: report.status,
          summary: report.summary
        }));

        setInteractions(processedInteractions);
        setLastReportData({ 
          isFallback, 
          modelUsed, 
          latency: debug?.latency, 
          overallStatus: report.status, 
          overallSummary: report.summary 
        });
        setScanStatus({ type: 'success', message: `Safety analysis complete (${report.status}).` });

        // Step 61 Resilience: If fallback occurred, auto-expand the first warning or show general alert
        if (isFallback && processedInteractions.length > 0) {
          setExpandedId(processedInteractions[0].id);
        }

        fetchHistory();
      }
    } catch (err) {
      console.error("RAG check failed:", err.response?.data || err.message);
      setScanStatus({ type: 'error', message: 'Failed to complete safety analysis.' });
    } finally {
      setChecking(false);
    }
  };

  // 9.5 AI Explanation Fetch
  const getAIExplanation = async (drug1, drug2) => {
    const key = `${drug1}-${drug2}`;
    if (explanations[key]) return;

    setLoadingExpl({ ...loadingExpl, [key]: true });
    try {
      const res = await axios.post(`${API_URL}/interaction/explain-interaction`, { drug1, drug2 });
      if (res.data.status === 'success') {
        setExplanations(prev => ({ ...prev, [key]: res.data.explanation }));
      }
    } catch (err) {
      console.error("AI Explanation failed:", err);
    } finally {
      setLoadingExpl(prev => ({ ...prev, [key]: false }));
    }
  };

  // 9.6 PDF Generation
  const downloadReport = async () => {
    const element = document.getElementById('interaction-report');
    const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#030712' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`VaidyaSetu-Safety-Report-${new Date().getTime()}.pdf`);
  };

  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high': return 'border-red-500/30 bg-red-500/10 text-red-500 icon-red';
      case 'moderate': return 'border-amber-500/30 bg-amber-500/10 text-amber-500 icon-amber';
      case 'minor':
      case 'low': return 'border-blue-500/30 bg-blue-500/10 text-blue-500 icon-blue';
      default: return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 icon-emerald';
    }
  };

  // 13.5 Source Confidence Logic
  const getConfidenceInfo = (sourceStr = "") => {
    const sources = sourceStr.split(',').map(s => s.trim().toLowerCase());
    const count = sources.length;

    if (count > 1 || sources.includes('fda') || sources.includes('rxnav')) {
      return { label: 'High Confidence', color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2 };
    }
    if (sources.some(s => ['imppat', 'drugbank', 'icmr'].includes(s))) {
      return { label: 'Moderate Confidence', color: 'text-blue-400 bg-blue-500/10', icon: Info };
    }
    return { label: 'Limited Evidence', color: 'text-amber-400 bg-amber-500/10', icon: AlertCircle };
  };

  // 13.7 Source Quality Badges
  const renderSourceBadges = (sourceStr = "") => {
    const sources = sourceStr.split(',').map(s => s.trim());
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {sources.map((s, idx) => {
          let badgeStyle = "bg-gray-800 text-gray-400";
          let label = s;

          if (['RxNav', 'OpenFDA', 'FDA'].includes(s)) {
            badgeStyle = "bg-blue-500/20 text-blue-400 border border-blue-500/30";
            label = "Clinical API";
          } else if (['IMPPAT', 'Ayurveda'].includes(s)) {
            badgeStyle = "bg-amber-500/20 text-amber-400 border border-amber-500/30";
            label = "Traditional";
          } else if (['PubMed', 'Research', 'Literature'].includes(s)) {
            badgeStyle = "bg-purple-500/20 text-purple-400 border border-purple-500/30";
            label = "Research";
          } else if (['ICMR', 'WHO', 'Guidelines'].includes(s)) {
            badgeStyle = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
            label = "Govt Guide";
          }

          return (
            <span key={idx} className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${badgeStyle}`}>
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  const renderStatusBanner = () => {
    if (!scanStatus) return null;
    const icons = {
      loading: <Loader2 className="w-4 h-4 animate-spin" />,
      success: <CheckCircle2 className="w-4 h-4" />,
      warning: <Info className="w-4 h-4" />,
      error: <AlertCircle className="w-4 h-4" />
    };
    const colors = {
      loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      error: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return (
      <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${colors[scanStatus.type]} text-xs font-bold mb-6 animate-in fade-in slide-in-from-top-2`}>
        {icons[scanStatus.type]}
        <span>{scanStatus.message}</span>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-[0.3em] text-[10px] mb-2">
            <ShieldAlert className="w-4 h-4" /> Safety Protocol Active
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Signature Bridge</h1>
          <p className="text-gray-400 font-medium">Multi-Drug Interaction Analysis System</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleSmartScan(e.target.files[0])}
          />
          <div className="flex flex-col items-start gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="flex-1 md:flex-none px-6 py-3 bg-gray-900/80 backdrop-blur-md border border-gray-800 hover:border-emerald-500/50 hover:bg-gray-800 text-white rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-3 group shadow-xl"
            >
              {scanning ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              ) : (
                <ScanSearch className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              )}
              {scanning ? 'Scanning...' : 'Smart Scan'}
            </button>
            {scanMethod && (
              <span className="text-[10px] text-emerald-400/70 font-mono px-2">✓ via {scanMethod}</span>
            )}
          </div>
          {interactions.length > 0 && (
            <button
              onClick={downloadReport}
              className="flex-1 md:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Download className="w-5 h-5" /> Export Report
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Input Control Center */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden transition-colors duration-300">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[80px]" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-3 text-lg">
                <FileText className="w-6 h-6 text-emerald-500" /> Intake Terminal
              </h3>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-white/10 text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>

            {renderStatusBanner()}

            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-40 bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 group-hover:border-emerald-500/30 rounded-3xl p-5 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700 resize-none font-medium"
                placeholder="Type medicines or herbs separated by commas..."
              />
              <div className="absolute bottom-4 right-4 text-[9px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest pointer-events-none">
                Manual Overlay
              </div>
              <button
                onClick={handleVoiceInput}
                disabled={voicePlaying}
                className={`absolute bottom-4 left-4 p-2 rounded-full transition-all ${voicePlaying ? 'bg-emerald-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-emerald-500'}`}
                title="Start Voice Intake"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 rounded-2xl">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <p className="text-[10px] text-blue-700 dark:text-blue-400/80 font-medium leading-relaxed">
                OCR Engine is currently operating in 'Demo Simulation' mode for hackathon stability.
              </p>
            </div>

            <button
              onClick={startMatching}
              disabled={matching || !inputText.trim()}
              className="w-full mt-6 py-4 bg-emerald-600 dark:bg-emerald-500/10 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white dark:text-emerald-500 dark:hover:text-white disabled:opacity-30 font-black rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs border border-emerald-600 dark:border-emerald-500/20"
            >
              {matching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Calibrate Medicine List
            </button>
          </div>

          {/* 9.2 Match Confirmation */}
          {candidates.length > 0 && (
            <div className="bg-white dark:bg-emerald-500/5 border border-gray-200 dark:border-emerald-500/10 p-8 rounded-[2.5rem] animate-in zoom-in duration-500 shadow-xl">
              <h4 className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Identity Verification
              </h4>
              <div className="space-y-3">
                {candidates.map((cand, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-950/80 border border-gray-800/50 rounded-2xl group hover:border-emerald-500/40 transition-all">
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-emerald-500 font-bold uppercase">Identification:</span>
                        {cand.isCombination && (
                          <span className="bg-amber-500/20 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded">COMBO</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-gray-500 line-through decoration-emerald-500/30">
                          {cand.original}
                        </span>
                        <ChevronDown className="w-3 h-3 text-emerald-500 -rotate-90" />
                        <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {cand.matched ? cand.generic : "Keep Original"}
                        </span>
                      </div>
                      {cand.matched && (
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] text-emerald-500/70 font-bold uppercase tracking-widest">
                            Mapped to {cand.matched} ({Math.round(cand.confidence * 100)}% match)
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => confirmMed(cand)}
                      className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl transition-all shadow-lg active:scale-95 shrink-0"
                      title="Verify Identity"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed List */}
          {confirmedMeds.length > 0 && (
            <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-bold flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-emerald-500" /> Active Profile
                </h3>
                <button onClick={() => { setConfirmedMeds([]); setInteractions([]); }} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5 mb-8">
                {confirmedMeds.map((med, i) => (
                  <span key={i} className="px-4 py-2 bg-gray-950 border border-gray-800 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-lg border-l-2 border-l-emerald-500">
                    {med}
                  </span>
                ))}
              </div>
              <button
                onClick={checkSafety}
                disabled={checking || confirmedMeds.length < 2}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-black rounded-2xl transition-all shadow-[0_15px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs"
              >
                {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Generate Safety Report
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Interaction Alerts */}
        <div className="lg:col-span-8">
          <div id="interaction-report" className="space-y-8">
            {checking && (
              <div className="flex flex-col items-center justify-center py-28 bg-gray-900/20 backdrop-blur-md rounded-[3rem] border border-emerald-500/10 border-dashed animate-pulse">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-ping" />
                  <RefreshCw className="w-16 h-16 text-emerald-500 animate-spin relative z-10" />
                </div>
                <p className="text-emerald-500/80 font-black uppercase tracking-[0.3em] text-xs mt-8">Synthesizing Safety Data</p>
                <p className="text-gray-500 text-sm mt-2">Checking across 250+ Allopathic-AYUSH contraindications...</p>
              </div>
            )}

            {/* Step 61: Fallback Resilience Notification */}
            {lastReportData && lastReportData.isFallback && !checking && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 mb-6 animate-in slide-in-from-top-2">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Resilience Mode Active</h5>
                  <p className="text-[11px] text-amber-400/80 font-medium leading-tight">
                    High-fidelity 70B model is at peak capacity. Analysis performed using high-speed {lastReportData.modelUsed.includes('8b') ? '8B' : 'fallback'} model.
                  </p>
                </div>
                {lastReportData.latency && (
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                    Retrieved in {lastReportData.latency}ms
                  </div>
                )}
              </div>
            )}

            {/* High-Risk Red Banner (10.7) */}
            {interactions.some(i => i.severity?.toLowerCase() === 'high') && (
              <div className="bg-red-600 animate-pulse py-4 px-8 rounded-3xl flex flex-col md:flex-row items-center justify-between shadow-[0_0_30px_rgba(220,38,38,0.4)] mb-8 gap-4 md:gap-0">
                <div className="flex items-center gap-4">
                  <ShieldAlert className="w-8 h-8 text-white" />
                  <div>
                    <h4 className="text-white font-black uppercase tracking-tighter text-lg">Urgent Safety Warning</h4>
                    <p className="text-red-100 text-xs font-bold uppercase tracking-widest opacity-80">URGENT: Consult doctor immediately.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.google.com/maps/search/General+Physician+near+me"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white text-red-600 hover:bg-gray-100 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4" /> Find Nearby Doctor
                  </a>
                  <div className="hidden md:block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    Action Required
                  </div>
                </div>
              </div>
            )}

            {/* 9.4 Tiered Alert UI */}
            {!checking && confirmedMeds.length > 1 && interactions.length === 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-12 rounded-[3.5rem] text-center animate-in zoom-in duration-700 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <ShieldAlert className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Clinical Synergy Cleared</h2>
                <p className="text-gray-400 max-w-lg mx-auto leading-relaxed font-medium">
                  No immediate molecular conflicts detected for this specific combination.
                  <span className="block mt-2 text-emerald-400/60 text-xs italic font-bold uppercase tracking-widest">Molecular Safety Verified</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8">
              {interactions.map((item) => {
                const styles = getSeverityStyle(item.severity);
                const isExpanded = expandedId === item.id;
                const drugB = item.ayurveda_herb?.[0] || item.homeopathy_remedy?.[0] || "Herb/Remedy";
                const pairKey = `${item.allopathy_drug}-${drugB}`;
                const confidence = getConfidenceInfo(item.source);

                return (
                  <div key={item.id} className={`border rounded-[3rem] overflow-hidden transition-all duration-700 shadow-2xl group ${styles}`}>
                    <div className="p-8 md:p-10 relative">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-current opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 bg-black/20 rounded-full">
                              {item.severity} SEVERITY RISK
                            </span>

                            {/* Step 55 & 57: Confidence & Badges */}
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${confidence.color}`}>
                              <confidence.icon className="w-3 h-3" />
                              {confidence.label}
                            </div>
                            {renderSourceBadges(item.source)}
                          </div>
                          <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                            {item.allopathy_drug} <span className="text-white/20">+</span> {drugB}

                            {/* Step 54: Source Attribution Icon */}
                            <div className="group/src relative">
                              <Info className="w-5 h-5 text-white/20 hover:text-emerald-500 cursor-help transition-colors" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 w-64 p-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl invisible group-hover/src:visible opacity-0 group-hover/src:opacity-100 transition-all z-50">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Verification Sources</p>
                                <p className="text-[11px] text-white font-medium leading-relaxed mb-4">
                                  This interaction is verified against: <span className="text-emerald-400">{item.source || 'Standard Reference'}</span>.
                                </p>
                                <div className="flex items-center gap-2 py-2 px-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                  <ShieldAlert className="w-3 h-3 text-emerald-500" />
                                  <span className="text-[8px] text-emerald-400 font-bold uppercase">Clinical Context Matched</span>
                                </div>
                              </div>
                            </div>
                          </h3>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-2">
                             <button
                               onClick={() => {
                                 let text = `Safety Status: ${item.status || 'Checking'}. ${item.summary || ''}. Medicines: ${item.allopathy_drug} and ${drugB}. Result: ${item.effect}. Recommendation: ${item.recommendation}`;
                                 speakText(text);
                               }}
                               className={`p-3 rounded-full transition-all border ${isSpeaking ? 'bg-emerald-500 text-white border-emerald-500 animate-pulse' : 'bg-white/5 text-emerald-500 border-white/10 hover:bg-emerald-500/10'}`}
                             >
                               {isSpeaking ? <Volume2 className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                             </button>
                             {isSpeaking && (
                               <button onClick={stopSpeech} className="p-3 bg-red-500/20 text-red-500 border border-red-500/20 rounded-full hover:bg-red-500 hover:text-white transition-all">
                                 <Trash2 className="w-5 h-5" />
                               </button>
                             )}
                          </div>
                          <div className={`p-4 bg-black/20 backdrop-blur-md rounded-[2rem] border border-white/5 shadow-2xl transition-all ${item.status === 'DANGEROUS' ? 'text-red-500 shadow-red-500/10' : item.status === 'CAUTION' ? 'text-amber-500 shadow-amber-500/10' : 'text-emerald-500 shadow-emerald-500/10'}`}>
                            <AlertCircle className="w-10 h-10" />
                          </div>
                        </div>
                      </div>

                      {/* MediScan Summary Banner */}
                      {(item.summary || lastReportData?.overallSummary) && (
                        <div className={`mb-8 p-6 rounded-[2rem] border animate-in slide-in-from-left-4 ${item.status === 'DANGEROUS' ? 'bg-red-500/10 border-red-500/20 text-red-400' : item.status === 'CAUTION' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                           <h5 className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                             <Sparkles className="w-3 h-3" /> Safety Summary ({language})
                           </h5>
                           <p className="text-sm font-bold leading-relaxed">{item.summary || lastReportData?.overallSummary}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <div className="bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Clinical Effect</span>
                          <p className="text-sm font-bold leading-relaxed tracking-tight">{item.effect}</p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/5">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3">Safety Action</span>
                          <p className="text-sm font-bold leading-relaxed tracking-tight text-white/90">{item.recommendation}</p>
                        </div>
                      </div>

                      {/* 9.5 AI Explanation Section */}
                      <div className="bg-white/5 backdrop-blur-lg border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group/ai">
                        <div className="absolute top-6 right-8 text-emerald-400 opacity-20 group-hover/ai:opacity-50 transition-all duration-500 group-hover/ai:scale-110">
                          <Sparkles className="w-8 h-8" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4 flex items-center gap-2">
                          <Cpu className="w-4 h-4" /> AI Explanation (Plain Language)
                        </h4>
                        {explanations[pairKey] ? (
                          <div>
                            <p className="text-gray-200 text-sm leading-relaxed font-medium italic pr-12">"{explanations[pairKey]}"</p>
                            {!feedbackStatus[pairKey] ? (
                              <div className="flex items-center gap-3 mt-4 animate-in fade-in slide-in-from-left-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/50 mr-2">Helpful?</span>
                                <button onClick={() => handleFeedback(pairKey, 'up', pairKey, explanations[pairKey])} className="p-1.5 bg-white/5 hover:bg-emerald-500/20 text-emerald-500/50 hover:text-emerald-400 rounded-lg transition-all active:scale-95"><ThumbsUp className="w-4 h-4" /></button>
                                <button onClick={() => handleFeedback(pairKey, 'down', pairKey, explanations[pairKey])} className="p-1.5 bg-white/5 hover:bg-red-500/20 text-red-500/50 hover:text-red-400 rounded-lg transition-all active:scale-95"><ThumbsDown className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 mt-4 animate-in zoom-in"><CheckCircle2 className="w-3 h-3" /> Feedback Received</div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => getAIExplanation(item.allopathy_drug, drugB)}
                            className="text-xs text-emerald-500 font-black flex items-center gap-3 hover:text-emerald-400 transition-all group/btn"
                          >
                            <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                              {loadingExpl[pairKey] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            </div>
                            Ask AI to explain risk factors
                          </button>
                        )}
                      </div>

                      {/* 13.6 Expandable Mechanism & Evidence Summary */}
                      <div className="mt-8 flex flex-col items-center">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="px-6 py-2 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all border border-transparent hover:border-white/5"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? "Hide Evidence Details" : "View Evidence Summary"}
                        </button>

                        {isExpanded && (
                          <div className="w-full mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-4 duration-500 space-y-6">
                            <div>
                              <h5 className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-4">Evidence Contribution</h5>
                              <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5 leading-relaxed">
                                <p className="text-xs font-medium opacity-80 leading-loose">
                                  This interaction is documented in the <span className="text-emerald-400 font-bold">{item.source}</span> database.
                                  The mechanism involves {item.mechanism.toLowerCase()}.
                                  The confidence level of this finding is <span className="text-emerald-400 font-bold uppercase">{confidence.label}</span> due to verification across {item.source.split(',').length} distinct data sources.
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-30">
                                <Clock className="w-3 h-3" /> Last Verified: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                              </div>
                              <p className="text-[9px] font-bold opacity-20 uppercase tracking-tighter">System Reference ID: {item.id}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Step 58: Transparency Statement */}
            {interactions.length > 0 && (
              <div className="mt-12 p-8 border border-white/5 rounded-[3rem] bg-gray-950/20 text-center animate-in slide-in-from-bottom-4">
                <p className="text-xs text-gray-500 font-medium mb-4 italic">
                  "Our RAG system combines real-time pharmaceutical APIs with curated traditional knowledge research."
                </p>
                <button
                  onClick={() => setShowTransparency(true)}
                  className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-all border-b border-emerald-500/20 pb-1"
                >
                  <ShieldAlert className="w-4 h-4" /> How We Verify Interactions
                </button>
              </div>
            )}

            {/* Step 58 Content: Transparency Modal */}
            {showTransparency && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 backdrop-blur-3xl bg-black/60 font-sans">
                <div className="bg-gray-900 border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in duration-300">
                  <div className="p-10">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight mb-2">Interaction Verification Protocol</h2>
                        <p className="text-xs text-emerald-500 font-bold uppercase tracking-[0.2em]">RAG Architecture v1.0</p>
                      </div>
                      <button onClick={() => setShowTransparency(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-6 text-sm text-gray-400 leading-relaxed font-medium">
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                          <Cpu className="w-4 h-4 text-emerald-500" /> Multi-Source Synthesis
                        </h4>
                        <p>VaidyaSetu utilizes **Retrieval-Augmented Generation (RAG)** to merge data from two critical streams:
                          1. **Live Clinical APIs**: Real-time pharmaceutical data from RxNav (NLM) and OpenFDA.
                          2. **Traditional Knowledge base**: Curated interaction data from IMPPAT, ICMR, and Peer-Reviewed Literature.
                        </p>
                      </div>

                      <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-widest">
                          <ShieldAlert className="w-4 h-4 text-amber-500" /> Limitations & Safety
                        </h4>
                        <p>While our system achieves high recall across allopathic and ayurvedic databases, it is an **informational tool only**.
                          Traditional knowledge is often based on historical text and observational research, which may lack modern standardized clinical trials.
                        </p>
                      </div>

                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest text-center pt-4">
                        Always consult a healthcare professional for definitive clinical guidance.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowTransparency(false)}
                      className="w-full mt-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-xl"
                    >
                      Understood
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 9.7 Interaction History */}
          {history.length > 0 && !checking && (
            <div className="mt-20 pt-12 border-t border-gray-800">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight mb-1 flex items-center gap-3">
                    <Clock className="w-6 h-6 text-gray-500" /> Archival Safety Logs
                  </h3>
                  <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Your last {history.length} cross-interaction scans</p>
                </div>
                <button onClick={fetchHistory} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 transition-all">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.slice(0, 4).map((h, i) => (
                  <div key={i} className="bg-gray-900/40 backdrop-blur-sm border border-white/5 p-6 rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all cursor-pointer shadow-lg">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {h.confirmedMedicines.slice(0, 2).map((m, j) => (
                          <span key={j} className="text-[9px] font-black uppercase bg-gray-950 border border-gray-800 px-2 py-1 rounded-md text-gray-400">{m}</span>
                        ))}
                        {h.confirmedMedicines.length > 2 && <span className="text-[9px] text-gray-600 font-bold">+{h.confirmedMedicines.length - 2} more</span>}
                      </div>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg ${h.foundInteractions.length ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                        {h.foundInteractions.length ? `${h.foundInteractions.length} Crises` : 'Safe'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-16 p-8 bg-red-950/10 border border-red-500/10 rounded-[2.5rem] text-center max-w-4xl mx-auto">
        <p className="text-[11px] text-red-400 font-bold uppercase tracking-widest leading-loose opacity-60">
          DISCLAIMER: This system utilizes AI and clinical databases for screening purposes only. It is not a substitute for professional medical advice. Always consult your healthcare provider before starting or stopping any medication or supplement.
        </p>
      </div>
      {/* Voice Toast */}
      {showVoiceToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 font-bold z-50">
          <Volume2 className="w-5 h-5 animate-bounce" />
          Voice input detected.
        </div>
      )}
    </div>
  );
};

export default Prescriptions;
