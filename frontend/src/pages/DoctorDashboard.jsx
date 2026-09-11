import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  Stethoscope, ShieldAlert, AlertOctagon, CheckCircle2, Clock, Shield,
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
import DoctorHeaderNavbar from '../components/doctor/DoctorHeaderNavbar';

const AI_DRAFT_BANNER = 'AI-generated draft — physician verification required';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { encounterId } = useParams();
  const { currentUser } = useAuth();

  // Queue & Selection State
  const [queueError, setQueueError] = useState('');
  const [completedSessionIds, setCompletedSessionIds] = useState(new Set());
  const [queue, setQueue] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | emergency | waiting | completed
  const [selectedHospital, setSelectedHospital] = useState(currentUser?.hospitalName || 'All India Institute of Ayurveda (AIIA), New Delhi');
  const [selectedDept, setSelectedDept] = useState(currentUser?.department || 'Kayachikitsa');

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
  const [approvalError, setApprovalError] = useState('');
  // What the backend actually recorded on sign-off: the new lab token and/or
  // the scheduled follow-up date. Shown to the doctor so they can tell the patient.
  const [outcomeResult, setOutcomeResult] = useState(null);

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
  const [evidenceTab, setEvidenceTab] = useState('ocr');

  useEffect(() => {
    if (selectedSession?.evidenceSnippets?.length > 0) {
      setEvidenceList(selectedSession.evidenceSnippets);
    } else {
      setEvidenceList([]);
    }
  }, [selectedSession]);

  const openEvidenceDrawer = async () => {
    setIsEvidenceDrawerOpen(true);
    setEvidenceTab('ocr');
    if (selectedSession?._id) {
      try {
        const res = await axios.get(`${API_URL}/kiosk/session/${selectedSession._id}/evidence`);
        if (res.data?.status === 'success' && res.data.data?.evidenceSnippets?.length > 0) {
          setEvidenceList(res.data.data.evidenceSnippets);
        } else if (selectedSession?.evidenceSnippets?.length > 0) {
          setEvidenceList(selectedSession.evidenceSnippets);
        }
      } catch (err) {
        console.warn('Evidence fetch note:', err?.message);
      }
    }
  };

  const handleDoctorVerifyEvidence = async (index, action, editedValue = null) => {
    if (!selectedSession?._id) return;
    try {
      const payload = {
        doctorId: currentUser?.id || 'DOC-DEFAULT',
        doctorName: currentUser?.fullName || 'Dr. Physician',
        evidenceActions: [{ index, action, editedValue }]
      };
      const res = await axios.patch(`${API_URL}/kiosk/session/${selectedSession._id}/doctor-verify`, payload);
      if (res.data?.status === 'success') {
        setSelectedSession(res.data.data);
        if (res.data.data.evidenceSnippets) {
          setEvidenceList(res.data.data.evidenceSnippets);
        }
      }
    } catch (err) {
      console.warn('Error verifying evidence:', err?.message);
    }
  };

  // Fetch Live OPD Queue directly from MongoDB Atlas
  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await axios.get(`${API_URL}/kiosk/queue`);
      let queueData = (res.data?.status === 'success' && Array.isArray(res.data.data))
        ? res.data.data
        : [];
      setQueueError('');

      // Enforce completedSessionIds override on fetched data
      queueData = queueData.map((item) =>
        completedSessionIds.has(item._id) || completedSessionIds.has(item.tokenNumber)
          ? { ...item, queueStatus: 'completed' }
          : item
      );

      setQueue(queueData);
      const waitingPatients = queueData.filter((s) => s.queueStatus !== 'completed');

      if (waitingPatients.length > 0) {
        setSelectedSession((prev) => {
          if (encounterId) {
            const match = waitingPatients.find(s => s._id === encounterId || s.tokenNumber === encounterId || s.id === encounterId);
            if (match) return match;
          }
          if (!prev || prev.queueStatus === 'completed' || completedSessionIds.has(prev._id)) {
            return waitingPatients[0];
          }
          const existingInWaiting = waitingPatients.find((s) => s._id === prev._id);
          return existingInWaiting || waitingPatients[0];
        });
      } else {
        setSelectedSession(null);
      }
    } catch (err) {
      console.error('[DoctorDashboard] Queue fetch failed:', err?.message);
      setQueueError(err?.message || 'Could not reach the server');
      setQueue([]);
      setSelectedSession(null);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => fetchQueue(), 10000);
    return () => clearInterval(interval);
  }, []);

  // Load Session into Workspace — Always starts with EMPTY SOAP case sheet per specifications
  const loadSessionDetails = (session) => {
    setSelectedSession(session);
    setApprovalSuccess(false);
    setApprovalError('');
    setOutcomeResult(null);
    setInteractionAlerts([]);

    // Initialize SOAP case sheet completely EMPTY for new doctor evaluation
    setSoapData({
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

    setDiagnoses(session.diagnoses || []);
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

  const [isConfirmApproveModalOpen, setIsConfirmApproveModalOpen] = useState(false);
  const [isNextPatientModalOpen, setIsNextPatientModalOpen] = useState(false);
  const [nextPatientCandidate, setNextPatientCandidate] = useState(null);

  // Trigger Confirmation Modal 1
  const handleApproveCaseSheet = () => {
    if (!selectedSession) return;
    setIsConfirmApproveModalOpen(true);
  };

  // Step 1: Execute actual Approval & Sign API requests upon doctor confirmation
  //
  // The previous version .catch()'d both requests into a console warning and then
  // ran setApprovalSuccess(true) — including inside the outer catch block. A failed
  // signature therefore told the doctor the case sheet was signed and moved them on
  // to the next patient, losing the consultation. Now a failure is reported and the
  // patient stays selected so the doctor can retry.
  const executeApproveCaseSheet = async () => {
    if (!selectedSession) return;
    setIsConfirmApproveModalOpen(false);
    setIsApproving(true);
    setApprovalError('');
    const completedSessionId = selectedSession._id;
    const completedToken = selectedSession.tokenNumber;

    const doctorId = currentUser?.doctorId || '';
    const doctorName = currentUser?.doctorName || '';



    const authHeaders = {
      'X-User-Role': 'doctor',
      'X-User-Id': doctorId
    };

    try {
      // Not fatal on its own — this only flags the encounter as under review.
      await axios.patch(
        `${API_URL}/kiosk/session/${completedSessionId}/doctor-verify`,
        { doctorId, doctorName, doctorNotes, soapEdits: soapData, markInConsultation: true },
        { headers: authHeaders }
      ).catch((e) => console.warn('doctor-verify note:', e?.message));

      // This one is the signature. If it fails, nothing was signed.
      const res = await axios.patch(
        `${API_URL}/kiosk/session/${completedSessionId}/approve`,
        {
          doctorId,
          doctorName,
          signature: doctorName ? `Digitally Signed: ${doctorName}` : 'Digitally Signed via VaidyaSetu',
          doctorNotes,
          updatedSoapNote: soapData,
          updatedDiagnoses: diagnoses,
          prescribedAllopathicMeds: soapData.plan.allopathicMeds,
          prescribedAyurvedicMeds: soapData.plan.ayurvedicMeds,
          investigationOrders: investigations,
          followUpDecision,
          // Only send a referral if the doctor actually filled one in — the default
          // state has a pre-selected department and would create a phantom referral.
          referral: referralData.reason ? referralData : undefined
        },
        { headers: authHeaders }
      );

      if (res.data?.status !== 'success') {
        throw new Error(res.data?.message || 'Server rejected the signature');
      }

      // Surface the outcome the backend actually recorded: the new lab token for a
      // lab hand-off, or the scheduled follow-up date.
      const out = res.data.data || {};
      setOutcomeResult({
        demo: false,
        labTokenNumber: out.labTokenNumber || null,
        followUpDate: out.followUpDecision?.scheduledDate || null,
        queueStatus: out.queueStatus || ''
      });

      const updatedCompletedSet = new Set(completedSessionIds);
      if (completedSessionId) updatedCompletedSet.add(completedSessionId);
      if (completedToken) updatedCompletedSet.add(completedToken);
      setCompletedSessionIds(updatedCompletedSet);

      setApprovalSuccess(true);

      const updatedQueue = queue.map((item) =>
        item._id === completedSessionId || item.tokenNumber === completedToken
          ? { ...item, queueStatus: 'completed' }
          : item
      );
      setQueue(updatedQueue);

      const nextPatientToLoad = updatedQueue.find(
        (item) => item.queueStatus !== 'completed' &&
                  item._id !== completedSessionId &&
                  item.tokenNumber !== completedToken &&
                  !updatedCompletedSet.has(item._id) &&
                  !updatedCompletedSet.has(item.tokenNumber)
      );

      setNextPatientCandidate(nextPatientToLoad || null);
      setIsNextPatientModalOpen(true);
    } catch (err) {
      console.error('[DoctorDashboard] Case sheet signature failed:', err);
      setApprovalError(
        err?.response?.data?.message || err?.message || 'Could not reach the server'
      );
      setApprovalSuccess(false);
    } finally {
      setIsApproving(false);
    }
  };

  const loadNextPatientAndCloseModal = () => {
    setIsNextPatientModalOpen(false);
    if (nextPatientCandidate) {
      loadSessionDetails(nextPatientCandidate);
    } else {
      setSelectedSession(null);
    }
  };

  const stayOnCurrentPatientAndCloseModal = () => {
    setIsNextPatientModalOpen(false);
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

  // Filtered Queue with Department Scoping and Doctor Assignment
  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      (item.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tokenNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.abhaId || '').includes(searchQuery);

    if (!matchesSearch) return false;

    // Check if directly assigned to this doctor
    const isAssignedToDoctor =
      (item.preferredDoctorId && currentUser?.id && String(item.preferredDoctorId) === String(currentUser?.id)) ||
      (item.preferredDoctor && currentUser?.fullName && item.preferredDoctor.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
      (item.preferredDoctor && currentUser?.doctorName && item.preferredDoctor.toLowerCase().includes(currentUser.doctorName.toLowerCase()));

    if (isAssignedToDoctor) {
      if (activeTab === 'emergency') return item.triagePriority === 'emergency';
      if (activeTab === 'waiting') return item.queueStatus !== 'completed';
      if (activeTab === 'completed') return item.queueStatus === 'completed';
      return true;
    }

    // Department Scoping: Robust normalization so variations match cleanly
    if (currentUser?.department && item.department) {
      const clean = (str) =>
        (str || '')
          .toLowerCase()
          .replace(/department of\s*/g, '')
          .replace(/\(.*?\)/g, '')
          .trim();
      const docDept = clean(currentUser.department);
      const itemDept = clean(item.department);
      
      if (docDept && itemDept && docDept !== itemDept) {
        const matches = docDept.includes(itemDept) || itemDept.includes(docDept);
        const wordMatch = docDept.split(/\s+/).some(w => w.length >= 4 && itemDept.includes(w));
        if (!matches && !wordMatch) {
          return false;
        }
      }
    }

    if (activeTab === 'emergency') return item.triagePriority === 'emergency';
    if (activeTab === 'waiting') return item.queueStatus !== 'completed';
    if (activeTab === 'completed') return item.queueStatus === 'completed';
    return true;
  });

  const emergencyCount = queue.filter((s) => s.triagePriority === 'emergency' && s.queueStatus !== 'completed').length;
  const waitingCount = queue.filter((s) => s.queueStatus !== 'completed').length;
  const completedCount = queue.filter((s) => s.queueStatus === 'completed').length;

  return (
    <div className="w-full max-w-full px-1 sm:px-3 md:px-4 pb-20 space-y-6">
      <DoctorHeaderNavbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        waitingCount={waitingCount}
        emergencyCount={emergencyCount}
        completedCount={completedCount}
        onRefresh={() => fetchQueue()}
      />

      <div className="rounded-2xl border border-amber-300/80 dark:border-amber-500/30 bg-gradient-to-r from-amber-50/95 via-orange-50/80 to-amber-50/95 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 px-4 py-2.5 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xs">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>{AI_DRAFT_BANNER}</span>
      </div>



      {/* MAIN FULL-WIDTH 2-PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 items-start w-full">
        {/* LEFT PANEL: OPD LIVE PATIENT QUEUE (3/12 cols on XL screens) */}
        <div className="lg:col-span-4 xl:col-span-3">
          <DoctorQueuePanel
            filteredQueue={filteredQueue}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            waitingCount={waitingCount}
            emergencyCount={emergencyCount}
            selectedSession={selectedSession}
            loadSessionDetails={loadSessionDetails}
          />
        </div>

        {/* RIGHT PANEL: CLINICAL WORKSPACE (9/12 cols on XL screens) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
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

              {/* A failed signature must be visible — it used to report success. */}
              {approvalError && (
                <div className="p-4 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-700 dark:text-red-300 space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider block">
                    Case sheet was NOT signed
                  </span>
                  <p className="text-xs font-medium">
                    {approvalError}. Nothing has been saved — the patient is still in the queue.
                    Fix the connection and press Approve again.
                  </p>
                </div>
              )}
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
                  {queueError
                    ? 'The queue could not be loaded, so nothing is shown here rather than placeholder patients. Check that the backend is running, then refresh.'
                    : 'Your live OPD queue is currently clear of pending patients. Case sheets, vitals and lab results will load here as patients complete kiosk check-in.'}
                </p>
              </div>
              {queueError && (
                <div className="max-w-md mx-auto p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  Server error: {queueError}
                </div>
              )}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/kiosk')}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Stethoscope className="w-4 h-4" /> Start Intake at MediKiosk
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
      {isFhirModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
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
                <div className="p-12 text-center text-rose-300 font-semibold">Failed to load FHIR bundle.</div>
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
        </div>,
        document.body
      )}

      {/* EVIDENCE & ORIGINAL CLINICAL DATA DRAWER */}
      {isEvidenceDrawerOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-emerald-500/30 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black shadow-lg shadow-emerald-500/25">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Clinical Source & Original Evidence
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Verify AI extractions against original patient documents, kiosk inputs, & OCR attachments.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEvidenceDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Evidence Category Tabs */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setEvidenceTab('ocr')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    evidenceTab === 'ocr'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-4 h-4" /> OCR & AI Snippets
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceTab('documents')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    evidenceTab === 'documents'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  <FileText className="w-4 h-4" /> Uploaded Docs ({selectedSession?.documents?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setEvidenceTab('original')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    evidenceTab === 'original'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> Original Kiosk Data
                </button>
              </div>

              {/* Tab 1: OCR & AI Snippets */}
              {evidenceTab === 'ocr' && (
                <div className="space-y-4">
                  {evidenceList.length === 0 ? (
                    <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 space-y-2">
                      <FileText className="w-10 h-10 text-gray-400 mx-auto opacity-50" />
                      <p className="text-sm font-bold text-slate-700 dark:text-gray-300">No OCR Snippets Extracted Yet</p>
                      <p className="text-xs text-gray-400">Documents uploaded by patient will show AI extracted confidence metrics here.</p>
                    </div>
                  ) : (
                    evidenceList.map((item, idx) => (
                      <div key={item.id || idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/20 space-y-3 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                              {item.type || item.item || 'Extracted Clinical Data'}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                              {item.target || item.item || 'Clinical Value'}
                            </h4>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                              Source: {item.sourceDoc || item.sourceDocName || 'Uploaded Document'} {item.date ? `· ${item.date}` : ''}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-black border border-emerald-500/30">
                              {item.ocrConfidence || (item.confidence ? `${item.confidence}%` : '92%')} OCR
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              item.verified
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}>
                              {item.verified ? '✓ Physician Verified' : 'Pending Verification'}
                            </span>
                          </div>
                        </div>

                        {(item.extractedSnippet || item.rawText) && (
                          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 font-mono text-xs text-slate-800 dark:text-emerald-300 leading-relaxed">
                            <span className="text-[10px] font-bold text-gray-400 font-sans block mb-1 uppercase">Raw Extracted Snippet:</span>
                            "{item.extractedSnippet || item.rawText}"
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {!item.verified ? (
                            <button
                              type="button"
                              onClick={() => handleDoctorVerifyEvidence(idx, 'accept')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verify & Confirm Fact
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4" /> Verified by Doctor
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Uploaded Documents */}
              {evidenceTab === 'documents' && (
                <div className="space-y-4">
                  {(!selectedSession?.documents || selectedSession.documents.length === 0) ? (
                    <div className="text-center py-12 p-6 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 space-y-2">
                      <FileText className="w-10 h-10 text-gray-400 mx-auto opacity-50" />
                      <p className="text-sm font-bold text-slate-700 dark:text-gray-300">No Patient Document Attachments</p>
                      <p className="text-xs text-gray-400">The patient did not attach any prescriptions or lab test files during kiosk pre-consultation.</p>
                    </div>
                  ) : (
                    selectedSession.documents.map((doc, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {doc.originalName || `Document #${idx + 1}`}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Type: {doc.type || 'Prescription / Lab'} {doc.isHandwritten ? '· Handwritten Document' : ''}
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                            doc.verificationStatus === 'needs_staff_review'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {doc.verificationStatus || 'Uploaded'}
                          </span>
                        </div>

                        {doc.imageUrl && doc.imageUrl.startsWith('data:') && (
                          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 max-h-48 bg-slate-950 flex items-center justify-center">
                            <img src={doc.imageUrl} alt="Document Attachment" className="max-h-48 object-contain" />
                          </div>
                        )}

                        {doc.extractedFields?.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
                              AI Extracted Medication Items:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {doc.extractedFields.map((field, fIdx) => (
                                <div key={fIdx} className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-emerald-200 flex items-center gap-2">
                                  <span>{field.value}</span>
                                  <span className="text-[10px] text-emerald-500 font-mono">({field.confidence || 90}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {doc.rawOcrText && (
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-xs font-mono text-slate-800 dark:text-gray-300">
                            <strong>Raw OCR Output:</strong> {doc.rawOcrText}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Original Kiosk Input Data */}
              {evidenceTab === 'original' && (
                <div className="space-y-4 text-xs">
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/20 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      Patient Chief Complaint (Kiosk Recorded)
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                      "{selectedSession?.chiefComplaint || 'No chief complaint recorded.'}"
                    </p>
                  </div>

                  {selectedSession?.socrates && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-gray-300 block">
                        SOCRATES Detailed Analysis
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Pain Site</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{selectedSession.socrates.site || 'Not reported'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Onset / Duration</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{selectedSession.socrates.onset || selectedSession.socrates.duration || 'Not reported'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Character</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{selectedSession.socrates.character || 'Not reported'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10">
                          <span className="text-[10px] text-gray-400 uppercase font-bold block">Severity Rating</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{selectedSession.socrates.severity ? `${selectedSession.socrates.severity}/10` : 'Not rated'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSession?.vitals && (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-gray-300 block">
                        Peripheral Vitals Measured
                      </span>
                      <div className="grid grid-cols-3 gap-3 font-mono">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-center">
                          <span className="text-[10px] text-gray-400 font-sans block uppercase">Blood Pressure</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm">{selectedSession.vitals.systolicBP ? `${selectedSession.vitals.systolicBP}/${selectedSession.vitals.diastolicBP} mmHg` : 'Not measured'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-center">
                          <span className="text-[10px] text-gray-400 font-sans block uppercase">Heart Rate</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm">{selectedSession.vitals.heartRate ? `${selectedSession.vitals.heartRate} bpm` : 'Not measured'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-center">
                          <span className="text-[10px] text-gray-400 font-sans block uppercase">SpO2 Oxygen</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm">{selectedSession.vitals.spo2 ? `${selectedSession.vitals.spo2}%` : 'Not measured'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-medium space-y-1">
                    <p><strong>Intake Language:</strong> {selectedSession?.languagePreference || 'Hindi/English'}</p>
                    <p><strong>Consent Timestamp:</strong> {selectedSession?.consent?.consentedAt ? new Date(selectedSession.consent.consentedAt).toLocaleString() : 'Granted during kiosk check-in'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                Session Token: {selectedSession?.tokenNumber}
              </span>
              <button
                type="button"
                onClick={() => setIsEvidenceDrawerOpen(false)}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                Close Evidence Drawer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* CONFIRMATION MODAL 1: Confirm Case Sheet Signature */}
      {isConfirmApproveModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full shadow-2xl space-y-5 text-slate-900 dark:text-white animate-in zoom-in-95 duration-200"
            style={{ maxWidth: '500px' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black !text-slate-900 dark:!text-white tracking-tight">
                  Confirm Case Sheet Signature
                </h3>
                <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                  Token: {selectedSession?.tokenNumber}
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Are you sure you want to approve and digitally sign the consultation case sheet for <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedSession?.patientName}</strong>? This action will generate the certified ABDM FHIR bundle and archive the clinical record.
            </p>
            
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmApproveModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel / Edit Case Sheet
              </button>
              <button
                type="button"
                onClick={executeApproveCaseSheet}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Yes, Sign & Approve
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CONFIRMATION MODAL 2: Next Patient Prompt */}
      {isNextPatientModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[999999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 w-full shadow-2xl space-y-5 text-slate-900 dark:text-white animate-in zoom-in-95 duration-200"
            style={{ maxWidth: '520px' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black !text-slate-900 dark:!text-white tracking-tight">
                  Case Sheet Signed & Saved
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                  {outcomeResult?.demo
                    ? 'Demo case — nothing was written to the record'
                    : 'Consultation recorded & archived'}
                </p>
              </div>
            </div>

            {/* The outcome the doctor needs to read out to the patient. */}
            {outcomeResult?.labTokenNumber && (
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                  Send patient to the laboratory
                </span>
                <p className="text-2xl font-black font-mono text-teal-900 dark:text-white">
                  {outcomeResult.labTokenNumber}
                </p>
                <p className="text-[11px] text-teal-700 dark:text-teal-200 font-medium">
                  New lab token issued. The order is already on the lab dashboard.
                </p>
              </div>
            )}

            {outcomeResult?.followUpDate && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  Follow-up scheduled
                </span>
                <p className="text-base font-black text-amber-950 dark:text-white">
                  {new Date(outcomeResult.followUpDate).toLocaleDateString(undefined, {
                    weekday: 'long', day: 'numeric', month: 'short'
                  })}
                </p>
              </div>
            )}

            {!outcomeResult?.labTokenNumber && !outcomeResult?.followUpDate && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold text-center">
                Treatment complete — encounter closed and digitally signed.
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              Load the next waiting patient, or stay on this record?
            </p>
            
            <div className="flex flex-col gap-2.5 pt-2">
              {nextPatientCandidate ? (
                <button
                  type="button"
                  onClick={loadNextPatientAndCloseModal}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <UserCheck className="w-4 h-4" /> Proceed to Next Patient ({nextPatientCandidate.patientName} - {nextPatientCandidate.tokenNumber})
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs text-center font-bold">
                  All OPD Patients in your department queue have been attended!
                </div>
              )}
              <button
                type="button"
                onClick={stayOnCurrentPatientAndCloseModal}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
              >
                Stay on Current Record / View Roster
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DoctorDashboard;
