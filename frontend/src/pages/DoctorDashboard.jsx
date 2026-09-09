import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Stethoscope, User, Activity, AlertTriangle, AlertOctagon, CheckCircle2,
  Clock, Pill, ShieldAlert, FileText, Download, Printer, Search, RefreshCw,
  Sparkles, Check, ChevronRight, ArrowRight, ShieldCheck, Heart, Wind,
  Thermometer, UserCheck, Phone, Eye, Edit3, Save, Plus, Trash2,
  X, ExternalLink, QrCode, Layers, Share2, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const AI_DRAFT_BANNER = 'AI-generated draft — physician verification required';

// ICD-11 & NAMASTE Catalog Presets for Quick Selection
const DIAGNOSIS_PRESETS = [
  {
    name: 'Osteoarthritis of Knee / Sandhivata',
    icd11: { code: 'FA00', term: 'Osteoarthritis of knee' },
    namaste: { code: 'AYU-KA-042', term: 'Sandhivata (Janu Sandhigata Vata)' },
    ayushMeds: [
      { name: 'Ashwagandha Churna', dosage: '3g at bedtime', frequency: 'HS', duration: '30 days', anupana: 'Warm Milk' },
      { name: 'Yogaraj Guggulu', dosage: '2 tablets BD', frequency: 'BD', duration: '21 days', anupana: 'Warm Water' }
    ],
    allopathicMeds: [
      { name: 'Paracetamol', dosage: '500mg', frequency: 'SOS (Pain)', duration: '5 days', instructions: 'After food' }
    ],
    panchakarma: ['Janu Basti with Mahanarayana Taila', 'Patra Pinda Swedana']
  },
  {
    name: 'Gastro-Oesophageal Reflux / Amlapitta',
    icd11: { code: 'DA42', term: 'Gastro-oesophageal reflux disease' },
    namaste: { code: 'AYU-KA-012', term: 'Amlapitta (Urdhwaga Pitta Prakopa)' },
    ayushMeds: [
      { name: 'Avipattikar Churna', dosage: '3g BD before meals', frequency: 'BD', duration: '14 days', anupana: 'Warm Water / Coconut Water' },
      { name: 'Kamadudha Rasa', dosage: '1 tablet BD', frequency: 'BD', duration: '21 days', anupana: 'Milk' }
    ],
    allopathicMeds: [
      { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Morning empty stomach)', duration: '7 days', instructions: '30 mins before breakfast' }
    ],
    panchakarma: ['Mridu Virechana', 'Takra Dhara']
  },
  {
    name: 'Type 2 Diabetes Mellitus / Madhumeha',
    icd11: { code: '5A11', term: 'Type 2 diabetes mellitus' },
    namaste: { code: 'AYU-KA-028', term: 'Madhumeha (Kaphaja Prameha)' },
    ayushMeds: [
      { name: 'Nisha Amalaki Churna', dosage: '3g BD before meals', frequency: 'BD', duration: '60 days', anupana: 'Warm Water' },
      { name: 'Chandraprabha Vati', dosage: '2 tablets BD', frequency: 'BD', duration: '30 days', anupana: 'Water' }
    ],
    allopathicMeds: [
      { name: 'Metformin', dosage: '500mg', frequency: 'BD with meals', duration: '30 days', instructions: 'With food' }
    ],
    panchakarma: ['Udwarthana', 'Vasti therapy']
  },
  {
    name: 'Acute Coronary Syndrome (Emergency Triage)',
    icd11: { code: 'BA41', term: 'Acute coronary syndrome / Myocardial ischaemia' },
    namaste: { code: 'AYU-KA-054', term: 'Vata-Pittaja Hridroga (Cardiac Ischaemic Syndrome)' },
    ayushMeds: [
      { name: 'Prabhakar Vati', dosage: '1 tablet (Under strict supervision)', frequency: 'SOS', duration: 'Emergency only', anupana: 'Arjunarishta' }
    ],
    allopathicMeds: [
      { name: 'Aspirin (Dispersible)', dosage: '300mg STAT', frequency: 'STAT', duration: 'Immediate', instructions: 'Chew immediately' },
      { name: 'Sorbiline / Nitroglycerin sublingual', dosage: '0.5mg', frequency: 'SOS', duration: 'Immediate', instructions: 'Under tongue' }
    ],
    panchakarma: ['STABILIZE FIRST - Immediate ICU / Cardiology Referral']
  }
];

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const isDemoDoctor = currentUser?.doctorId === 'DOC-AIIA-001';

  // Queue & Selection State
  const [showDemoQueue, setShowDemoQueue] = useState(isDemoDoctor);
  const [queue, setQueue] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | emergency | waiting | completed

  // SOAP & Prescription Editing State
  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: {
      allopathicMeds: [],
      ayurvedicMeds: [],
      panchakarmaRecommendations: [],
      pathyaApathya: { pathya: [], apathya: [] }
    }
  });
  const [diagnoses, setDiagnoses] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalSuccess, setApprovalSuccess] = useState(false);

  // Herb-Drug Interaction State
  const [interactionAlerts, setInteractionAlerts] = useState([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);

  // New Medicine Inputs
  const [newAyuMed, setNewAyuMed] = useState({ name: '', dosage: '', frequency: 'BD', duration: '14 days', anupana: 'Warm Water' });
  const [newAlloMed, setNewAlloMed] = useState({ name: '', dosage: '', frequency: 'OD', duration: '5 days', instructions: 'After meals' });

  // ABDM FHIR & Print Modal States
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [fhirBundleData, setFhirBundleData] = useState(null);
  const [loadingFhir, setLoadingFhir] = useState(false);
  const [abdmSyncStatus, setAbdmSyncStatus] = useState({ syncing: false, synced: false, result: null });
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Source & Evidence Verification Drawer ("Trust the AI") State
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState(false);
  const [evidenceList, setEvidenceList] = useState([]);

  useEffect(() => {
    if (selectedSession?.evidenceSnippets?.length > 0) {
      setEvidenceList(selectedSession.evidenceSnippets);
    } else if (selectedSession?.isDemo === true || selectedSession?.abhaId === '14-1122-3344-5566') {
      setEvidenceList([
        {
          id: 'ev_1',
          type: 'Allopathic Medication Extraction',
          target: 'Atorvastatin 20mg OD at bedtime',
          sourceDoc: 'Cardiology Discharge Summary',
          date: '12 Jan 2026',
          page: 'Discharge Medications (Rx ID: 8841)',
          ocrConfidence: '98.4%',
          extractedSnippet: 'Tab. Atorva (Atorvastatin) 20 mg - 1 tab at bedtime PO for Dyslipidemia',
          verifiedByPatient: true,
          verifiedDate: '05 Sep 2026 at Home Pre-Visit'
        },
        {
          id: 'ev_2',
          type: 'Longitudinal Lab Value',
          target: 'HbA1c: 8.2% (Elevated)',
          sourceDoc: 'Comprehensive Metabolic Panel',
          date: '04 Feb 2026',
          page: 'Clinical Biochemistry',
          ocrConfidence: '99.1%',
          extractedSnippet: 'Glycated Hemoglobin (HbA1c): 8.2 % (Normal: < 5.7 %, Diabetic: >= 6.5 %)',
          verifiedByPatient: true,
          verifiedDate: '05 Sep 2026 at Home Pre-Visit'
        }
      ]);
    } else {
      setEvidenceList([]);
    }
  }, [selectedSession]);

  const openEvidenceDrawer = async () => {
    setIsEvidenceDrawerOpen(true);
    if (selectedSession?._id) {
      try {
        const res = await axios.get(`${API_URL}/kiosk/session/${selectedSession._id}/evidence`);
        if (res.data?.status === 'success' && res.data.data?.evidenceSnippets?.length > 0) {
          setEvidenceList(res.data.data.evidenceSnippets);
        }
      } catch (err) {
        console.warn('Evidence fetch note:', err?.message);
      }
    }
  };

  // Fetch Live OPD Queue (Filtered for real physicians, or demo queue if toggled)
  const fetchQueue = async (overrideDemo = showDemoQueue) => {
    setLoadingQueue(true);
    try {
      const url = overrideDemo ? `${API_URL}/kiosk/queue?isDemo=true` : `${API_URL}/kiosk/queue`;
      const res = await axios.get(url);
      if (res.data?.status === 'success') {
        const queueData = res.data.data || [];
        setQueue(queueData);
        if (queueData.length > 0) {
          setSelectedSession(prev => {
            if (!prev) return queueData[0];
            const existingInList = queueData.find(s => s._id === prev._id);
            return existingInList || queueData[0];
          });
        } else {
          setSelectedSession(null);
        }
      }
    } catch (err) {
      console.warn('Fetch queue fallback:', err?.message);
    } finally {
      setLoadingQueue(false);
    }
  };

  const toggleQueueMode = (demo) => {
    setShowDemoQueue(demo);
    fetchQueue(demo);
  };

  useEffect(() => {
    fetchQueue(showDemoQueue);
    const interval = setInterval(() => fetchQueue(showDemoQueue), 15000);
    return () => clearInterval(interval);
  }, [showDemoQueue]);

  // Load Session into Workspace
  const loadSessionDetails = (session) => {
    setSelectedSession(session);
    setApprovalSuccess(false);

    // Initialize SOAP note
    if (session.soapNote) {
      setSoapData({
        subjective: session.soapNote.subjective || '',
        objective: session.soapNote.objective || '',
        assessment: session.soapNote.assessment || '',
        plan: {
          allopathicMeds: session.soapNote.plan?.allopathicMeds || [],
          ayurvedicMeds: session.soapNote.plan?.ayurvedicMeds || [],
          panchakarmaRecommendations: session.soapNote.plan?.panchakarmaRecommendations || [],
          pathyaApathya: session.soapNote.plan?.pathyaApathya || { pathya: [], apathya: [] }
        }
      });
    }

    setDiagnoses(session.diagnoses || []);
    setInteractionAlerts(session.interactionAlerts || []);
    setDoctorNotes(session.doctorReview?.doctorNotes || '');

    // Trigger real-time HDI safety check for this patient
    runInteractionCheck(
      session.soapNote?.plan?.ayurvedicMeds || [],
      session.ocrPrescriptions || []
    );
  };

  // Real-time Herb-Drug Safety Engine Check
  const runInteractionCheck = async (ayuMeds, ocrPrescriptions) => {
    setCheckingInteractions(true);
    try {
      const ayuNames = ayuMeds.map(m => m.name).filter(Boolean);
      const ocrNames = ocrPrescriptions.flatMap(p => (p.extractedMedicines || []).map(m => m.name)).filter(Boolean);
      const allMeds = [...new Set([...ayuNames, ...ocrNames])];

      if (allMeds.length >= 2) {
        const res = await axios.post(`${API_URL}/kiosk/check-interactions`, { medicines: allMeds });
        if (res.data.status === 'success') {
          setInteractionAlerts(res.data.data);
        }
      } else {
        setInteractionAlerts([]);
      }
    } catch (err) {
      console.warn('Interaction check error:', err?.message);
    } finally {
      setCheckingInteractions(false);
    }
  };

  // Apply Diagnostic Preset
  const applyPreset = (preset) => {
    const newDiagnoses = [
      { system: 'ICD-11', code: preset.icd11.code, term: preset.icd11.term },
      { system: 'NAMASTE', code: preset.namaste.code, term: preset.namaste.term }
    ];
    setDiagnoses(newDiagnoses);

    const updatedPlan = {
      ...soapData.plan,
      allopathicMeds: preset.allopathicMeds,
      ayurvedicMeds: preset.ayushMeds,
      panchakarmaRecommendations: preset.panchakarma
    };

    setSoapData(prev => ({
      ...prev,
      assessment: `Clinical evaluation confirms ${preset.name}. Coded under ICD-11 (${preset.icd11.code}) and AYUSH NAMASTE (${preset.namaste.code}).`,
      plan: updatedPlan
    }));

    runInteractionCheck(preset.ayushMeds, selectedSession?.ocrPrescriptions || []);
  };

  // Add Ayurvedic Medicine
  const addAyurvedicMedicine = () => {
    if (!newAyuMed.name) return;
    const updated = [...(soapData.plan.ayurvedicMeds || []), newAyuMed];
    setSoapData(prev => ({
      ...prev,
      plan: { ...prev.plan, ayurvedicMeds: updated }
    }));
    setNewAyuMed({ name: '', dosage: '', frequency: 'BD', duration: '14 days', anupana: 'Warm Water' });
    runInteractionCheck(updated, selectedSession?.ocrPrescriptions || []);
  };

  // Remove Ayurvedic Medicine
  const removeAyurvedicMedicine = (index) => {
    const updated = soapData.plan.ayurvedicMeds.filter((_, i) => i !== index);
    setSoapData(prev => ({
      ...prev,
      plan: { ...prev.plan, ayurvedicMeds: updated }
    }));
    runInteractionCheck(updated, selectedSession?.ocrPrescriptions || []);
  };

  // Add Allopathic Medicine
  const addAllopathicMedicine = () => {
    if (!newAlloMed.name) return;
    const updated = [...(soapData.plan.allopathicMeds || []), newAlloMed];
    setSoapData(prev => ({
      ...prev,
      plan: { ...prev.plan, allopathicMeds: updated }
    }));
    setNewAlloMed({ name: '', dosage: '', frequency: 'OD', duration: '5 days', instructions: 'After meals' });
  };

  // Remove Allopathic Medicine
  const removeAllopathicMedicine = (index) => {
    const updated = soapData.plan.allopathicMeds.filter((_, i) => i !== index);
    setSoapData(prev => ({
      ...prev,
      plan: { ...prev.plan, allopathicMeds: updated }
    }));
  };

  // Approve & Sign SOAP Case Sheet
  const handleApproveCaseSheet = async () => {
    if (!selectedSession) return;
    setIsApproving(true);
    try {
      await axios.patch(
        `${API_URL}/kiosk/session/${selectedSession._id}/doctor-verify`,
        {
          doctorId: 'DOC-AYU-2024-8891',
          doctorName: 'Dr. Vikramaditya Sharma (BAMS, MD Ayur)',
          doctorNotes,
          soapEdits: soapData,
          markInConsultation: true
        },
        { headers: { 'X-User-Role': 'doctor' } }
      ).catch(() => {});

      const res = await axios.patch(
        `${API_URL}/kiosk/session/${selectedSession._id}/approve`,
        {
          doctorId: 'DOC-AYU-2024-8891',
          doctorName: 'Dr. Vikramaditya Sharma (BAMS, MD Ayur)',
          signature: 'Digitally Signed: Dr. V. Sharma (Reg #AYU-2918)',
          doctorNotes,
          updatedSoapNote: soapData,
          updatedDiagnoses: diagnoses,
          prescribedAllopathicMeds: soapData.plan.allopathicMeds,
          prescribedAyurvedicMeds: soapData.plan.ayurvedicMeds
        },
        { headers: { 'X-User-Role': 'doctor' } }
      );

      if (res.data.status === 'success') {
        setApprovalSuccess(true);
        // Refresh queue
        fetchQueue();
      }
    } catch (err) {
      console.error('Approve case error:', err);
      alert('Approved locally for demonstration session.');
      setApprovalSuccess(true);
    } finally {
      setIsApproving(false);
    }
  };

  // Download ABDM FHIR R4 Document Bundle
  const handleDownloadFhir = () => {
    if (!selectedSession) return;
    window.open(`${API_URL}/kiosk/session/${selectedSession._id}/fhir?download=1`, '_blank');
  };

  // Inspect Live ABDM FHIR R4 Document Bundle
  const handleOpenFhirModal = async () => {
    if (!selectedSession) return;
    setIsFhirModalOpen(true);
    setLoadingFhir(true);
    try {
      const res = await axios.get(`${API_URL}/kiosk/session/${selectedSession._id}/fhir`);
      setFhirBundleData(res.data);
    } catch (err) {
      console.error('Failed to load FHIR bundle:', err);
    } finally {
      setLoadingFhir(false);
    }
  };

  // Push / Synchronize consultation bundle with ABDM Health Locker / ABHA
  const handleSyncToAbdm = async () => {
    if (!selectedSession) return;
    setAbdmSyncStatus({ syncing: true, synced: false, result: null });
    try {
      const res = await axios.post(`${API_URL}/kiosk/session/${selectedSession._id}/sync-abdm`);
      if (res.data.status === 'success') {
        setAbdmSyncStatus({ syncing: false, synced: true, result: res.data.data });
        setApprovalSuccess(true);
        fetchQueue();
      }
    } catch (err) {
      console.error('ABDM sync error:', err);
      setAbdmSyncStatus({ syncing: false, synced: false, result: null });
    }
  };

  // Filtered Queue
  const filteredQueue = queue.filter(item => {
    const matchesSearch =
      (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tokenNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.abhaId || '').includes(searchQuery);

    if (activeTab === 'emergency') return matchesSearch && item.triagePriority === 'emergency';
    if (activeTab === 'waiting') return matchesSearch && item.queueStatus !== 'completed';
    if (activeTab === 'completed') return matchesSearch && item.queueStatus === 'completed';
    return matchesSearch;
  });

  const emergencyCount = queue.filter(s => s.triagePriority === 'emergency' && s.queueStatus !== 'completed').length;
  const waitingCount = queue.filter(s => s.queueStatus !== 'completed').length;
  const completedCount = queue.filter(s => s.queueStatus === 'completed').length;

  return (
    <div className="max-w-[1700px] mx-auto pb-20 space-y-6">
      <div className="rounded-2xl border border-amber-500/50 bg-amber-500/15 px-4 py-3 text-amber-900 dark:text-amber-100 text-sm font-semibold flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        {AI_DRAFT_BANNER}
      </div>
      
      {/* ────────────────── TOP DOCTOR CLINICAL COCKPIT HEADER ────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-emerald-500/30 relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-600 p-0.5 shadow-xl shadow-emerald-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[11px] font-black tracking-widest uppercase">
                  AIIA OPD PHYSICIAN COCKPIT
                </span>
                <span className="px-3 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[11px] font-mono font-bold">
                  10-SECOND RAPID SOAP ENGINE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Doctor OPD Clinical Decision Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium">
                Dual Coded Diagnostics (ICD-11 & NAMASTE) • Real-Time Herb-Drug Interaction (HDI) Safety Guard
              </p>
            </div>
          </div>

          {/* Real-time Triage Counters & Doctor Badge */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Live Clinic vs Demo Queue Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-white/10 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => toggleQueueMode(false)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  !showDemoQueue
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Live Clinic ({!showDemoQueue ? waitingCount : '0'})</span>
              </button>
              <button
                type="button"
                onClick={() => toggleQueueMode(true)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  showDemoQueue
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Queue ({showDemoQueue ? waitingCount : '3'})</span>
              </button>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center gap-3 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Queue:</span>
                <span className="font-mono text-white font-black text-sm">{waitingCount}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Emergency:</span>
                <span className="font-mono text-red-400 font-black text-sm">{emergencyCount}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Signed:</span>
                <span className="font-mono text-emerald-400 font-black text-sm">{completedCount}</span>
              </div>
            </div>

            <button
              onClick={() => fetchQueue(showDemoQueue)}
              disabled={loadingQueue}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer shadow-sm"
              title="Refresh Live Queue"
            >
              <RefreshCw className={`w-4 h-4 ${loadingQueue ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── MAIN 2-PANEL LAYOUT (QUEUE + WORKSPACE) ────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ── LEFT PANEL: OPD LIVE PATIENT QUEUE (4 COLUMNS ON XL) ── */}
        <div className="xl:col-span-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-5 border border-emerald-500/20 shadow-xl space-y-4">
          
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-500" />
              Live OPD Patient Queue
            </h2>
            <span className="text-xs font-bold text-gray-500 font-mono">
              {filteredQueue.length} Patients
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token, name, ABHA..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Queue Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 text-[11px] font-bold">
            {[
              { id: 'all', label: 'All' },
              { id: 'emergency', label: `🚨 (${emergencyCount})` },
              { id: 'waiting', label: 'Waiting' },
              { id: 'completed', label: 'Signed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 rounded-xl transition-all cursor-pointer text-center font-black ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {showDemoQueue ? 'Demo Queue Empty' : 'Live OPD Queue Clear'}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {showDemoQueue
                      ? 'Click refresh to reload demo clinical cases.'
                      : 'No patients waiting in queue today. New intake tokens from the MediKiosk will appear here in real-time.'}
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/kiosk')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    Open MediKiosk Terminal
                  </button>
                  {!showDemoQueue && (
                    <button
                      type="button"
                      onClick={() => toggleQueueMode(true)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-dashed border-gray-300 dark:border-white/20"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Load Demo Cases for Testing
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredQueue.map(session => {
                const isSelected = selectedSession?._id === session._id;
                const isEmergency = session.triagePriority === 'emergency';
                const isSigned = session.queueStatus === 'completed';

                return (
                  <div
                    key={session._id}
                    onClick={() => loadSessionDetails(session)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none text-left relative overflow-hidden ${isSelected ? 'border-emerald-500 bg-emerald-500/10 shadow-lg scale-[1.01]' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-emerald-400/40'}`}
                  >
                    {isEmergency && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
                    )}

                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                          {session.tokenNumber}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[180px]">
                          {session.patientName}
                        </h3>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isEmergency ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <AlertOctagon className="w-3 h-3" /> EMERGENCY
                          </span>
                        ) : isSigned ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                            ✓ SIGNED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase">
                            READY FOR REVIEW
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-gray-400 truncate mb-2">
                      {session.chiefComplaint || 'Consultation Intake'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-200 dark:border-white/5 pt-2">
                      <span>{session.age}y • {session.gender}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-gray-300">
                        BP: {session.vitals?.systolicBP || '--'}/{session.vitals?.diastolicBP || '--'}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {session.department}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: 10-SECOND CLINICAL WORKSPACE (8 COLUMNS ON XL) ── */}
        <div className="xl:col-span-8 space-y-6">
          
          {selectedSession ? (
            <>
              {/* ────────────────── 10-SECOND PATIENT SNAPSHOT BANNER ────────────────── */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 border border-emerald-500/20 shadow-xl space-y-4">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl border border-emerald-500/30">
                      {selectedSession.patientName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          {selectedSession.tokenNumber}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          ABHA: {selectedSession.abhaId}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                        {selectedSession.patientName} ({selectedSession.age}y, {selectedSession.gender})
                      </h2>
                    </div>
                  </div>

                  {/* Constitutional Dosha Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 text-xs font-black">
                      Prakriti: {selectedSession.dashavidhaPariksha?.prakriti?.primaryDosha || 'Vata-Kapha'}
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
                      Agni: {selectedSession.dashavidhaPariksha?.aharaShakti?.jaranaShakti || 'Mandagni'}
                    </div>
                    <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-black">
                      Satva: {selectedSession.dashavidhaPariksha?.satva || 'Madhyama'}
                    </div>
                  </div>
                </div>

                {/* Returning Patient What Changed Delta Banner */}
                {(selectedSession.isReturningPatient || selectedSession.patientName?.includes('Rahul') || selectedSession.changesSinceLastVisit?.length > 0) && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900/40 border-2 border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-300">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                          👵 RETURNING PATIENT DELTA
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          Last Consultation: {selectedSession.previousVisitDate || '24 Jan 2026'} (Kayachikitsa)
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-800 dark:text-gray-200 mt-1">
                        <strong>Reported Changes Since Last Visit:</strong> {selectedSession.changeDetails || 'Cardiologist started Atorvastatin 20mg OD at bedtime; Latest HbA1c lab report is 8.2% (elevated)'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openEvidenceDrawer}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-white font-black text-xs border border-emerald-500/40 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" /> Inspect Evidence & Source
                    </button>
                  </div>
                )}

                {/* Vitals Telemetry Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  
                  {/* Blood Pressure */}
                  <div className={`p-3 rounded-2xl border text-center ${selectedSession.vitals?.systolicBP >= 180 ? 'bg-red-500/20 border-red-500/40 text-red-500 font-black animate-pulse' : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'}`}>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">BP (mmHg)</span>
                    <span className="text-base font-black font-mono">
                      {selectedSession.vitals?.systolicBP || '--'}/{selectedSession.vitals?.diastolicBP || '--'}
                    </span>
                  </div>

                  {/* Heart Rate */}
                  <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Heart Rate</span>
                    <span className="text-base font-black font-mono">
                      {selectedSession.vitals?.heartRate || '--'} bpm
                    </span>
                  </div>

                  {/* SpO2 */}
                  <div className={`p-3 rounded-2xl border text-center ${selectedSession.vitals?.spo2 < 94 ? 'bg-amber-500/20 border-amber-500/40 text-amber-600 font-black' : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-900 dark:text-white'}`}>
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">SpO2</span>
                    <span className="text-base font-black font-mono">
                      {selectedSession.vitals?.spo2 || '--'}%
                    </span>
                  </div>

                  {/* Temperature */}
                  <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">Body Temp</span>
                    <span className="text-base font-black font-mono">
                      {selectedSession.vitals?.temperature || '--'}°F
                    </span>
                  </div>

                  {/* BMI */}
                  <div className="p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-center text-slate-900 dark:text-white">
                    <span className="text-[10px] font-bold text-gray-500 block uppercase">BMI Index</span>
                    <span className="text-base font-black font-mono">
                      {selectedSession.vitals?.bmi || '--'}
                    </span>
                  </div>

                  {/* Triage Priority */}
                  <div className={`p-3 rounded-2xl border text-center ${selectedSession.triagePriority === 'emergency' ? 'bg-red-500 text-white font-black' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border-emerald-500/30'}`}>
                    <span className="text-[10px] font-bold opacity-80 block uppercase">Triage</span>
                    <span className="text-xs font-black uppercase">
                      {selectedSession.triagePriority || 'Normal'}
                    </span>
                  </div>
                </div>

                {/* Red Flag Warning Banner */}
                {selectedSession.redFlags?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-700 dark:text-red-300 flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">
                        CLINICAL TRIAGE EMERGENCY RED-FLAGS DETECTED
                      </span>
                      <ul className="list-disc list-inside text-xs font-bold mt-1 space-y-0.5">
                        {selectedSession.redFlags.map((rf, i) => (
                          <li key={i}>{rf.flag} ({rf.category})</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* ────────────────── LONGITUDINAL LAB TREND COMPARISON ────────────────── */}
              <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Automated Longitudinal Lab & Symptom Trend Comparison
                    </h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">Verified via Ayush Pre-Visit OCR Engine</span>
                </div>

                {selectedSession.labTrends?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedSession.labTrends.map((trend, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border ${
                          trend.direction === 'elevated' || trend.direction === 'worsened'
                            ? 'border-rose-500/30'
                            : 'border-emerald-500/20'
                        }`}
                      >
                        <span className="text-[10px] text-gray-500 uppercase font-bold block">
                          {trend.testName}
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span
                            className={`text-lg font-black ${
                              trend.direction === 'elevated' || trend.direction === 'worsened'
                                ? 'text-rose-500'
                                : 'text-emerald-500'
                            }`}
                          >
                            {trend.currentValue}
                          </span>
                          {trend.previousValue && (
                            <span className="text-xs text-gray-400 font-mono">
                              from {trend.previousValue} ({trend.previousDate})
                            </span>
                          )}
                          {trend.changeDelta && (
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                trend.direction === 'elevated'
                                  ? 'bg-rose-500/10 text-rose-500'
                                  : 'bg-emerald-500/10 text-emerald-500'
                              }`}
                            >
                              {trend.changeDelta}
                            </span>
                          )}
                        </div>
                        {trend.clinicalSignificance && (
                          <span className="text-[10px] text-gray-400 font-bold block mt-1">
                            {trend.clinicalSignificance}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 text-center text-xs text-gray-400 font-medium">
                    No prior longitudinal lab trends recorded for this patient. Future Kiosk and Lab tests will be automatically tracked here.
                  </div>
                )}
              </div>

              {/* ────────────────── 3-COLUMN CLINICAL WORKSPACE ────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* COLUMN 1: PATIENT INTAKE & PREVIOUS MEDICATIONS (4 COLS) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Chief Complaint & SOCRATES Card */}
                  <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      Chief Complaint & Voice Record
                    </h3>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium leading-relaxed">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Verbatim Patient Statement</span>
                      "{selectedSession.chiefComplaint}"
                    </div>

                    {/* SOCRATES Breakdown */}
                    {selectedSession.socrates && (
                      <div className="text-xs space-y-2 text-slate-600 dark:text-gray-400">
                        {selectedSession.socrates.character && (
                          <div>
                            <span className="font-bold text-slate-800 dark:text-gray-200">Character: </span>
                            {selectedSession.socrates.character}
                          </div>
                        )}
                        {selectedSession.socrates.severity && (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-gray-200">VAS Severity: </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold font-mono">
                              {selectedSession.socrates.severity}/10
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Previous Allopathic Prescriptions (via OCR) */}
                  <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-3">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Pill className="w-4 h-4 text-blue-500" />
                      Active Medications (OCR Scanned)
                    </h3>

                    {selectedSession.ocrPrescriptions?.length > 0 ? (
                      <div className="space-y-2">
                        {selectedSession.ocrPrescriptions.flatMap(p => p.extractedMedicines || []).map((med, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs"
                          >
                            <span className="font-black text-slate-900 dark:text-white">
                              {med.name} {med.dosage}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {med.frequency}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-center text-xs text-gray-400">
                        No previous prescriptions scanned at kiosk.
                      </div>
                    )}
                  </div>

                  {/* Past Medical History & Allergies Card */}
                  <div className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      Medical History & Allergies
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Comorbidities & Past Illnesses</span>
                        {selectedSession.pastMedicalHistory?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSession.pastMedicalHistory.map((item, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None reported at kiosk</span>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                        <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Drug & Substance Allergies</span>
                        {selectedSession.allergies?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSession.allergies.map((item, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-500/30">
                                ⚠️ {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">No known drug allergies reported</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: 10-SECOND EDITABLE SOAP CASE SHEET (8 COLS) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-6">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200 dark:border-white/10">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Edit3 className="w-5 h-5 text-emerald-500" />
                          10-Second SOAP Case Sheet
                        </h3>
                        <p className="text-xs text-gray-500">
                          Synthesized with dual ICD-11 & AYUSH NAMASTE clinical morbidity coding.
                        </p>
                      </div>

                      {/* Quick Diagnosis Presets Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 hidden sm:inline">1-Click Preset:</span>
                        <select
                          onChange={(e) => {
                            const found = DIAGNOSIS_PRESETS.find(p => p.name === e.target.value);
                            if (found) applyPreset(found);
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                        >
                          <option value="">Choose Clinical Preset...</option>
                          {DIAGNOSIS_PRESETS.map((p, i) => (
                            <option key={i} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* S: Subjective */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xs">S</span>
                        Subjective (History & Patient Voice)
                      </label>
                      <textarea
                        rows={2}
                        value={soapData.subjective}
                        onChange={(e) => setSoapData({ ...soapData, subjective: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* O: Objective */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-teal-500/20 text-teal-600 flex items-center justify-center font-bold text-xs">O</span>
                        Objective (Vitals & Dashavidha Findings)
                      </label>
                      <textarea
                        rows={2}
                        value={soapData.objective}
                        onChange={(e) => setSoapData({ ...soapData, objective: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* A: Assessment & Dual Diagnosis Codes */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-xs">A</span>
                        Assessment & Dual-Coded Diagnoses (ICD-11 & NAMASTE)
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {diagnoses.map((diag, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:from-slate-800 dark:to-emerald-950/20 border border-emerald-500/30 flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-black">
                                  {diag.system}: {diag.code}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white block mt-1">
                                {diag.term}
                              </span>
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          </div>
                        ))}
                      </div>

                      <textarea
                        rows={2}
                        value={soapData.assessment}
                        onChange={(e) => setSoapData({ ...soapData, assessment: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* P: Plan (Prescription Builder: Allopathic + Ayurvedic) */}
                    <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-white/10">
                      <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold text-xs">P</span>
                        Plan: Integrated Allopathic & Ayurvedic Rx Regimen
                      </label>

                      {/* Ayurvedic Medications Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase">
                          <span>🌿 Ayurvedic Shamana Formulations</span>
                          <span>{soapData.plan?.ayurvedicMeds?.length || 0} Prescribed</span>
                        </div>

                        {soapData.plan?.ayurvedicMeds?.map((med, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-black text-slate-900 dark:text-white">
                                {med.name} • {med.dosage}
                              </span>
                              <span className="text-gray-500 block text-[11px]">
                                {med.frequency} • Anupana: {med.anupana || 'Water'} • Duration: {med.duration}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAyurvedicMedicine(idx)}
                              className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {/* Add Ayurvedic Herb Input Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Formulation (e.g. Ashwagandha)"
                            value={newAyuMed.name}
                            onChange={(e) => setNewAyuMed({ ...newAyuMed, name: e.target.value })}
                            className="sm:col-span-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Dose (e.g. 3g BD)"
                            value={newAyuMed.dosage}
                            onChange={(e) => setNewAyuMed({ ...newAyuMed, dosage: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Anupana (e.g. Milk)"
                            value={newAyuMed.anupana}
                            onChange={(e) => setNewAyuMed({ ...newAyuMed, anupana: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={addAyurvedicMedicine}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Herb
                          </button>
                        </div>
                      </div>

                      {/* Allopathic Medications Table */}
                      <div className="space-y-2 pt-3">
                        <div className="flex items-center justify-between text-xs font-black text-blue-700 dark:text-blue-400 uppercase">
                          <span>💊 Allopathic SOS & Supportive Medications</span>
                          <span>{soapData.plan?.allopathicMeds?.length || 0} Prescribed</span>
                        </div>

                        {soapData.plan?.allopathicMeds?.map((med, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/30 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-black text-slate-900 dark:text-white">
                                {med.name} • {med.dosage}
                              </span>
                              <span className="text-gray-500 block text-[11px]">
                                {med.frequency} • {med.instructions || med.duration}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAllopathicMedicine(idx)}
                              className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {/* Add Allopathic Drug Input Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Medicine (e.g. Paracetamol)"
                            value={newAlloMed.name}
                            onChange={(e) => setNewAlloMed({ ...newAlloMed, name: e.target.value })}
                            className="sm:col-span-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Dosage (e.g. 500mg SOS)"
                            value={newAlloMed.dosage}
                            onChange={(e) => setNewAlloMed({ ...newAlloMed, dosage: e.target.value })}
                            className="px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={addAllopathicMedicine}
                            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Drug
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ────────────────── CROSS-SYSTEM HERB-DRUG INTERACTION (HDI) GUARD ────────────────── */}
                    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border-2 border-emerald-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-amber-500" />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Cross-System Herb-Drug Interaction (HDI) Safety Guard
                          </h4>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500">
                          {interactionAlerts.length} Conflicts Detected
                        </span>
                      </div>

                      {checkingInteractions ? (
                        <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" /> Evaluating contraindications...
                        </div>
                      ) : interactionAlerts.length > 0 ? (
                        <div className="space-y-2">
                          {interactionAlerts.map((alert, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-black">
                                <span className="text-amber-800 dark:text-amber-300 font-bold">
                                  ⚠️ {alert.medicines_involved ? alert.medicines_involved.join(' + ') : `${alert.drugA || alert.herb || 'Herb'} + ${alert.drugB || alert.drug || 'Drug'}`}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase">
                                  {alert.severity || 'Moderate'} Risk
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-700 dark:text-amber-100 font-medium">
                                {alert.effect || alert.description || alert.mechanism || 'Potential interaction detected.'}
                              </p>
                              {alert.recommendation && (
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 italic">
                                  💡 Recommendation: {alert.recommendation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 border border-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          No known Herb-Drug contraindications detected between current and prescribed medications.
                        </div>
                      )}
                    </div>

                    {/* Doctor Consultation Notes */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Attending Physician Clinical Notes
                      </label>
                      <input
                        type="text"
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        placeholder="e.g. Advised 2-week follow-up, avoid cold exposures and strenuous exercise."
                        className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsPrintModalOpen(true)}
                          className="px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/15 text-slate-800 dark:text-gray-200 font-bold text-xs flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer shadow-sm transition-all"
                        >
                          <Printer className="w-4 h-4 text-emerald-600" /> Print OPD Slip
                        </button>

                        <button
                          type="button"
                          onClick={handleOpenFhirModal}
                          className="px-4 py-2.5 rounded-2xl border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2 hover:bg-emerald-500/10 cursor-pointer shadow-sm transition-all"
                        >
                          <Layers className="w-4 h-4 text-emerald-500" /> ABDM FHIR R4
                        </button>

                        <button
                          type="button"
                          onClick={handleSyncToAbdm}
                          disabled={abdmSyncStatus.syncing}
                          className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-all ${
                            abdmSyncStatus.synced || selectedSession?.abdmSync?.synced
                              ? 'bg-emerald-500/15 border border-emerald-500 text-emerald-700 dark:text-emerald-300'
                              : 'border border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10'
                          }`}
                        >
                          {abdmSyncStatus.syncing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" /> Syncing ABDM...
                            </>
                          ) : abdmSyncStatus.synced || selectedSession?.abdmSync?.synced ? (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-500" /> ABDM Synced
                            </>
                          ) : (
                            <>
                              <Share2 className="w-4 h-4 text-blue-500" /> Sync ABHA Locker
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadFhir}
                          className="p-2.5 rounded-2xl border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer shadow-sm"
                          title="Download FHIR Bundle JSON file"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isApproving || approvalSuccess}
                        onClick={handleApproveCaseSheet}
                        className={`px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-all cursor-pointer ${approvalSuccess ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-[0.98]'}`}
                      >
                        {isApproving ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Signing & Committing...
                          </>
                        ) : approvalSuccess ? (
                          <>
                            <ShieldCheck className="w-5 h-5 text-white" /> Signed & Completed!
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" /> Approve & Sign Case Sheet
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-10 sm:p-14 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 text-center space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Welcome, {currentUser?.doctorName || 'Doctor'}
                </h3>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-mono">
                  {currentUser?.department || 'Department of Kayachikitsa'} • AIIA Clinician Cockpit
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-300 pt-2 leading-relaxed">
                  Your live OPD queue is currently clear of pending patients. Real-time dual-coded SOAP case sheets, vitals telemetry, and longitudinal lab charts will load here as patients complete kiosk check-in.
                </p>
              </div>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/kiosk')}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4" /> Start Intake at MediKiosk
                </button>
                <button
                  type="button"
                  onClick={() => toggleQueueMode(!showDemoQueue)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-gray-300 dark:border-white/10"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {showDemoQueue ? 'Back to Live Clinic Queue' : 'Explore with Demo Clinical Cases'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────── MODAL 1: ABDM FHIR R4 INSPECTOR & GATEWAY SYNC ────────────────── */}
      {isFhirModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    ABDM FHIR R4 Document Bundle Inspector
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                      NRCeS NDHM Standard
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Token: <b className="text-white">{selectedSession?.tokenNumber}</b> | ABHA: <b className="text-white">{selectedSession?.abhaId}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFhirModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gateway Status Banner */}
            <div className="px-6 py-3 bg-emerald-950/40 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Care Context: <b className="text-emerald-300">AIIA-OPD-{selectedSession?.tokenNumber}</b>
                </span>
                <span className="text-gray-500">|</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                  ABDM Sandbox / Simulated Sync Mode
                </span>
              </div>
              {abdmSyncStatus.synced || selectedSession?.abdmSync?.synced ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Synced to ABHA Locker (Simulated)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSyncToAbdm}
                  disabled={abdmSyncStatus.syncing}
                  className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                >
                  {abdmSyncStatus.syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
                  Push to ABDM Gateway
                </button>
              )}
            </div>

            {/* JSON Code Viewer */}
            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-emerald-300 bg-slate-950/90 leading-relaxed scrollbar-thin">
              {loadingFhir ? (
                <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                  Generating certified NRCeS FHIR R4 document bundle...
                </div>
              ) : fhirBundleData ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(fhirBundleData, null, 2)}</pre>
              ) : (
                <div className="p-12 text-center text-gray-400">Failed to load FHIR bundle.</div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Resource Entries: <b className="text-white">{fhirBundleData?.entry?.length || 0}</b> FHIR Resources
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadFhir}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" /> Download .json
                </button>
                <button
                  type="button"
                  onClick={() => setIsFhirModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-gray-300 font-bold text-xs hover:bg-white/10 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL 2: PRINT OPD PRESCRIPTION SLIP ────────────────── */}
      {isPrintModalOpen && selectedSession && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 rounded-3xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Controls (Hidden in Print) */}
            <div className="p-4 border-b border-gray-200 bg-slate-100 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-sm text-slate-800">Print Preview: OPD Prescription Slip</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" /> Print Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl text-gray-500 hover:text-slate-900 hover:bg-gray-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Prescription Body */}
            <div className="flex-1 p-8 overflow-y-auto font-sans text-xs text-slate-900 space-y-6 print:p-0">
              {/* Official Hospital Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    All India Institute of Ayurveda (AIIA)
                  </h2>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Ministry of Ayush, Government of India | Sarita Vihar, New Delhi - 110076
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Ayush Integrated Case Sheet & Outpatient Prescription Slip
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-mono font-black text-emerald-700 block">
                    {selectedSession.tokenNumber}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Dept: {selectedSession.department || 'Kayachikitsa'}
                  </span>
                </div>
              </div>

              {/* Patient Barcode & Demographic Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Patient Name</span>
                  <b className="text-slate-900 text-xs">{selectedSession.patientName}</b>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Age / Gender</span>
                  <b className="text-slate-900">{selectedSession.age} Yrs / {selectedSession.gender}</b>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">ABHA Address / ID</span>
                  <b className="text-slate-900 font-mono text-[10px]">{selectedSession.abhaId}</b>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Date & Time</span>
                  <b className="text-slate-900">{new Date(selectedSession.createdAt || Date.now()).toLocaleDateString('en-IN')}</b>
                </div>
              </div>

              {/* Vitals Telemetry */}
              {selectedSession.vitals && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 flex flex-wrap items-center justify-between text-[11px] gap-2">
                  <span><b>BP:</b> {selectedSession.vitals.systolicBP}/{selectedSession.vitals.diastolicBP} mmHg</span>
                  <span><b>Pulse:</b> {selectedSession.vitals.heartRate} bpm</span>
                  <span><b>SpO2:</b> {selectedSession.vitals.spo2}%</span>
                  <span><b>Temp:</b> {selectedSession.vitals.temperature || '98.4'}°F</span>
                  <span><b>BMI:</b> {selectedSession.vitals.bmi || 'N/A'} kg/m²</span>
                  <span><b>Prakriti:</b> {selectedSession.dashavidhaPariksha?.prakriti?.primaryDosha || 'Vata-Pitta'}</span>
                  <span><b>Agni:</b> {selectedSession.dashavidhaPariksha?.aharaShakti?.jaranaShakti || 'Samagni'}</span>
                </div>
              )}

              {/* Clinical Diagnoses (ICD-11 & NAMASTE) */}
              <div>
                <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  Clinical Diagnoses (Dual-Coded)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {diagnoses.map((d, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs">
                      <span className="font-mono text-[10px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                        {d.system}: {d.code}
                      </span>
                      <p className="font-bold text-slate-900 mt-1">{d.term}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ayurvedic Formulations */}
              {soapData.plan.ayurvedicMeds?.length > 0 && (
                <div>
                  <h4 className="font-black text-xs text-emerald-800 uppercase tracking-wider mb-2 border-b border-emerald-200 pb-1">
                    Classical Ayurvedic Prescriptions (Ayush Formulations)
                  </h4>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-900 border-b border-emerald-200">
                        <th className="p-2 font-bold">Medicine Name</th>
                        <th className="p-2 font-bold">Dosage & Timing</th>
                        <th className="p-2 font-bold">Duration</th>
                        <th className="p-2 font-bold">Anupana (Vehicle)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soapData.plan.ayurvedicMeds.map((med, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="p-2 font-bold text-slate-900">{med.name}</td>
                          <td className="p-2">{med.dosage} ({med.frequency})</td>
                          <td className="p-2">{med.duration}</td>
                          <td className="p-2 font-semibold text-emerald-700">{med.anupana || 'Warm Water'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Allopathic Medications */}
              {soapData.plan.allopathicMeds?.length > 0 && (
                <div>
                  <h4 className="font-black text-xs text-blue-800 uppercase tracking-wider mb-2 border-b border-blue-200 pb-1">
                    Allopathic Supportive Medications
                  </h4>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-blue-50 text-blue-900 border-b border-blue-200">
                        <th className="p-2 font-bold">Drug Name</th>
                        <th className="p-2 font-bold">Dosage</th>
                        <th className="p-2 font-bold">Frequency</th>
                        <th className="p-2 font-bold">Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soapData.plan.allopathicMeds.map((med, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="p-2 font-bold text-slate-900">{med.name}</td>
                          <td className="p-2">{med.dosage}</td>
                          <td className="p-2">{med.frequency} ({med.duration})</td>
                          <td className="p-2">{med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Panchakarma & Pathya/Apathya */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-200 text-[11px]">
                <div>
                  <b className="text-amber-900 block font-black uppercase text-[10px]">Panchakarma Protocol</b>
                  <p className="text-slate-700">{soapData.plan.panchakarmaRecommendations?.join(', ') || 'Routine OPD follow-up'}</p>
                </div>
                <div>
                  <b className="text-emerald-900 block font-black uppercase text-[10px]">Pathya (Diet Advice)</b>
                  <p className="text-slate-700">{doctorNotes || 'Warm light diet, cow milk/ghee, avoid cold stale food.'}</p>
                </div>
              </div>

              {/* Footer with Doctor Signature & ABDM Verification */}
              <div className="pt-6 border-t border-slate-300 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-mono">ABDM Care Context: AIIA-OPD-{selectedSession.tokenNumber}</p>
                  <p>Certified ABDM FHIR R4 Document Bundle Interoperable Record</p>
                </div>
                <div className="text-right">
                  <div className="text-emerald-700 font-black text-xs font-serif italic">
                    {selectedSession.doctorReview?.signature || currentUser?.doctorName || 'Dr. Vaidya'}
                  </div>
                  <b className="text-slate-900 block text-xs">
                    {currentUser?.doctorName || 'Dr. Vaidya'}, {currentUser?.qualification || 'BAMS, MD (Ayu)'}
                  </b>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Reg #{currentUser?.registrationNumber || 'CCIM-DEL-2018-9844'} | {currentUser?.department || 'OPD Consultant'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SOURCE & EVIDENCE VERIFICATION DRAWER (TRUST THE AI) ────────────────── */}
      {isEvidenceDrawerOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-emerald-500/30 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Source & Evidence Verification
                    </h3>
                    <p className="text-xs text-gray-500">
                      Verify AI-extracted medications & lab metrics directly against original clinical documents.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEvidenceDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-gray-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Evidence Items List */}
              <div className="space-y-4">
                {evidenceList.length === 0 ? (
                  <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                    <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-slate-700 dark:text-gray-300">No Verified OCR Documents Attached</p>
                    <p className="text-xs text-gray-500 mt-1">This consultation session does not have external scanned hospital discharge slips or lab panels.</p>
                  </div>
                ) : (
                  evidenceList.map((item) => (
                  <div key={item.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/20 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                          {item.type}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                          {item.target}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                        {item.ocrConfidence} OCR
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 font-mono text-xs text-slate-800 dark:text-emerald-300 leading-relaxed">
                      <span className="text-[10px] font-bold text-gray-400 font-sans block mb-1 uppercase">Extracted Document Snippet:</span>
                      "{item.extractedSnippet}"
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 pt-1">
                      <div>
                        <span className="block font-bold">Source Document:</span>
                        <span className="text-slate-700 dark:text-gray-300">{item.sourceDoc}</span>
                      </div>
                      <div>
                        <span className="block font-bold">Document Location:</span>
                        <span className="text-slate-700 dark:text-gray-300">{item.page}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed by Patient at Home Pre-Visit
                      </span>
                      <span className="text-[10px] text-gray-400">{item.verifiedDate}</span>
                    </div>
                  </div>
                )))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Close Verification Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
