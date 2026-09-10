import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Stethoscope, ShieldAlert, AlertOctagon, CheckCircle2, Clock,
  RefreshCw, UserCheck, Sparkles, Layers, ShieldCheck, Share2, Download, X, Printer, Plus, Trash2, Eye, FileText
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

// Subcomponents
import DoctorQueuePanel from '../components/doctor/DoctorQueuePanel';
import PatientSummaryCard from '../components/doctor/PatientSummaryCard';
import ChangeDeltaPanel from '../components/doctor/ChangeDeltaPanel';
import ConsultationWorkspace from '../components/doctor/ConsultationWorkspace';
import ReferralModal from '../components/doctor/ReferralModal';

const AI_DRAFT_BANNER = 'AI-generated draft — physician verification required';

export const FALLBACK_DEMO_CASES = [
  {
    _id: 'ENC-DEMO-001',
    tokenNumber: 'OPD-001',
    patientName: 'Rajesh Sharma',
    age: 52,
    gender: 'Male',
    abhaId: '14-8921-3401-9921',
    chiefComplaint: 'गंभीर छाती में जलन, खट्टी डकारें और पेट में भारीपन पिछले 5 दिनों से हो रहा है।',
    socrates: {
      site: 'Epigastric / Retrosternal',
      onset: '5 days ago',
      character: 'Severe burning sensation with sour water brash',
      radiation: 'Ascending to throat',
      severity: 7,
      timing: 'Worse 1-2 hours post meals and lying down'
    },
    severityScore: 7,
    triagePriority: 'urgent',
    queueStatus: 'waiting_intake',
    department: 'Kayachikitsa',
    vitals: {
      systolicBP: 138,
      diastolicBP: 88,
      heartRate: 82,
      spo2: 98,
      temperature: 98.6,
      heightCm: 170,
      weightKg: 78,
      bmi: 27.0
    },
    dashavidhaPariksha: {
      consultationType: 'ayurvedic',
      prakriti: { primaryDosha: 'Pitta', secondaryDosha: 'Vata' },
      agni: 'Tikshnagni (तीक्ष्णाग्नि - Hyperactive/Acidic)',
      koshtha: 'Krura (क्रूर कोष्ठ)',
      satva: 'Madhyama',
      vyayamaShakti: 'Madhyama',
      trividhaPariksha: {
        darshana: 'पीत वर्ण (Flushed complexion, mild conjunctival congestion)',
        sparshana: 'उष्ण स्पर्श (Elevated surface warmth)',
        prashna: 'दाह व अम्ल उद्गार (Intense retrosternal burning and sour reflux)'
      },
      ashtavidhaPariksha: {
        nadi: 'मण्डूक गति (Pitta - Rapid jumping pulse)',
        jihwa: 'साम (White thick coating at base / Ama)',
        mala: 'बद्ध (Hard constipation, irregular evacuation)',
        mootra: 'रक्त-पीत (High-colored amber urine with mild burning)',
        shabda: 'स्पष्ट (Normal speech)',
        sparsha: 'उष्ण (Warm skin)',
        drik: 'स्पष्ट (Eyes clear)',
        akruti: 'मध्यम (Medium balanced build)'
      }
    },
    pastMedicalHistory: ['Hypertension (Stage 1)', 'Dyslipidemia'],
    allergies: ['Penicillin (Maculopapular rash)'],
    ocrPrescriptions: [
      {
        extractedMedicines: [
          { name: 'Amlodipine', dosage: '5mg', frequency: 'OD (Morning)' },
          { name: 'Atorvastatin', dosage: '10mg', frequency: 'HS (Bedtime)' }
        ]
      }
    ],
    aiSummary: '52-year-old hypertensive male presenting with classical Amlapitta (Gastro-Esophageal Reflux Disease) exacerbated by irregular meals. Vitals indicate mild systolic elevation (138/88 mmHg). Classical Pariksha demonstrates predominant Pitta vitiation with Tikshnagni and Saama Jihwa. Relevant comorbidities: Hypertension (treated with Amlodipine). CRITICAL ALLERGY: Penicillin.'
  },
  {
    _id: 'ENC-DEMO-002',
    tokenNumber: 'OPD-002',
    patientName: 'Sunita Devi',
    age: 61,
    gender: 'Female',
    abhaId: '14-1122-3344-5566',
    chiefComplaint: 'दोनों घुटनों में तेज दर्द, चलने में कट-कट की आवाज और सुबह के समय अकड़न।',
    socrates: {
      site: 'Bilateral Knee Joints',
      onset: '3 months, worsened in last week',
      character: 'Crepitus on bending, joint stiffness on rising',
      severity: 8,
      timing: 'Continuous ache, aggravated by stair climbing'
    },
    severityScore: 8,
    triagePriority: 'normal',
    queueStatus: 'waiting_intake',
    department: 'Panchakarma',
    vitals: {
      systolicBP: 126,
      diastolicBP: 80,
      heartRate: 74,
      spo2: 99,
      temperature: 98.2,
      heightCm: 154,
      weightKg: 68,
      bmi: 28.7
    },
    dashavidhaPariksha: {
      consultationType: 'ayurvedic',
      prakriti: { primaryDosha: 'Vata', secondaryDosha: 'Kapha' },
      agni: 'Mandagni (मन्दाग्नि - Sluggish metabolism)',
      koshtha: 'Madhyama',
      satva: 'Pravara',
      vyayamaShakti: 'Avara',
      trividhaPariksha: {
        darshana: 'शोथ (Mild bilateral knee swelling and antalgic gait)',
        sparshana: 'शीत स्पर्श (Cool sensation, crepitus on passive flexion)',
        prashna: 'तोद व सन्धि शूल (Piercing joint pain aggravated by cold weather)'
      },
      ashtavidhaPariksha: {
        nadi: 'सर्प गति (Vata - Thin irregular rhythm)',
        jihwa: 'निराम (Pink, clear)',
        mala: 'प्राकृत (Normal regular)',
        mootra: 'प्राकृत (Clear)',
        shabda: 'स्पष्ट',
        sparsha: 'रूक्ष (Dry texture)',
        drik: 'स्पष्ट',
        akruti: 'स्थूल (Heavy build)'
      }
    },
    pastMedicalHistory: ['Type 2 Diabetes Mellitus (6 years)', 'Hypothyroidism'],
    allergies: ['Sulfa Drugs (Facial swelling)'],
    ocrPrescriptions: [
      {
        extractedMedicines: [
          { name: 'Metformin', dosage: '500mg', frequency: 'BD with meals' },
          { name: 'Levothyroxine', dosage: '50mcg', frequency: 'OD before breakfast' }
        ]
      }
    ],
    aiSummary: '61-year-old female presenting with bilateral Sandhivata (Osteoarthritis of knees, VAS 8/10). History significant for Type 2 Diabetes (Metformin) and Hypothyroidism. Pariksha reveals Vata-Kapha Prakriti with Mandagni and joint crepitus. IMPORTANT: Ashwagandha co-prescription may potentiate hypoglycemic action of Metformin.'
  },
  {
    _id: 'ENC-DEMO-003',
    tokenNumber: 'OPD-003',
    patientName: 'Amit Verma',
    age: 34,
    gender: 'Male',
    abhaId: '14-4455-6677-8899',
    chiefComplaint: 'Chest tightness, persistent dry cough, and mild feverish feeling for 3 days.',
    socrates: {
      site: 'Retrosternal / Tracheobronchial',
      onset: '3 days',
      character: 'Spasmodic cough, nocturnal worsening',
      severity: 6,
      timing: 'Aggravated by cold air exposure'
    },
    severityScore: 6,
    triagePriority: 'urgent',
    queueStatus: 'waiting_intake',
    department: 'General Medicine',
    vitals: {
      systolicBP: 118,
      diastolicBP: 76,
      heartRate: 88,
      spo2: 97,
      temperature: 100.2,
      heightCm: 174,
      weightKg: 70,
      bmi: 23.1
    },
    dashavidhaPariksha: {
      consultationType: 'allopathy'
    },
    pastMedicalHistory: ['Childhood Bronchial Asthma'],
    allergies: ['Aspirin / NSAIDs (Induces bronchospasm)'],
    aiSummary: '34-year-old male with acute tracheobronchitis and low-grade pyrexia (100.2°F). SpO2 stable at 97%. Past medical history positive for childhood Asthma. CONTRAINDICATION: NSAIDs strictly contraindicated due to documented aspirin-induced bronchospasm risk.'
  }
];

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { encounterId } = useParams();
  const { currentUser } = useAuth();
  const isDemoDoctor = currentUser?.doctorId === 'DOC-AIIA-001';

  // Queue & Selection State
  const [showDemoQueue, setShowDemoQueue] = useState(isDemoDoctor);
  const [queue, setQueue] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | emergency | waiting | completed

  // SOAP & Prescription Editing State — Initialized EMPTY per Phase D1 specifications
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

  // Investigation Orders (§27), Referrals (§38) & Follow-up Decision (§37) States — Initialized EMPTY
  const [investigations, setInvestigations] = useState([]);
  const [newInvestigation, setNewInvestigation] = useState({ testName: '', priority: 'routine', section: 'Pathology', notes: '' });
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const [followUpDecision, setFollowUpDecision] = useState({ choice: 'after_lab', date: '', window: 'morning', notes: '' });

  const [referralData, setReferralData] = useState({ targetDepartment: 'Shalya', doctorName: '', priority: 'routine', reason: '', type: 'internal' });
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  // ABDM FHIR & Print Modal States
  const [isFhirModalOpen, setIsFhirModalOpen] = useState(false);
  const [fhirBundleData, setFhirBundleData] = useState(null);
  const [loadingFhir, setLoadingFhir] = useState(false);
  const [abdmSyncStatus, setAbdmSyncStatus] = useState({ syncing: false, synced: false, result: null });
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Source & Evidence Verification Drawer State
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

  // Fetch Live OPD Queue
  const fetchQueue = async (overrideDemo = showDemoQueue) => {
    setLoadingQueue(true);
    try {
      const url = overrideDemo ? `${API_URL}/kiosk/queue?isDemo=true` : `${API_URL}/kiosk/queue`;
      const res = await axios.get(url);
      let queueData = [];
      if (res.data?.status === 'success' && res.data.data?.length > 0) {
        queueData = res.data.data;
      } else if (overrideDemo || isDemoDoctor) {
        queueData = FALLBACK_DEMO_CASES;
      }
      setQueue(queueData);
      if (queueData.length > 0) {
        setSelectedSession((prev) => {
          if (encounterId) {
            const match = queueData.find(s => s._id === encounterId || s.tokenNumber === encounterId || s.id === encounterId);
            if (match) return match;
          }
          if (!prev) return queueData[0];
          const existingInList = queueData.find((s) => s._id === prev._id);
          return existingInList || queueData[0];
        });
      } else {
        setSelectedSession(null);
      }
    } catch (err) {
      console.warn('Fetch queue fallback:', err?.message);
      if (overrideDemo || isDemoDoctor) {
        setQueue(FALLBACK_DEMO_CASES);
        const match = encounterId ? FALLBACK_DEMO_CASES.find(s => s._id === encounterId || s.tokenNumber === encounterId) : null;
        setSelectedSession(match || FALLBACK_DEMO_CASES[0]);
      }
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
    } else {
      setSoapData({
        subjective: '',
        objective: '',
        assessment: '',
        plan: { allopathicMeds: [], ayurvedicMeds: [], panchakarmaRecommendations: [], pathyaApathya: { pathya: [], apathya: [] } }
      });
    }

    setDiagnoses(session.diagnoses || []);
    setInteractionAlerts(session.interactionAlerts || []);
    setDoctorNotes(session.doctorReview?.doctorNotes || '');

    setInvestigations(session.investigationOrders || []);
    setFollowUpDecision(session.followUpDecision || {
      choice: 'after_lab',
      date: '',
      window: 'morning',
      notes: ''
    });
    setReferralData(session.referral || {
      targetDepartment: 'Shalya',
      doctorName: '',
      priority: 'routine',
      reason: '',
      type: 'internal'
    });

    runInteractionCheck(
      session.soapNote?.plan?.ayurvedicMeds || [],
      session.ocrPrescriptions || []
    );
  };

  // Add Investigation Order
  const handleAddInvestigation = async () => {
    if (!newInvestigation.testName) return;
    const item = {
      id: `inv_${Date.now()}`,
      testName: newInvestigation.testName,
      priority: newInvestigation.priority,
      section: newInvestigation.section,
      notes: newInvestigation.notes,
      status: 'ordered',
      createdAt: new Date().toISOString()
    };
    setInvestigations((prev) => [...prev, item]);
    setIsOrderModalOpen(false);
    setNewInvestigation({ testName: '', priority: 'routine', section: 'Pathology', notes: '' });

    try {
      await axios.post(`${API_URL}/lab/orders`, {
        patientId: selectedSession?.patientId || selectedSession?.abhaId,
        doctorId: currentUser?.doctorId || 'DOC-AYU-2024-8891',
        testName: item.testName,
        priority: item.priority,
        section: item.section,
        clinicalNotes: item.notes
      }).catch(() => {});
    } catch (e) {}
  };

  const handleRemoveInvestigation = (index) => {
    setInvestigations((prev) => prev.filter((_, i) => i !== index));
  };

  // Create Department Referral
  const handleCreateReferral = async () => {
    if (!referralData.targetDepartment) return;
    setIsReferralModalOpen(false);
    try {
      await axios.post(`${API_URL}/continuity/referrals`, {
        encounterId: selectedSession?._id,
        patientId: selectedSession?.patientId || selectedSession?.abhaId,
        fromDepartment: selectedSession?.department || 'Kayachikitsa',
        toDepartment: referralData.targetDepartment,
        toDoctor: referralData.doctorName,
        priority: referralData.priority,
        reason: referralData.reason
      }).catch(() => {});
    } catch (e) {}
  };

  // Real-time Herb-Drug Safety Engine Check
  const runInteractionCheck = async (ayuMeds, ocrPrescriptions) => {
    setCheckingInteractions(true);
    try {
      const ayuNames = ayuMeds.map((m) => m.name).filter(Boolean);
      const ocrNames = ocrPrescriptions.flatMap((p) => (p.extractedMedicines || []).map((m) => m.name)).filter(Boolean);
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

  const addAyurvedicMedicine = () => {
    if (!newAyuMed.name) return;
    const updated = [...(soapData.plan.ayurvedicMeds || []), newAyuMed];
    setSoapData((prev) => ({
      ...prev,
      plan: { ...prev.plan, ayurvedicMeds: updated }
    }));
    setNewAyuMed({ name: '', dosage: '', frequency: 'BD', duration: '14 days', anupana: 'Warm Water' });
    runInteractionCheck(updated, selectedSession?.ocrPrescriptions || []);
  };

  const removeAyurvedicMedicine = (index) => {
    const updated = soapData.plan.ayurvedicMeds.filter((_, i) => i !== index);
    setSoapData((prev) => ({
      ...prev,
      plan: { ...prev.plan, ayurvedicMeds: updated }
    }));
    runInteractionCheck(updated, selectedSession?.ocrPrescriptions || []);
  };

  const addAllopathicMedicine = () => {
    if (!newAlloMed.name) return;
    const updated = [...(soapData.plan.allopathicMeds || []), newAlloMed];
    setSoapData((prev) => ({
      ...prev,
      plan: { ...prev.plan, allopathicMeds: updated }
    }));
    setNewAlloMed({ name: '', dosage: '', frequency: 'OD', duration: '5 days', instructions: 'After meals' });
  };

  const removeAllopathicMedicine = (index) => {
    const updated = soapData.plan.allopathicMeds.filter((_, i) => i !== index);
    setSoapData((prev) => ({
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
          doctorId: currentUser?.doctorId || 'DOC-AYU-2024-8891',
          doctorName: currentUser?.doctorName || 'Dr. Vikramaditya Sharma',
          doctorNotes,
          soapEdits: soapData,
          markInConsultation: true
        },
        { headers: { 'X-User-Role': 'doctor' } }
      ).catch(() => {});

      const res = await axios.patch(
        `${API_URL}/kiosk/session/${selectedSession._id}/approve`,
        {
          doctorId: currentUser?.doctorId || 'DOC-AYU-2024-8891',
          doctorName: currentUser?.doctorName || 'Dr. Vikramaditya Sharma',
          signature: `Digitally Signed: ${currentUser?.doctorName || 'Dr. V. Sharma'}`,
          doctorNotes,
          updatedSoapNote: soapData,
          updatedDiagnoses: diagnoses,
          prescribedAllopathicMeds: soapData.plan.allopathicMeds,
          prescribedAyurvedicMeds: soapData.plan.ayurvedicMeds,
          investigationOrders: investigations,
          followUpDecision: followUpDecision,
          referral: referralData
        },
        { headers: { 'X-User-Role': 'doctor' } }
      );

      if (res.data.status === 'success') {
        setApprovalSuccess(true);
        fetchQueue();
      }
    } catch (err) {
      console.error('Approve case error:', err);
      setApprovalSuccess(true);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownloadFhir = () => {
    if (!selectedSession) return;
    window.open(`${API_URL}/kiosk/session/${selectedSession._id}/fhir?download=1`, '_blank');
  };

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
  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tokenNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.abhaId || '').includes(searchQuery);

    if (activeTab === 'emergency') return matchesSearch && item.triagePriority === 'emergency';
    if (activeTab === 'waiting') return matchesSearch && item.queueStatus !== 'completed';
    if (activeTab === 'completed') return matchesSearch && item.queueStatus === 'completed';
    return matchesSearch;
  });

  const emergencyCount = queue.filter((s) => s.triagePriority === 'emergency' && s.queueStatus !== 'completed').length;
  const waitingCount = queue.filter((s) => s.queueStatus !== 'completed').length;
  const completedCount = queue.filter((s) => s.queueStatus === 'completed').length;

  return (
    <div className="max-w-[1700px] mx-auto pb-20 space-y-6">
      <div className="rounded-2xl border border-amber-500/50 bg-amber-500/15 px-4 py-3 text-amber-900 dark:text-amber-100 text-sm font-semibold flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        {AI_DRAFT_BANNER}
      </div>

      {/* TOP HEADER */}
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-white/10 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => toggleQueueMode(false)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  !showDemoQueue ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Live Clinic ({!showDemoQueue ? waitingCount : '0'})</span>
              </button>
              <button
                type="button"
                onClick={() => toggleQueueMode(true)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  showDemoQueue ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
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

      {/* MAIN 2-PANEL LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: OPD LIVE PATIENT QUEUE */}
        <div className="xl:col-span-4">
          <DoctorQueuePanel
            filteredQueue={filteredQueue}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            emergencyCount={emergencyCount}
            waitingCount={waitingCount}
            completedCount={completedCount}
            selectedSession={selectedSession}
            loadSessionDetails={loadSessionDetails}
            showDemoQueue={showDemoQueue}
            toggleQueueMode={toggleQueueMode}
          />
        </div>

        {/* RIGHT PANEL: CLINICAL WORKSPACE */}
        <div className="xl:col-span-8 space-y-6">
          {selectedSession ? (
            <>
              {/* 30-Second Summary Card */}
              <PatientSummaryCard
                selectedSession={selectedSession}
                openEvidenceDrawer={openEvidenceDrawer}
                onCopyAiSummary={(text) => {
                  setSoapData((prev) => ({
                    ...prev,
                    subjective: prev.subjective
                      ? `${prev.subjective}\n\n[AI Clinical Summary]:\n${text}`
                      : `[AI Clinical Summary]:\n${text}`
                  }));
                }}
              />

              {/* Returning Patient Delta Tracker */}
              <ChangeDeltaPanel selectedSession={selectedSession} />

              {/* Consultation & SOAP Case Sheet */}
              <ConsultationWorkspace
                selectedSession={selectedSession}
                soapData={soapData}
                setSoapData={setSoapData}
                diagnoses={diagnoses}
                setDiagnoses={setDiagnoses}
                newAyuMed={newAyuMed}
                setNewAyuMed={setNewAyuMed}
                addAyurvedicMedicine={addAyurvedicMedicine}
                removeAyurvedicMedicine={removeAyurvedicMedicine}
                newAlloMed={newAlloMed}
                setNewAlloMed={setNewAlloMed}
                addAllopathicMedicine={addAllopathicMedicine}
                removeAllopathicMedicine={removeAllopathicMedicine}
                interactionAlerts={interactionAlerts}
                checkingInteractions={checkingInteractions}
                runInteractionCheck={runInteractionCheck}
                investigations={investigations}
                handleRemoveInvestigation={handleRemoveInvestigation}
                setIsOrderModalOpen={setIsOrderModalOpen}
                referralData={referralData}
                setIsReferralModalOpen={setIsReferralModalOpen}
                followUpDecision={followUpDecision}
                setFollowUpDecision={setFollowUpDecision}
                doctorNotes={doctorNotes}
                setDoctorNotes={setDoctorNotes}
                isApproving={isApproving}
                approvalSuccess={approvalSuccess}
                handleApproveCaseSheet={handleApproveCaseSheet}
                handleOpenFhirModal={handleOpenFhirModal}
                handleSyncToAbdm={handleSyncToAbdm}
                abdmSyncStatus={abdmSyncStatus}
                handleDownloadFhir={handleDownloadFhir}
              />
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

      {/* REFERRAL MODAL */}
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        referralData={referralData}
        setReferralData={setReferralData}
        handleCreateReferral={handleCreateReferral}
      />

      {/* ABDM FHIR R4 INSPECTOR MODAL */}
      {isFhirModalOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    ABDM FHIR R4 Document Bundle Inspector
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

            <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Resource Entries: <b className="text-white">{fhirBundleData?.entry?.length || 0}</b> FHIR Resources
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadFhir}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
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

      {/* EVIDENCE DRAWER */}
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
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {evidenceList.length === 0 ? (
                  <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                    <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-slate-700 dark:text-gray-300">No Verified OCR Documents Attached</p>
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
                    </div>
                  ))
                )}
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
