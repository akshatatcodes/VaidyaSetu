import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { 
  Pill, Camera, Plus, Trash2, X, 
  AlertTriangle, Clock, Search, Loader2,
  ShieldAlert, CheckCircle2, RefreshCw,
  Sparkles, Check, ChevronDown, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const TABS = [
  {
    key: 'CURRENT',
    label: 'Current',
    fullLabel: 'Current Medicines',
    dotColor: 'bg-emerald-500',
    emptyTitle: 'No Active Medications',
    emptyDesc: 'Track your daily medicines to help doctors analyze prescriptions and catch adverse drug interactions.',
    emptyIcon: Pill
  },
  {
    key: 'PREVIOUS',
    label: 'Previous',
    fullLabel: 'Previous Medicines',
    dotColor: 'bg-blue-500',
    emptyTitle: 'No Past Courses',
    emptyDesc: 'Completed antibiotic courses and temporary medications will be saved here for your medical record.',
    emptyIcon: Clock
  },
  {
    key: 'STOPPED',
    label: 'Stopped',
    fullLabel: 'Stopped Medicines',
    dotColor: 'bg-rose-500',
    emptyTitle: 'No Discontinued Medicines',
    emptyDesc: 'Medications discontinued due to side effects or doctor recommendations are logged here for reference.',
    emptyIcon: AlertTriangle
  },
  {
    key: 'NEEDS_CONFIRMATION',
    label: 'Needs Review',
    fullLabel: 'Needs Confirmation',
    dotColor: 'bg-amber-500',
    emptyTitle: 'No Pending Confirmations',
    emptyDesc: 'When you take a photo of a medicine strip or prescription, detected drugs will wait here for your one-tap review.',
    emptyIcon: ShieldAlert
  }
];

const POPULAR_MEDS = [
  { name: 'Paracetamol', dosage: '650mg' },
  { name: 'Metformin', dosage: '500mg' },
  { name: 'Pantoprazole', dosage: '40mg' },
  { name: 'Amoxicillin', dosage: '500mg' },
  { name: 'Cetirizine', dosage: '10mg' },
  { name: 'Telmisartan', dosage: '40mg' }
];

const DOSAGE_PRESETS = ['500mg', '650mg', '1 tablet', '1 capsule', '5ml'];

const MyMedicines = () => {
  const { currentUser } = useAuth();
  const targetPatientId = currentUser?.patientId || currentUser?.id || currentUser?.userId;

  const [activeBucket, setActiveBucket] = useState('CURRENT');
  const [medicines, setMedicines] = useState([]);
  const [buckets, setBuckets] = useState({ CURRENT: [], PREVIOUS: [], STOPPED: [], NEEDS_CONFIRMATION: [] });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDosage, setFormDosage] = useState('As prescribed');
  const [formFrequency, setFormFrequency] = useState('Daily');
  const [formSystem, setFormSystem] = useState('modern');
  const [formBucket, setFormBucket] = useState('CURRENT');
  const [bulkInput, setBulkInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const fetchMedicines = async () => {
    if (!targetPatientId) {
      setLoading(false);
      return;
    }
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
        setScanStatus({ type: 'success', message: `Detected ${names.length} medicine(s). Added to 'Needs Review' bucket.` });
        for (const name of names) {
          await addMedicineRecord({
            name,
            status: 'NEEDS CONFIRMATION',
            sourceTag: 'Document derived',
            dosage: 'As prescribed',
            frequency: 'Daily',
            system: 'modern'
          });
        }
        setActiveBucket('NEEDS_CONFIRMATION');
        fetchMedicines();
      } else {
        setScanStatus({ type: 'warning', message: 'No clear medicine names detected. Try adding manually.' });
      }
    } catch (err) {
      console.error('OCR scan failed:', err);
      setScanStatus({ type: 'error', message: 'Could not read image label. Please try adding manually.' });
    } finally {
      setScanning(false);
    }
  };

  const addMedicineRecord = async ({ name, status = 'CURRENT', sourceTag = 'Patient reported', dosage = 'As prescribed', frequency = 'Daily', system = 'modern' }) => {
    try {
      await axios.post(`${API_URL}/medications`, {
        patientId: targetPatientId,
        clerkId: targetPatientId,
        name: name.trim(),
        system,
        dosage: dosage.trim() || 'As prescribed',
        frequency: frequency.trim() || 'Daily',
        status: status === 'NEEDS_CONFIRMATION' ? 'NEEDS CONFIRMATION' : status,
        sourceTag
      });
    } catch (err) {
      console.error('Add medicine failed', err);
    }
  };

  const handleSaveMedication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isBulkMode) {
        if (!bulkInput.trim()) return;
        const names = bulkInput.split(/[\n,]+/).map(n => n.trim()).filter(Boolean);
        for (const name of names) {
          await addMedicineRecord({
            name,
            status: formBucket,
            sourceTag: 'Patient reported',
            dosage: 'As prescribed',
            frequency: 'Daily',
            system: 'modern'
          });
        }
        setBulkInput('');
      } else {
        if (!formName.trim()) return;
        await addMedicineRecord({
          name: formName.trim(),
          status: formBucket,
          sourceTag: 'Patient reported',
          dosage: formDosage,
          frequency: formFrequency,
          system: formSystem
        });
        setFormName('');
        setFormDosage('As prescribed');
        setFormFrequency('Daily');
      }
      setShowAddModal(false);
      fetchMedicines();
    } finally {
      setSubmitting(false);
    }
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
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-9 h-9 text-teal-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Loading medicines profile...</p>
      </div>
    );
  }

  const currentList = buckets[activeBucket] || [];
  const filteredList = currentList.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      m.dosage?.toLowerCase().includes(q) ||
      m.frequency?.toLowerCase().includes(q) ||
      m.sourceTag?.toLowerCase().includes(q)
    );
  });

  const totalCount = (buckets.CURRENT?.length || 0) + 
                     (buckets.PREVIOUS?.length || 0) + 
                     (buckets.STOPPED?.length || 0) + 
                     (buckets.NEEDS_CONFIRMATION?.length || 0);

  const activeTabConfig = TABS.find(t => t.key === activeBucket) || TABS[0];
  const EmptyIcon = activeTabConfig.emptyIcon;

  return (
    <div className="max-w-6xl mx-auto w-full pb-28 sm:pb-20 space-y-5 sm:space-y-6 px-1 sm:px-0">
      
      {/* ── TOP HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 sm:pt-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20 shrink-0">
            <Pill className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                My Medicines
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60 tabular-nums">
                {totalCount} {totalCount === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-1 sm:line-clamp-none mt-0.5">
              Active prescriptions, past treatments, and verification records
            </p>
          </div>
        </div>

        {/* 2-Column Action Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="flex items-center justify-center gap-2 py-2.5 px-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <Camera className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{scanning ? 'Scanning...' : 'Scan Label'}</span>
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
            onClick={() => {
              setFormBucket(activeBucket);
              setIsBulkMode(false);
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="truncate">Add Medicine</span>
          </button>
        </div>
      </div>

      {/* ── OCR / SCAN FEEDBACK BANNER ── */}
      {scanStatus && (
        <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-xs ${
          scanStatus.type === 'loading'
            ? 'bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-teal-900 dark:text-teal-200'
            : scanStatus.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
            : scanStatus.type === 'warning'
            ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
            : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {scanStatus.type === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-teal-600 dark:text-teal-400" />
            ) : scanStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            )}
            <span className="truncate">{scanStatus.message}</span>
          </div>
          <button 
            onClick={() => setScanStatus(null)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 4 CATEGORY TABS (SEGMENTED CONTROL - NEVER TRUNCATES) ── */}
      <div className="bg-slate-100/90 dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar border border-slate-200/50 dark:border-slate-700/50">
        {TABS.map(tab => {
          const count = (buckets[tab.key] || []).length;
          const isActive = activeBucket === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveBucket(tab.key)}
              className={`flex-1 min-w-fit px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs border border-slate-200/60 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dotColor} ${tab.key === 'NEEDS_CONFIRMATION' && count > 0 ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline whitespace-nowrap">{tab.fullLabel}</span>
              <span className="sm:hidden whitespace-nowrap">{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black tabular-nums transition-colors ${
                  isActive
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── SEARCH BAR (VISIBLE WHEN > 2 MEDICINES IN CURRENT BUCKET) ── */}
      {currentList.length > 2 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTabConfig.fullLabel.toLowerCase()}...`}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── MEDICINES LIST OR EMPTY STATE ── */}
      {filteredList.length > 0 ? (
        <div className="space-y-2.5 sm:space-y-3">
          {filteredList.map(med => (
            <div
              key={med._id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 group"
            >
              {/* Header row: Icon + Name + Tag + Delete */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    activeBucket === 'CURRENT'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                      : activeBucket === 'NEEDS_CONFIRMATION'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
                      : activeBucket === 'STOPPED'
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                      : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50'
                  }`}>
                    <Pill className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base leading-snug break-words">
                        {med.name}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                        {med.sourceTag || 'Patient reported'}
                      </span>
                    </div>
                    
                    {/* Dosage & Frequency Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 text-[11px] font-medium">
                        💊 {med.dosage || 'As prescribed'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 text-[11px] font-medium">
                        🕒 {med.frequency || 'Daily'}
                      </span>
                      {med.system && med.system !== 'modern' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/50 text-[11px] font-medium">
                          🌿 {med.system.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteMedicine(med._id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Delete medication"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Actions footer row */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {med.status === 'NEEDS CONFIRMATION' ? (
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={() => updateMedStatus(med._id, 'CURRENT')}
                      className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm & Move to Current</span>
                    </button>
                    <button
                      onClick={() => deleteMedicine(med._id)}
                      className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                ) : med.status === 'CURRENT' ? (
                  <>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active in profile
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateMedStatus(med._id, 'PREVIOUS')}
                        className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                      >
                        Past
                      </button>
                      <button
                        onClick={() => updateMedStatus(med._id, 'STOPPED')}
                        className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200/60 dark:border-rose-800/60 cursor-pointer transition-all"
                      >
                        Stop
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {med.status === 'STOPPED' ? 'Discontinued' : 'Past treatment'}
                    </span>
                    <button
                      onClick={() => updateMedStatus(med._id, 'CURRENT')}
                      className="py-1.5 px-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl border border-teal-200/60 dark:border-teal-800/60 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-3 h-3" /> Re-activate
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── INSPIRING EMPTY STATE ── */
        <div className="bg-gradient-to-b from-white to-slate-50/60 dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 text-center shadow-xs">
          <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-3.5">
            <div className="absolute inset-0 rounded-full bg-teal-500/10 dark:bg-teal-400/10 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-900 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <EmptyIcon className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
          </div>
          
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1">
            {activeTabConfig.emptyTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6 leading-relaxed">
            {activeTabConfig.emptyDesc}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-xs mx-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" /> Scan Label / Strip
            </button>
            <button
              onClick={() => {
                setFormBucket(activeBucket);
                setIsBulkMode(false);
                setShowAddModal(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Manually
            </button>
          </div>
        </div>
      )}

      {/* ── PORTAL MODAL: ADD MEDICATION (ISOLATED AT ROOT WITH PERFECT MOBILE & DESKTOP LAYOUT) ── */}
      {showAddModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm"
          style={{ margin: 0, padding: 0 }}
        >
          {/* Backdrop dismiss */}
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />

          {/* Modal Card */}
          <div 
            className="relative z-10 w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden"
            style={{ maxWidth: '480px' }}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    Add Medicine
                  </h3>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Target: <span className="font-bold text-teal-600 dark:text-teal-400">{activeTabConfig.label}</span>
                  </p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <form id="add-med-form" onSubmit={handleSaveMedication} className="flex-1 overflow-y-auto p-5 space-y-4">
              {!isBulkMode ? (
                <>
                  {/* Medicine Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Medicine Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Paracetamol, Metformin"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />

                    {/* Quick Popular Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar pt-2 pb-1">
                      {POPULAR_MEDS.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setFormName(item.name);
                            setFormDosage(item.dosage);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold whitespace-nowrap border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                          style={{ minHeight: '32px', minWidth: 'auto' }}
                        >
                          + {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dosage & Frequency Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={formDosage}
                        onChange={(e) => setFormDosage(e.target.value)}
                        placeholder="e.g. 500mg, 1 tab"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Frequency
                      </label>
                      <select
                        value={formFrequency}
                        onChange={(e) => setFormFrequency(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="Daily">Once Daily</option>
                        <option value="Twice daily">Twice Daily (BD)</option>
                        <option value="Thrice daily">Thrice Daily (TDS)</option>
                        <option value="As needed (SOS)">As needed (SOS)</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  </div>

                  {/* Dosage quick chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide no-scrollbar -mt-1">
                    {DOSAGE_PRESETS.map(dose => (
                      <button
                        key={dose}
                        type="button"
                        onClick={() => setFormDosage(dose)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border cursor-pointer shrink-0 transition-colors ${
                          formDosage === dose
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        style={{ minHeight: '26px', minWidth: 'auto' }}
                      >
                        {dose}
                      </button>
                    ))}
                  </div>

                  {/* Category Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category Bucket
                    </label>
                    <select
                      value={formBucket}
                      onChange={(e) => setFormBucket(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="CURRENT">Current (Active)</option>
                      <option value="PREVIOUS">Previous Course</option>
                      <option value="STOPPED">Stopped</option>
                      <option value="NEEDS_CONFIRMATION">Needs Confirmation</option>
                    </select>
                  </div>
                </>
              ) : (
                /* Bulk Paste */
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Paste Multiple Medicines (comma or newline separated)
                  </label>
                  <textarea
                    rows={4}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="e.g.&#10;Paracetamol 650mg&#10;Metformin 500mg&#10;Pantoprazole 40mg"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Each line will be added into your <span className="font-bold text-teal-600">{activeTabConfig.label}</span> bucket.
                  </p>
                </div>
              )}

              {/* Mode Toggle Link */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                  style={{ minHeight: 'auto', minWidth: 'auto' }}
                >
                  {isBulkMode ? '← Back to single medicine form' : '+ Or paste multiple medicines at once'}
                </button>
              </div>
            </form>

            {/* Modal Fixed Footer: Always visible on mobile & desktop */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <button
                type="submit"
                form="add-med-form"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black rounded-xl text-sm shadow-md shadow-teal-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Save Medicine</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default MyMedicines;
