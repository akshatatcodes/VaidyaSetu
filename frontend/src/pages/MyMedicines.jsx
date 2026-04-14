import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Pill, Camera, Upload, Plus, Trash2, RefreshCw, X, 
  Leaf, AlertTriangle, Utensils, Dumbbell, Heart, 
  ChevronDown, ChevronUp, Search, Loader2, FileText,
  ShieldAlert, Stethoscope, Info
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const MyMedicines = () => {
  const { user } = useUser();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [insights, setInsights] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchMedicines = async () => {
    try {
      const res = await axios.get(`${API_URL}/medications/${user.id}`);
      if (res.data.status === 'success') setMedicines(res.data.data);
    } catch (err) {
      console.error('Fetch medicines failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMedicines();
  }, [user]);

  const handleOCRScan = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanStatus({ type: 'loading', message: 'Analyzing medicine image...' });
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(`${API_URL}/ocr/scan`, formData, { timeout: 60000 });
      if (res.data.status === 'success' && res.data.medicines?.length > 0) {
        const meds = res.data.medicines;
        const normalized = Array.isArray(meds) ? meds : (meds.medicines || meds.list || []);
        const names = normalized.map(m => typeof m === 'string' ? m : (m.name || '')).filter(Boolean);
        setScanStatus({ type: 'success', message: `Detected ${names.length} medicine(s). Adding...` });
        for (const name of names) {
          await addMedicine(name);
        }
        fetchMedicines();
      } else {
        setScanStatus({ type: 'warning', message: 'No medicines detected. Try a clearer photo or add manually.' });
      }
    } catch (err) {
      console.error('OCR scan failed:', err);
      setScanStatus({ type: 'error', message: 'Could not read image. Try better lighting or enter names manually.' });
    } finally {
      setScanning(false);
    }
  };

  const addMedicine = async (name) => {
    try {
      await axios.post(`${API_URL}/medications`, {
        clerkId: user.id,
        name: name.trim(),
        dosage: 'As prescribed',
        frequency: 'daily',
        timings: ['09:00']
      });
    } catch (err) {
      console.error('Add medicine failed', err);
    }
  };

  const handleManualAdd = async () => {
    if (!manualInput.trim()) return;
    const names = manualInput.split(',').map(n => n.trim()).filter(Boolean);
    for (const name of names) {
      await addMedicine(name);
    }
    setManualInput('');
    setShowAddModal(false);
    fetchMedicines();
  };

  const deleteMedicine = async (id) => {
    try {
      await axios.delete(`${API_URL}/medications/${id}`);
      setMedicines(medicines.filter(m => m._id !== id));
      const newInsights = { ...insights };
      delete newInsights[id];
      setInsights(newInsights);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const getInsight = async (med) => {
    if (insights[med._id]) {
      setExpandedId(expandedId === med._id ? null : med._id);
      return;
    }
    setAnalyzingId(med._id);
    setExpandedId(med._id);
    try {
      const res = await axios.post(`${API_URL}/ai/medicine-insight`, {
        clerkId: user.id,
        medicineName: med.name
      });
      if (res.data.status === 'success') {
        setInsights(prev => ({ ...prev, [med._id]: res.data.data }));
      }
    } catch (err) {
      console.error('Insight fetch failed', err);
      setInsights(prev => ({ ...prev, [med._id]: { error: true } }));
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-pulse p-4">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-900 rounded-[2.5rem]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">My Medicines</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">Capture, track and get AI-powered insights for your ongoing medications</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            {scanning ? 'Scanning...' : 'Scan Medicine'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleOCRScan(e.target.files[0])}
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-emerald-500/50 transition-all shadow-xl text-gray-500 hover:text-emerald-500"
          >
            <Plus className="w-5 h-5" /> Add Manually
          </button>
        </div>
      </div>

      {/* Scan Status */}
      {scanStatus && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${
          scanStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
          scanStatus.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
          scanStatus.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
          'bg-blue-500/10 text-blue-500 border border-blue-500/20'
        }`}>
          {scanStatus.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {scanStatus.message}
          <button onClick={() => setScanStatus(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Medicine Cards */}
      {medicines.length > 0 ? (
        <div className="space-y-6">
          {medicines.map(med => {
            const insight = insights[med._id];
            const isExpanded = expandedId === med._id;
            const isAnalyzing = analyzingId === med._id;

            return (
              <div key={med._id} className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-xl overflow-hidden transition-all hover:border-emerald-500/20">
                {/* Medicine Header */}
                <div 
                  className="p-8 flex items-center justify-between cursor-pointer"
                  onClick={() => getInsight(med)}
                >
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl">
                      <Pill className="w-7 h-7 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{med.name}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {med.dosage} &bull; {med.frequency?.replace('_', ' ')} &bull; Added {new Date(med.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMedicine(med._id); }}
                      className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    ) : isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* AI Insight Panel */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
                    {isAnalyzing ? (
                      <div className="p-12 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                        <p className="text-sm font-bold text-gray-400">Analyzing with AI...</p>
                      </div>
                    ) : insight?.error ? (
                      <div className="p-8 text-center text-red-400 font-bold">Failed to load insights. Try again.</div>
                    ) : insight ? (
                      <div className="p-8 space-y-8">
                        {/* General Use */}
                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-3">
                          <div className="flex items-center gap-3">
                            <Stethoscope className="w-5 h-5 text-blue-500" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-blue-500">General Use</h4>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{insight.general_use}</p>
                          {insight.how_it_works && (
                            <p className="text-xs text-gray-500 italic">{insight.how_it_works}</p>
                          )}
                        </div>

                        {/* Allergy & Interaction Alerts */}
                        {(insight.allergy_alert && insight.allergy_alert !== 'None detected') && (
                          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-red-500 mb-2">Allergy Alert</h4>
                              <p className="text-red-400 text-sm">{insight.allergy_alert}</p>
                            </div>
                          </div>
                        )}

                        {(insight.drug_interactions && insight.drug_interactions !== 'No known interactions') && (
                          <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                            <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                            <div>
                              <h4 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-2">Drug Interactions</h4>
                              <p className="text-amber-600 dark:text-amber-400 text-sm">{insight.drug_interactions}</p>
                            </div>
                          </div>
                        )}

                        {/* Side Effects */}
                        {insight.common_side_effects?.length > 0 && (
                          <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Common Side Effects</h4>
                            <div className="flex flex-wrap gap-2">
                              {insight.common_side_effects.map((se, i) => (
                                <span key={i} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg">{se}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Natural Alternatives */}
                          {insight.natural_alternatives?.length > 0 && (
                            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4">
                              <div className="flex items-center gap-3">
                                <Leaf className="w-5 h-5 text-emerald-500" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">Natural Alternatives</h4>
                              </div>
                              {insight.natural_alternatives.map((alt, i) => (
                                <div key={i} className="p-4 bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{alt.name}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{alt.source}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">{alt.description}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Dietary Suggestions */}
                          {insight.dietary_suggestions?.length > 0 && (
                            <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-4">
                              <div className="flex items-center gap-3">
                                <Utensils className="w-5 h-5 text-amber-500" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-amber-500">Diet & Food Tips</h4>
                              </div>
                              <ul className="space-y-2">
                                {insight.dietary_suggestions.map((tip, i) => (
                                  <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Exercise Tips */}
                          {insight.exercise_tips?.length > 0 && (
                            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl space-y-3">
                              <div className="flex items-center gap-3">
                                <Dumbbell className="w-5 h-5 text-indigo-500" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-500">Exercise</h4>
                              </div>
                              <ul className="space-y-2">
                                {insight.exercise_tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Lifestyle Advice */}
                          {insight.lifestyle_advice && (
                            <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-3">
                              <div className="flex items-center gap-3">
                                <Heart className="w-5 h-5 text-purple-500" />
                                <h4 className="text-sm font-black uppercase tracking-widest text-purple-500">Lifestyle</h4>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{insight.lifestyle_advice}</p>
                            </div>
                          )}
                        </div>

                        {/* When to Consult Doctor */}
                        {insight.when_to_consult_doctor && (
                          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3">
                            <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-400 font-medium">{insight.when_to_consult_doctor}</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center bg-gray-50 dark:bg-gray-950/20 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
          <div className="p-10 bg-white dark:bg-gray-950 rounded-full w-max mx-auto mb-8 shadow-2xl">
            <Pill className="w-20 h-20 text-emerald-500/10" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest">No Medicines Added</h3>
          <p className="text-gray-500 max-w-sm mx-auto mt-3 font-medium text-lg leading-relaxed">Scan a medicine label or add your ongoing medications manually to get AI-powered insights.</p>
          <div className="flex gap-4 justify-center mt-8">
            <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl">
              <Camera className="w-5 h-5" /> Scan Medicine
            </button>
            <button onClick={() => setShowAddModal(true)} className="px-8 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-xl hover:border-emerald-500/50">
              <Plus className="w-5 h-5" /> Add Manually
            </button>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[3rem] w-full max-w-lg shadow-3xl overflow-hidden animate-in zoom-in duration-500">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Add Medicines</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Medicine Names (comma separated)</label>
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. Metformin 500mg, Amlodipine, Ashwagandha..."
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500 resize-none h-24"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium">Each medicine will be added to your ongoing list and you can get AI insights by clicking on it.</p>
            </div>
            <div className="p-8 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleManualAdd}
                disabled={!manualInput.trim()}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs disabled:opacity-30"
              >
                Add Medicines
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMedicines;
