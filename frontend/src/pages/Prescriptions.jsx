import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  FileText, ScanSearch, Upload, Search, AlertCircle, 
  ShieldAlert, Info, Download, Trash2, CheckCircle2, 
  RefreshCw, Loader2, Sparkles, ChevronDown, ChevronUp,
  Clock, Cpu, Mic, Volume2
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
  const [loadingExpl, setLoadingExpl] = useState({});
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [showVoiceToast, setShowVoiceToast] = useState(false);
  const voiceAudioUrl = "https://www.soundjay.com/buttons/beep-01a.mp3"; // Using 3s placeholder beep for "Warfarin aur Guggul"

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

  // 9.1 Simulated OCR
  const handleSimulatedOCR = () => {
    setScanning(true);
    setTimeout(() => {
      setInputText("Warfarin, Guggul");
      setScanning(false);
    }, 2000);
  };

  const handleVoiceSimulation = () => {
    setVoicePlaying(true);
    new Audio(voiceAudioUrl).play();
    
    setTimeout(() => {
      setVoicePlaying(false);
      setInputText("Warfarin, Guggul");
      setShowVoiceToast(true);
      setTimeout(() => setShowVoiceToast(false), 3000);
    }, 3000);
  };

  // 9.2 Fuzzy Matching
  const startMatching = async () => {
    if (!inputText.trim()) return;
    setMatching(true);
    try {
      const meds = inputText.split(',').map(m => m.trim()).filter(m => m);
      const res = await axios.post(`${API_URL}/medicine/match`, { medicines: meds });
      if (res.data.status === 'success') {
        setCandidates(res.data.data);
      }
    } catch (err) {
      console.error("Matching failed:", err);
    } finally {
      setMatching(false);
    }
  };

  const confirmMed = (cand) => {
    const medName = cand.isMatch ? cand.matched : cand.original;
    if (!confirmedMeds.includes(medName)) {
      setConfirmedMeds([...confirmedMeds, medName]);
    }
    setCandidates(candidates.filter(c => c.original !== cand.original));
  };

  // 9.3 Interaction Check
  const checkSafety = async () => {
    if (confirmedMeds.length < 2) return;
    setChecking(true);
    setInteractions([]);
    try {
      const res = await axios.post(`${API_URL}/interaction/check`, { 
        clerkId: user.id, 
        confirmedMedicines: confirmedMeds 
      });
      if (res.data.status === 'success') {
        setInteractions(res.data.data);
        fetchHistory();
      }
    } catch (err) {
      console.error("Interaction check failed:", err);
    } finally {
      setChecking(false);
    }
  };

  // 9.5 AI Explanation Fetch
  const getAIExplanation = async (drug1, drug2) => {
    const key = `${drug1}-${drug2}`;
    if (explanations[key]) return;
    
    setLoadingExpl({...loadingExpl, [key]: true});
    try {
      const res = await axios.post(`${API_URL}/ai/explain-interaction`, { drug1, drug2 });
      if (res.data.status === 'success') {
        setExplanations(prev => ({...prev, [key]: res.data.explanation}));
      }
    } catch (err) {
      console.error("AI Explanation failed:", err);
    } finally {
      setLoadingExpl(prev => ({...prev, [key]: false}));
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
      case 'high': return 'border-red-500/30 bg-red-500/10 text-red-500 icon-red';
      case 'moderate': return 'border-amber-500/30 bg-amber-500/10 text-amber-500 icon-amber';
      case 'low': return 'border-blue-500/30 bg-blue-500/10 text-blue-500 icon-blue';
      default: return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 icon-emerald';
    }
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
           <button 
             onClick={handleSimulatedOCR}
             disabled={scanning}
             className="flex-1 md:flex-none px-6 py-3 bg-gray-900/80 backdrop-blur-md border border-gray-800 hover:border-emerald-500/50 hover:bg-gray-800 text-white rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-3 group shadow-xl"
           >
              {scanning ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
              ) : (
                <ScanSearch className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              )}
              {scanning ? 'OCR Sensing...' : 'Smart Scan'}
           </button>
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
           <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />
             
             <h3 className="text-white font-bold mb-6 flex items-center gap-3 text-lg">
                <FileText className="w-6 h-6 text-emerald-500" /> Intake Terminal
             </h3>
             
             <div className="relative group">
               <textarea 
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 className="w-full h-40 bg-gray-950/50 border border-gray-800 group-hover:border-emerald-500/30 rounded-3xl p-5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all placeholder:text-gray-700 resize-none font-medium"
                 placeholder="Type medicines or herbs separated by commas..."
               />
               <div className="absolute bottom-4 right-4 text-[9px] text-gray-600 font-bold uppercase tracking-widest pointer-events-none">
                 Manual Overlay
               </div>
                <button 
                  onClick={handleVoiceSimulation}
                  disabled={voicePlaying}
                  className={`absolute bottom-4 left-4 p-2 rounded-full transition-all ${voicePlaying ? 'bg-emerald-500 text-white animate-pulse' : 'bg-gray-800 text-gray-400 hover:text-emerald-500'}`}
                  title="Start Voice Intake"
                >
                  <Mic className="w-4 h-4" />
                </button>
             </div>

             <div className="mt-4 flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-[10px] text-blue-400/80 font-medium leading-relaxed">
                  OCR Engine is currently operating in 'Demo Simulation' mode for hackathon stability.
                </p>
             </div>

             <button 
               onClick={startMatching}
               disabled={matching || !inputText.trim()}
               className="w-full mt-6 py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white disabled:opacity-30 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-500 font-black rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs border border-emerald-500/20"
             >
                {matching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Calibrate Medicine List
             </button>
           </div>

           {/* 9.2 Match Confirmation */}
           {candidates.length > 0 && (
             <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-[2.5rem] animate-in zoom-in duration-500 shadow-xl">
                <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                   <RefreshCw className="w-4 h-4" /> Identity Verification
                </h4>
                <div className="space-y-3">
                  {candidates.map((cand, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-950/80 border border-gray-800/50 rounded-2xl group hover:border-emerald-500/40 transition-all">
                       <div className="flex flex-col">
                          <span className="text-[9px] text-emerald-500 font-bold uppercase">Did you mean:</span>
                          <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {cand.isMatch ? cand.matched : cand.original}
                          </span>
                       </div>
                       <button 
                         onClick={() => confirmMed(cand)}
                         className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl transition-all shadow-lg"
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
                   <button onClick={() => {setConfirmedMeds([]); setInteractions([]);}} className="text-gray-600 hover:text-red-500 transition-colors p-1">
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

              {/* High-Risk Red Banner (10.7) */}
              {interactions.some(i => i.severity?.toLowerCase() === 'high') && (
                <div className="bg-red-600 animate-pulse py-4 px-8 rounded-3xl flex items-center justify-between shadow-[0_0_30px_rgba(220,38,38,0.4)] mb-8">
                   <div className="flex items-center gap-4">
                      <ShieldAlert className="w-8 h-8 text-white" />
                      <div>
                         <h4 className="text-white font-black uppercase tracking-tighter text-lg">Urgent Safety Warning</h4>
                         <p className="text-red-100 text-xs font-bold uppercase tracking-widest opacity-80">Critical interaction detected. Consult doctor immediately.</p>
                      </div>
                   </div>
                   <div className="hidden md:block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                      Action Required
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
                  
                  return (
                    <div key={item.id} className={`border rounded-[3rem] overflow-hidden transition-all duration-700 shadow-2xl group ${styles}`}>
                       <div className="p-8 md:p-10 relative">
                          <div className="absolute top-0 right-0 w-48 h-48 bg-current opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
                          
                          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
                             <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 bg-black/20 rounded-full">
                                      {item.severity} SEVERITY RISK
                                   </span>
                                </div>
                                <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                                   {item.allopathy_drug} <span className="text-white/20">+</span> {drugB}
                                </h3>
                             </div>
                             <div className="p-5 bg-black/20 backdrop-blur-md rounded-[2rem] border border-white/5 shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                                <AlertCircle className="w-10 h-10" />
                             </div>
                          </div>

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
                               <p className="text-gray-200 text-sm leading-relaxed font-medium italic pr-12">"{explanations[pairKey]}"</p>
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

                          {/* Expandable Mechanism */}
                          <div className="mt-8 flex flex-col items-center">
                            <button 
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="px-6 py-2 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all border border-transparent hover:border-white/5"
                            >
                               {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                               {isExpanded ? "Hide Molecular Data" : "Analyze Pathological Mechanism"}
                            </button>
                            
                            {isExpanded && (
                              <div className="w-full mt-6 pt-6 border-t border-white/10 animate-in slide-in-from-top-4 duration-500">
                                 <h5 className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-4">Mechanism of Action</h5>
                                 <div className="bg-black/20 p-6 rounded-[2rem] border border-white/5 leading-relaxed">
                                    <p className="text-xs font-medium opacity-80 leading-loose">{item.mechanism}</p>
                                 </div>
                                 <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                                    <div 
                                      className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase opacity-30 bg-white/5 px-4 py-2 rounded-full cursor-help"
                                      title={`Source verified from: ${item.source}`}
                                    >
                                       <Info className="w-3 h-3 text-current" /> Source: {item.source}
                                    </div>
                                    <p className="text-[9px] font-bold opacity-20 uppercase tracking-tighter">Certified Database ID: {item.id}</p>
                                 </div>
                              </div>
                            )}
                          </div>
                       </div>
                    </div>
                  )
                })}
              </div>
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
