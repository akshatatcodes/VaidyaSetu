import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Pill, Camera, Plus, Trash2, X, 
  Leaf, AlertTriangle, Utensils, Dumbbell, Heart, 
  ChevronDown, ChevronUp, Search, Loader2,
  ShieldAlert, Stethoscope, Info, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const MyMedicines = () => {
  const { currentUser } = useAuth();
  const targetPatientId = currentUser?.patientId || currentUser?.id;

  const [activeBucket, setActiveBucket] = useState('CURRENT'); // 'CURRENT' | 'PREVIOUS' | 'STOPPED' | 'NEEDS_CONFIRMATION'
  const [medicines, setMedicines] = useState([]);
  const [buckets, setBuckets] = useState({ CURRENT: [], PREVIOUS: [], STOPPED: [], NEEDS_CONFIRMATION: [] });
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
    if (!targetPatientId) return;
    try {
      const res = await axios.get(`${API_URL}/medications/patient/${targetPatientId}`);
      if (res.data.status === 'success') {
        setMedicines(res.data.data || []);
        if (res.data.buckets) {
          setBuckets(res.data.buckets);
        }
      }
    } catch (err) {
      console.error('Fetch medicines failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [targetPatientId]);

  const handleOCRScan = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanStatus({ type: 'loading', message: 'Analyzing medicine label with vision OCR...' });
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post(`${API_URL}/ocr/scan`, formData, { timeout: 60000 });
      if (res.data.status === 'success' && res.data.medicines?.length > 0) {
        const meds = res.data.medicines;
        const normalized = Array.isArray(meds) ? meds : (meds.medicines || meds.list || []);
        const names = normalized.map(m => typeof m === 'string' ? m : (m.name || '')).filter(Boolean);
        setScanStatus({ type: 'success', message: `Detected ${names.length} medicine(s). Added to 'Needs Confirmation' bucket.` });
        for (const name of names) {
          await addMedicine(name, 'NEEDS CONFIRMATION', 'Document derived');
        }
        fetchMedicines();
      } else {
        setScanStatus({ type: 'warning', message: 'No clear medicine names detected. Try adding manually.' });
      }
    } catch (err) {
      console.error('OCR scan failed:', err);
      setScanStatus({ type: 'error', message: 'Could not read image label.' });
    } finally {
      setScanning(false);
    }
  };

  const addMedicine = async (name, status = 'CURRENT', sourceTag = 'Patient reported') => {
    try {
      await axios.post(`${API_URL}/medications`, {
        patientId: targetPatientId,
        clerkId: targetPatientId,
        name: name.trim(),
        system: 'modern',
        dosage: 'As prescribed',
        frequency: 'daily',
        status: status,
        sourceTag: sourceTag
      });
    } catch (err) {
      console.error('Add medicine failed', err);
    }
  };

  const handleManualAdd = async () => {
    if (!manualInput.trim()) return;
    const names = manualInput.split(',').map(n => n.trim()).filter(Boolean);
    for (const name of names) {
      await addMedicine(name, activeBucket === 'NEEDS_CONFIRMATION' ? 'NEEDS CONFIRMATION' : activeBucket);
    }
    setManualInput('');
    setShowAddModal(false);
    fetchMedicines();
  };

  const updateMedStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_URL}/medications/${id}/status`, { status: newStatus });
      fetchMedicines();
    } catch (err) {
      console.error('Status transition failed', err);
    }
  };

  const deleteMedicine = async (id) => {
    try {
      await axios.delete(`${API_URL}/medications/${id}`);
      fetchMedicines();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  const currentList = buckets[activeBucket] || [];

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            My Medicines (§6 Buckets)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
            Categorized health profile medication records: Current, Previous, Stopped, and Needs Confirmation.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            Scan Medicine Label
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
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>
      </div>

      {/* 4 Bucket Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { key: 'CURRENT', label: 'Current Medicines', color: 'emerald' },
          { key: 'PREVIOUS', label: 'Previous Medicines', color: 'blue' },
          { key: 'STOPPED', label: 'Stopped', color: 'red' },
          { key: 'NEEDS_CONFIRMATION', label: 'Needs Confirmation', color: 'amber' }
        ].map(tab => {
          const count = (buckets[tab.key] || []).length;
          const isActive = activeBucket === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveBucket(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                isActive ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-800'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* OCR / Scan Status */}
      {scanStatus && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex items-center gap-3 text-xs font-bold text-teal-900">
          {scanStatus.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
          {scanStatus.message}
          <button onClick={() => setScanStatus(null)} className="ml-auto text-slate-500 hover:text-slate-800"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* List for Active Bucket */}
      {currentList.length > 0 ? (
        <div className="space-y-3">
          {currentList.map(med => (
            <div key={med._id} className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
                  <Pill size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base">{med.name}</h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {med.sourceTag || 'Patient reported'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    Dosage: {med.dosage} &bull; System: {med.system} &bull; Frequency: {med.frequency}
                  </p>
                </div>
              </div>

              {/* Bucket Transition Buttons */}
              <div className="flex items-center gap-2">
                {med.status === 'NEEDS CONFIRMATION' && (
                  <button
                    onClick={() => updateMedStatus(med._id, 'CURRENT')}
                    className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 cursor-pointer shadow-xs"
                  >
                    Confirm & Move to Current
                  </button>
                )}
                {med.status === 'CURRENT' && (
                  <button
                    onClick={() => updateMedStatus(med._id, 'STOPPED')}
                    className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 hover:bg-rose-100 cursor-pointer"
                  >
                    Mark Stopped
                  </button>
                )}
                {(med.status === 'STOPPED' || med.status === 'PREVIOUS') && (
                  <button
                    onClick={() => updateMedStatus(med._id, 'CURRENT')}
                    className="px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-200 border border-slate-200 cursor-pointer"
                  >
                    Re-activate (Current)
                  </button>
                )}
                <button
                  onClick={() => deleteMedicine(med._id)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
          <Pill size={32} className="mx-auto text-slate-400 mb-3" />
          <p className="text-slate-600 text-sm font-bold">No medications in '{activeBucket.replace('_', ' ')}' bucket</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white border border-slate-200 shadow-2xl rounded-3xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Add Medication into Archive</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer"><X size={18} /></button>
            </div>
            <textarea
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="e.g. Paracetamol 500mg, Metformin..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={3}
            />
            <button
              onClick={handleManualAdd}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl text-sm shadow-md transition-all cursor-pointer"
            >
              Add to {activeBucket.replace('_', ' ')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyMedicines;
