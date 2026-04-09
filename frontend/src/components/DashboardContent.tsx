"use client";

import { useState, useEffect, useRef } from "react";
import { Activity, HeartPulse, AlertTriangle, Pill, X, BrainCircuit, ScanSearch, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import AutocompleteInput from "./AutocompleteInput";
import OnboardingModal from "./OnboardingModal";

export default function DashboardContent() {
  const { userId, isLoaded } = useAuth();
  const [diseases, setDiseases] = useState<string[]>([]);
  const [medicines, setMedicines] = useState<string[]>([]);
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [language, setLanguage] = useState("English");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text to Speech Logic Phase 6
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langMap: any = { 'Hindi': 'hi-IN', 'Marathi': 'mr-IN', 'Tamil': 'ta-IN', 'English': 'en-US' };
    utterance.lang = langMap[language] || 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // File Upload Handler Phase 5
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const formData = new FormData();
    formData.append("prescription", file);

    try {
      const res = await fetch("http://localhost:5000/api/ocr", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.status === "success" && Array.isArray(json.data)) {
        const newMeds = json.data.filter((m: string) => !medicines.includes(m));
        if (newMeds.length > 0) {
          setMedicines(prev => [...prev, ...newMeds]);
        }
      }
    } catch(e) {
      console.error("OCR Failed", e);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Fetch User Profile
  useEffect(() => {
    if (!isLoaded || !userId) return;

    fetch(`http://localhost:5000/api/user/${userId}`)
      .then(async res => {
        if (!res.ok) return null;
        try { const text = await res.text(); return JSON.parse(text); } catch { return null; }
      })
      .then(data => {
        if (data && data.status === "success") {
          const user = data.data;
          if (!user.onboardingComplete) {
            setShowOnboarding(true);
          } else {
            setDiseases(user.diseases || []);
            setMedicines(user.medicines || []);
          }
        }
      })
      .catch(console.error)
      .finally(() => setPageLoading(false));
  }, [isLoaded, userId]);

  // Sync state to backend when diseases/medicines change (if onboarding is done)
  useEffect(() => {
    if (pageLoading || showOnboarding || !userId) return;

    fetch("http://localhost:5000/api/user/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkId: userId, diseases, medicines })
    }).catch(console.error);

  }, [diseases, medicines, pageLoading, showOnboarding, userId]);


  // Analyze Engine Trigger
  useEffect(() => {
    if (diseases.length === 0 && medicines.length === 0) {
      setReport(null);
      return;
    }
    
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diseases, medicines, language })
        });
        if (!res.ok) return;
        const text = await res.text();
        let json;
        try { json = JSON.parse(text); } catch { return; }
        if (json && json.status === "success") {
          setReport(json.data);
        }
      } catch (err) {
        console.error("Analysis Failed:", err);
      } finally {
        setLoading(false);
      }
    };
    
    const timeout = setTimeout(fetchAnalysis, 500);
    return () => clearTimeout(timeout);
  }, [diseases, medicines, language]);


  const hasInteractions = report?.interactionWarnings?.length > 0;
  const healthScore = Math.max(0, 100 - (diseases.length * 10) - (report?.interactionWarnings?.length || 0) * 20);

  if (pageLoading) {
    return <div className="text-gray-500 py-12 text-center animate-pulse">Loading Profile...</div>;
  }

  return (
    <>
      {showOnboarding && userId && (
        <OnboardingModal 
          clerkId={userId} 
          onComplete={(u) => {
            setDiseases(u.diseases || []);
            setMedicines(u.medicines || []);
            setShowOnboarding(false);
          }} 
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Health Overview</h2>
          <p className="text-gray-500 text-sm">Real-time analysis in {language}</p>
        </div>
        <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1">
          {["English", "Hindi", "Marathi", "Tamil"].map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${language === lang ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-gray-300 font-medium mb-4 flex items-center"><Activity className="w-4 h-4 mr-2 text-emerald-500"/> My Conditions</h3>
          
          <AutocompleteInput 
            placeholder="Search for conditions..."
            fetchUrl="http://localhost:5000/api/lists/diseases"
            iconColorClass="emerald-600"
            onAdd={(val) => {
              if (!diseases.includes(val)) setDiseases([...diseases, val]);
            }}
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {diseases.map(d => (
              <span key={d} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm flex items-center">
                {d}
                <button onClick={() => setDiseases(diseases.filter(x => x !== d))} className="ml-2 text-gray-500 hover:text-red-400"><X className="w-3 h-3"/></button>
              </span>
            ))}
            {diseases.length === 0 && <span className="text-sm text-gray-600 italic">No conditions added.</span>}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-300 font-medium flex items-center"><Pill className="w-4 h-4 mr-2 text-blue-500"/> My Medications</h3>
            
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${isScanning ? 'bg-indigo-900/50 border-indigo-700 text-indigo-400 cursor-not-allowed' : 'bg-indigo-600/20 hover:bg-indigo-600/30 border-indigo-500/50 text-indigo-400 cursor-pointer shadow-[0_0_10px_rgba(99,102,241,0.2)]'}`}>
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <ScanSearch className="w-4 h-4 mr-2"/>}
              {isScanning ? "Scanning Image..." : "Scan Prescription"}
            </button>
          </div>
          
          <AutocompleteInput 
            placeholder="Search for medications..."
            fetchUrl="http://localhost:5000/api/lists/medicines"
            iconColorClass="blue-600"
            onAdd={(val) => {
              if (!medicines.includes(val)) setMedicines([...medicines, val]);
            }}
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {medicines.map(m => (
              <span key={m} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm flex items-center">
                {m}
                <button onClick={() => setMedicines(medicines.filter(x => x !== m))} className="ml-2 text-gray-500 hover:text-red-400"><X className="w-3 h-3"/></button>
              </span>
            ))}
            {medicines.length === 0 && <span className="text-sm text-gray-600 italic">No medications added.</span>}
          </div>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Health Score</h3>
            <div className={`p-2 rounded-lg ${diseases.length > 0 ? 'bg-emerald-500/10' : 'bg-gray-800'}`}><Activity className={`w-5 h-5 ${diseases.length > 0 ? 'text-emerald-500' : 'text-gray-500'}`} /></div>
          </div>
          <p className="text-4xl font-bold text-white">{diseases.length === 0 ? '--' : healthScore}<span className="text-xl text-gray-500">/100</span></p>
          <p className="text-sm text-gray-500 mt-2">{diseases.length === 0 ? "Not enough data" : loading ? "Calculating..." : "Based on active profile"}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Active Medicines</h3>
            <div className={`p-2 rounded-lg ${medicines.length > 0 ? 'bg-blue-500/10' : 'bg-gray-800'}`}><Pill className={`w-5 h-5 ${medicines.length > 0 ? 'text-blue-500' : 'text-gray-500'}`} /></div>
          </div>
          <p className="text-4xl font-bold text-white">{medicines.length}</p>
          <p className="text-sm text-gray-500 mt-2">{medicines.length === 0 ? "Upload prescriptions to track" : "Actively analyzing"}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Predicted Risks</h3>
            <div className={`p-2 rounded-lg ${report?.diseaseWarnings?.length > 0 ? 'bg-yellow-500/10' : 'bg-gray-800'}`}><HeartPulse className={`w-5 h-5 ${report?.diseaseWarnings?.length > 0 ? 'text-yellow-500' : 'text-gray-500'}`} /></div>
          </div>
          <p className={`text-3xl font-bold ${report?.diseaseWarnings?.length > 0 ? 'text-yellow-500' : 'text-gray-500'}`}>
            {report?.diseaseWarnings?.length > 0 ? `${report.diseaseWarnings.length} Active` : 'None'}
          </p>
          <p className="text-sm text-gray-500 mt-2 truncate">
            {report?.diseaseWarnings?.length > 0 ? report.diseaseWarnings[0].condition : 'No active risks detected'}
          </p>
        </div>

        <div className={`bg-gray-900 border rounded-2xl p-6 flex flex-col relative overflow-hidden transition-colors ${hasInteractions ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]' : 'border-gray-800'}`}>
          {hasInteractions && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>}
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-gray-400 font-medium">Interaction Alerts</h3>
            <div className={`p-2 rounded-lg ${hasInteractions ? 'bg-red-500/20' : 'bg-gray-800'}`}><AlertTriangle className={`w-5 h-5 ${hasInteractions ? 'text-red-500' : 'text-gray-500'}`} /></div>
          </div>
          <p className={`text-4xl font-bold relative z-10 ${hasInteractions ? 'text-red-500' : 'text-gray-500'}`}>{report?.interactionWarnings?.length || 0}</p>
          <p className="text-sm text-gray-500 mt-2 relative z-10">{hasInteractions ? "Critical conflicts detected" : "No interactions to show"}</p>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="lg:col-span-2 space-y-6">
          
          {/* Llama-3 AI Insight Panel */}
          {report && report.aiInsight && (
            <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.15)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <BrainCircuit className="w-6 h-6 mr-3 text-purple-400" /> 
                  VaidyaSetu AI Insight
                </h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => isSpeaking ? stopSpeech() : speakText(report.aiInsight)}
                    className="p-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-purple-300 transition-all"
                    title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                  >
                    {isSpeaking ? <X className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap relative z-10 mb-6">
                {report.aiInsight}
              </div>

              {report.alternatives && report.alternatives.length > 0 && (
                <div className="relative z-10 pt-4 border-t border-purple-500/20">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3">Suggested Indian Alternatives</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {report.alternatives.map((alt: any, i: number) => (
                      <div key={i} className="bg-black/20 border border-purple-500/10 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-white font-bold text-xs">{alt.name}</p>
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-900/40 text-purple-300 rounded uppercase">{alt.type}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-tight">{alt.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interaction Alerts Panel */}
          {report?.interactionWarnings?.map((warning: any, idx: number) => (
            <div key={idx} className="bg-red-950/30 border border-red-900 rounded-2xl p-6">
              <div className="flex items-start">
                <AlertTriangle className="w-8 h-8 text-red-500 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-1">Drug Interaction: {warning.medA} + {warning.medB}</h3>
                  <div className="inline-block px-2 py-1 mb-3 rounded text-xs font-semibold bg-red-900/50 text-red-300">
                    {warning.severity} Risk
                  </div>
                  <p className="text-gray-300 mb-3">{warning.reason}</p>
                  <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 border-l-2 border-l-red-500">
                    <p className="text-sm font-medium text-white">Action Required:</p>
                    <p className="text-sm text-gray-400">{warning.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Disease Advice Panel */}
          {report?.diseaseWarnings?.map((dw: any, idx: number) => (
            <div key={`dw-${idx}`} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-sm">{dw.condition} Protocol</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800/50 rounded-xl">
                  <h4 className="text-emerald-400 font-medium mb-2 text-sm">General Advice</h4>
                  <ul className="text-sm text-gray-300 space-y-2 list-disc list-inside">
                    {dw.generalAdvice.map((advice: string, i: number) => (
                      <li key={i}>{advice}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl">
                  <h4 className="text-emerald-400 font-medium mb-2 text-sm">AYUSH Recommendations</h4>
                  <p className="text-sm text-emerald-100">{dw.ayushAdvice}</p>
                </div>
              </div>
            </div>
          ))}

          {(!report?.interactionWarnings?.length && !report?.diseaseWarnings?.length) && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
              <Activity className="w-12 h-12 text-gray-800 mb-4" />
              <p className="text-gray-500">Add conditions or medications above to see AI analysis and safety protocols.</p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">Identified Profile</h2>
          
          <div className="space-y-6 flex-1 flex flex-col">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Identified Drugs</h4>
              <div className="space-y-3">
                {report?.identifiedMedicines?.map((m: any) => (
                  <div key={m.id} className="p-3 bg-gray-800/50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{m.name}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-md uppercase font-bold 
                      ${m.category === 'Ayurveda' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-blue-900/50 text-blue-400'}`}>
                      {m.category}
                    </span>
                  </div>
                ))}
                {(!report?.identifiedMedicines || report.identifiedMedicines.length === 0) && (
                  <p className="text-gray-600 text-sm text-center py-4 bg-gray-950 rounded-xl">No known medicines.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Unknown Inputs</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                {medicines.filter(m => !report?.identifiedMedicines?.find((im: any) => im.name.toLowerCase() === m.toLowerCase())).map(m => (
                  <li key={m} className="flex flex-center"><X className="w-4 h-4 text-gray-600 mr-2"/> {m}</li>
                ))}
                {medicines.filter(m => !report?.identifiedMedicines?.find((im: any) => im.name.toLowerCase() === m.toLowerCase())).length === 0 && (
                  <li className="text-gray-600 italic">All inputs recognized.</li>
                )}
              </ul>
            </div>
            
            <button className="w-full py-3 mt-auto border border-dashed border-emerald-700/50 text-emerald-500 rounded-xl hover:bg-emerald-900/20 transition-colors cursor-pointer text-sm font-medium">
              Validate with Physician
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
