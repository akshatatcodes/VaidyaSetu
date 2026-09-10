import React, { useState, useMemo } from 'react';
import {
  Activity, AlertTriangle, FileText, Pill, Clock, Calendar,
  Shield, CheckCircle2, ChevronRight, Search, Plus, Filter,
  Heart, Thermometer, Droplets, Zap, ShieldAlert, Download,
  ExternalLink, Sparkles, User, Stethoscope, Eye, AlertOctagon,
  Check, X, FileCheck, Layers, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

// Default rich clinical sample data for demonstration / walk-in patients
const DEFAULT_MEDICAL_HISTORY = {
  chronicIllnesses: [
    {
      id: 'ci-1',
      name: 'Type 2 Diabetes Mellitus',
      code: 'ICD-10: E11.9 / AYUSH: Prameha',
      diagnosedDate: 'March 2021',
      status: 'Uncontrolled',
      severity: 'high',
      notes: 'HbA1c elevated at 8.2%. Managed on Metformin 1000mg BD.',
      physician: 'Dr. A. Sharma (AIIA Kayachikitsa)'
    },
    {
      id: 'ci-2',
      name: 'Essential Hypertension',
      code: 'ICD-10: I10 / AYUSH: Raktachapa Vriddhi',
      diagnosedDate: 'November 2022',
      status: 'Controlled',
      severity: 'moderate',
      notes: 'Systolic maintained at 130-136 mmHg with Telmisartan 40mg.',
      physician: 'Dr. V. K. Nair (AIIMS Delhi)'
    },
    {
      id: 'ci-3',
      name: 'Osteoarthritis (Bilateral Knees)',
      code: 'ICD-10: M17.0 / AYUSH: Sandhigata Vata',
      diagnosedDate: 'June 2024',
      status: 'Active Flare-up',
      severity: 'moderate',
      notes: 'Crepitus and early morning stiffness lasting > 30 mins.',
      physician: 'Dr. R. Joshi (Shalya Tantra)'
    }
  ],
  allergies: [
    {
      id: 'al-1',
      substance: 'Penicillin / Amoxicillin',
      category: 'Drug',
      reaction: 'Severe Urticaria, Facial Angioedema & Dyspnea',
      severity: 'Critical / Anaphylactic',
      diagnosedDate: '12 May 2019',
      verified: true,
      alertNote: 'CONTRAINDICATED: Do not administer beta-lactam antibiotics.'
    },
    {
      id: 'al-2',
      substance: 'NSAIDs (Diclofenac & Ibuprofen)',
      category: 'Drug',
      reaction: 'Acute Epigastric Burning & Bronchospasm',
      severity: 'Moderate',
      diagnosedDate: '18 Aug 2022',
      verified: true,
      alertNote: 'Use Paracetamol or Ayurvedic Shalaki/Guggulu formulations instead.'
    },
    {
      id: 'al-3',
      substance: 'Peanuts & Tree Nuts',
      category: 'Food',
      reaction: 'Contact dermatitis & itching',
      severity: 'Mild',
      diagnosedDate: 'Childhood',
      verified: false,
      alertNote: 'Avoid food items containing crushed peanut oils.'
    }
  ],
  labReports: [
    {
      id: 'lr-1',
      testName: 'HbA1c (Glycated Hemoglobin)',
      category: 'Metabolic Panel',
      currentValue: '8.2%',
      previousValue: '7.1%',
      normalRange: '< 5.7% (Normal), 5.7 - 6.4% (Prediabetic)',
      date: '04 Sep 2026',
      status: 'abnormal',
      trend: 'elevated',
      delta: '+1.1%',
      labName: 'Dr. Lal PathLabs, New Delhi',
      significance: 'Glycemic control worsening over last 3 months. Needs dosage review.'
    },
    {
      id: 'lr-2',
      testName: 'Fasting Blood Sugar (FBS)',
      category: 'Metabolic Panel',
      currentValue: '158 mg/dL',
      previousValue: '132 mg/dL',
      normalRange: '70 - 99 mg/dL',
      date: '04 Sep 2026',
      status: 'abnormal',
      trend: 'elevated',
      delta: '+26 mg/dL',
      labName: 'Dr. Lal PathLabs, New Delhi',
      significance: 'Marked morning fasting hyperglycemia.'
    },
    {
      id: 'lr-3',
      testName: 'Serum Creatinine',
      category: 'Renal Function (KFT)',
      currentValue: '1.0 mg/dL',
      previousValue: '0.9 mg/dL',
      normalRange: '0.7 - 1.2 mg/dL',
      date: '04 Sep 2026',
      status: 'normal',
      trend: 'stable',
      delta: '+0.1 mg/dL',
      labName: 'AIIA Central Laboratory',
      significance: 'Renal function within normal physiological limits.'
    },
    {
      id: 'lr-4',
      testName: 'Lipid Profile - Triglycerides',
      category: 'Cardiovascular',
      currentValue: '210 mg/dL',
      previousValue: '190 mg/dL',
      normalRange: '< 150 mg/dL',
      date: '12 Jul 2026',
      status: 'abnormal',
      trend: 'elevated',
      delta: '+20 mg/dL',
      labName: 'AIIA Central Laboratory',
      significance: 'Mild hypertriglyceridemia, dietary modifications advised.'
    },
    {
      id: 'lr-5',
      testName: 'Hemoglobin (Hb)',
      category: 'Complete Blood Count (CBC)',
      currentValue: '13.4 g/dL',
      previousValue: '12.8 g/dL',
      normalRange: '13.0 - 17.0 g/dL',
      date: '04 Sep 2026',
      status: 'normal',
      trend: 'improved',
      delta: '+0.6 g/dL',
      labName: 'Dr. Lal PathLabs, New Delhi',
      significance: 'Anemia ruled out. Satisfactory oxygen-carrying capacity.'
    }
  ],
  pastVisits: [
    {
      id: 'pv-1',
      visitDate: '12 Aug 2026',
      type: 'OPD Consultation',
      facility: 'All India Institute of Ayurveda (AIIA), New Delhi',
      department: 'Kayachikitsa (Room 104)',
      doctor: 'Dr. Priya Sharma (MD Ayur)',
      primaryComplaint: 'Burning epigastric pain & fatigue for 1 week',
      diagnosis: 'Amlapitta (Hyperacidity) with uncontrolled Prameha',
      rxSummary: 'Kamadudha Rasa 250mg BD, Avipattikar Churna 3g HS with warm water, Metformin continued.',
      vitalsAtVisit: 'BP: 138/86 mmHg, Pulse: 78 bpm, SpO2: 98%'
    },
    {
      id: 'pv-2',
      visitDate: '15 Mar 2026',
      type: 'Routine Follow-up',
      facility: 'AIIMS New Delhi',
      department: 'General Medicine (OPD Block 3)',
      doctor: 'Dr. S. K. Verma',
      primaryComplaint: 'Quarterly diabetic check-up and knee soreness',
      diagnosis: 'Type 2 Diabetes Mellitus + Bilateral Knee Osteoarthritis',
      rxSummary: 'Metformin 500mg BD, Calcium + Vitamin D3 supplements, Quad exercises advised.',
      vitalsAtVisit: 'BP: 132/84 mmHg, Pulse: 74 bpm, Weight: 76 kg'
    },
    {
      id: 'pv-3',
      visitDate: '10 Nov 2025',
      type: 'Hospital Admission (IPD)',
      facility: 'Safdarjung Hospital, New Delhi',
      department: 'Cardiology / Acute Observation',
      doctor: 'Dr. M. Grover',
      primaryComplaint: 'Severe retrosternal chest discomfort following heavy meal',
      diagnosis: 'Atypical GERD chest pain, Acute Coronary Syndrome ruled out by negative Trop-I',
      rxSummary: 'Discharge Summary: Pantoprazole 40mg IV stepped down to oral. Stress Echo Normal.',
      vitalsAtVisit: 'BP: 154/92 mmHg, ECG: Normal Sinus Rhythm'
    }
  ],
  medications: [
    {
      id: 'med-1',
      name: 'Metformin Hydrochloride',
      dosage: '1000 mg',
      frequency: 'Twice daily (BD) - Post Meals',
      type: 'Allopathic / Antidiabetic',
      startedDate: 'March 2021',
      status: 'Active',
      adherence: '94%',
      prescriber: 'Dr. Priya Sharma'
    },
    {
      id: 'med-2',
      name: 'Telmisartan',
      dosage: '40 mg',
      frequency: 'Once daily (OD) - Morning',
      type: 'Allopathic / Antihypertensive',
      startedDate: 'Nov 2022',
      status: 'Active',
      adherence: '98%',
      prescriber: 'Dr. V. K. Nair'
    },
    {
      id: 'med-3',
      name: 'Avipattikar Churna',
      dosage: '3 grams',
      frequency: 'Bedtime (HS) with Lukewarm Water',
      type: 'Classical AYUSH / Pitta Samana',
      startedDate: 'Aug 2026',
      status: 'Active',
      adherence: '85%',
      prescriber: 'AIIA Kayachikitsa'
    },
    {
      id: 'med-4',
      name: 'Ashwagandha Churna',
      dosage: '3 grams',
      frequency: 'Night with warm milk',
      type: 'Classical AYUSH / Rasayana',
      startedDate: 'May 2026',
      status: 'Active',
      adherence: '90%',
      prescriber: 'Self / Wellness'
    },
    {
      id: 'med-5',
      name: 'Diclofenac Sodium 50mg',
      dosage: '50 mg',
      frequency: 'SOS for knee pain',
      type: 'Allopathic / NSAID',
      startedDate: 'June 2022',
      status: 'Discontinued',
      adherence: 'Discontinued due to allergic gastric distress',
      prescriber: 'Discontinued Aug 2022'
    }
  ],
  surgeries: [
    {
      id: 'surg-1',
      procedure: 'Laparoscopic Appendectomy',
      date: 'September 2018',
      hospital: 'Deen Dayal Upadhyay Hospital, New Delhi',
      indication: 'Acute appendicitis with localized peritonitis',
      implants: 'None',
      outcome: 'Full recovery, uneventful healing.'
    },
    {
      id: 'surg-2',
      procedure: 'Right Knee Diagnostic Arthroscopy',
      date: 'January 2025',
      hospital: 'AIIA Shalya Department, New Delhi',
      indication: 'Medial meniscus fraying & degenerative cartilage debridement',
      implants: 'None',
      outcome: 'Relieved acute locking sensation.'
    }
  ],
  familyHistory: [
    { relative: 'Father', condition: 'Type 2 Diabetes Mellitus & Myocardial Infarction at age 58', status: 'Deceased' },
    { relative: 'Mother', condition: 'Hypertension & Osteoporosis', status: 'Living (Age 72)' },
    { relative: 'Elder Brother', condition: 'Type 2 Diabetes (Diagnosed age 44)', status: 'Living (Age 52)' }
  ],
  aharaVihara: {
    prakriti: 'Pitta-Vata (Agni Dominant)',
    dietType: 'Vegetarian (Occasional spicy / deep fried snacks)',
    dominantTaste: 'Lavan (Salty) & Katu (Spicy)',
    agniState: 'Vishamagni (Irregular digestive fire with hyperacidity flares)',
    koshtaHabit: 'Madhyama (Regular, occasionally constipated during travel)',
    sleepPattern: '6 hours / night, disturbed by nocturnal thirst',
    vyayama: 'Sedentary (desk work, walks ~20 mins daily)',
    vyasana: 'None (No tobacco or alcohol consumption)'
  }
};

export default function ComprehensiveMedicalHistory({
  patientData = {},
  onClose,
  isModal = false,
  readOnly = false
}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [historyData, setHistoryData] = useState(() => {
    // Merge provided patientData with sample baseline for rich evaluation
    return {
      ...DEFAULT_MEDICAL_HISTORY,
      chronicIllnesses: patientData.pastDiseases?.length
        ? patientData.pastDiseases.map((d, i) => ({
            id: `ci-${i}`,
            name: d,
            code: 'Recorded via Kiosk Intake',
            diagnosedDate: 'Prior Medical Record',
            status: 'Active',
            severity: 'moderate',
            notes: 'Reported during clinical case-taking.',
            physician: 'Self-Reported / ABHA'
          }))
        : DEFAULT_MEDICAL_HISTORY.chronicIllnesses,
      allergies: patientData.allergies?.length
        ? patientData.allergies.map((a, i) => ({
            id: `al-${i}`,
            substance: a,
            category: 'Drug / Substance',
            reaction: 'Known Adverse Sensitivity',
            severity: 'Critical / High-Alert',
            diagnosedDate: 'Prior Record',
            verified: true,
            alertNote: 'High-alert adverse reaction history.'
          }))
        : DEFAULT_MEDICAL_HISTORY.allergies
    };
  });

  // Modal for adding a new clinical entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('chronic'); // 'chronic' | 'allergy' | 'lab' | 'med' | 'surgery' | 'family'
  const [newEntryForm, setNewEntryForm] = useState({
    name: '',
    substance: '',
    severity: 'moderate',
    notes: '',
    date: new Date().toISOString().slice(0, 10),
    value: '',
    doctor: '',
    dosage: '',
    frequency: '',
    type: 'Ayurvedic',
    relative: 'Father',
    condition: '',
    procedure: '',
    hospital: '',
    outcome: 'Resolved / Normal'
  });

  const handleAddEntry = (e) => {
    e.preventDefault();
    if (addType === 'chronic') {
      if (!newEntryForm.name) return;
      const newIllness = {
        id: 'ci-' + Date.now(),
        name: newEntryForm.name,
        code: 'Clinician Documented Entry',
        diagnosedDate: newEntryForm.date || 'Recent',
        status: 'Active',
        severity: newEntryForm.severity,
        notes: newEntryForm.notes || 'Added during clinical intake.',
        physician: newEntryForm.doctor || 'Attending Physician'
      };
      setHistoryData(prev => ({
        ...prev,
        chronicIllnesses: [newIllness, ...prev.chronicIllnesses]
      }));
    } else if (addType === 'allergy') {
      if (!newEntryForm.substance) return;
      const newAllergy = {
        id: 'al-' + Date.now(),
        substance: newEntryForm.substance,
        category: 'Drug / Clinical',
        reaction: newEntryForm.notes || 'Adverse response documented',
        severity: newEntryForm.severity === 'high' ? 'Critical / Anaphylactic' : 'Moderate',
        diagnosedDate: newEntryForm.date || 'Today',
        verified: true,
        alertNote: 'Entered by patient / doctor during case-taking.'
      };
      setHistoryData(prev => ({
        ...prev,
        allergies: [newAllergy, ...prev.allergies]
      }));
    } else if (addType === 'lab') {
      if (!newEntryForm.name || !newEntryForm.value) return;
      const newLab = {
        id: 'lr-' + Date.now(),
        testName: newEntryForm.name,
        category: 'Diagnostic Biomarker',
        currentValue: newEntryForm.value,
        previousValue: 'N/A',
        normalRange: 'Standard Physiological',
        date: newEntryForm.date || 'Today',
        status: newEntryForm.severity === 'high' ? 'abnormal' : 'normal',
        trend: newEntryForm.severity === 'high' ? 'elevated' : 'stable',
        delta: 'Baseline',
        labName: newEntryForm.doctor || 'In-House Laboratory / Kiosk Point-of-Care',
        significance: newEntryForm.notes || 'Documented test result.'
      };
      setHistoryData(prev => ({
        ...prev,
        labReports: [newLab, ...prev.labReports]
      }));
    } else if (addType === 'med') {
      if (!newEntryForm.name) return;
      const newMed = {
        id: 'med-' + Date.now(),
        name: newEntryForm.name,
        dosage: newEntryForm.dosage || 'Standard dose',
        frequency: newEntryForm.frequency || 'Daily',
        type: newEntryForm.type || 'Ayurvedic / Classical',
        startedDate: newEntryForm.date || 'Recent',
        status: 'Active',
        adherence: 'Ongoing',
        prescriber: newEntryForm.doctor || 'Self / Clinical Prescriber'
      };
      setHistoryData(prev => ({
        ...prev,
        medications: [newMed, ...prev.medications]
      }));
    } else if (addType === 'surgery') {
      if (!newEntryForm.procedure) return;
      const newSurg = {
        id: 'surg-' + Date.now(),
        procedure: newEntryForm.procedure,
        date: newEntryForm.date || 'Recent',
        hospital: newEntryForm.hospital || 'District Hospital / Medical Center',
        indication: newEntryForm.notes || 'Surgical intervention',
        implants: 'None',
        outcome: newEntryForm.outcome || 'Recovered uneventfully'
      };
      setHistoryData(prev => ({
        ...prev,
        surgeries: [newSurg, ...prev.surgeries]
      }));
    } else if (addType === 'family') {
      if (!newEntryForm.condition) return;
      const newFam = {
        relative: newEntryForm.relative || 'Family Member',
        condition: newEntryForm.condition,
        status: newEntryForm.notes || 'Documented hereditary trait'
      };
      setHistoryData(prev => ({
        ...prev,
        familyHistory: [newFam, ...prev.familyHistory]
      }));
    }
    setShowAddModal(false);
    setNewEntryForm({
      name: '', substance: '', severity: 'moderate', notes: '',
      date: new Date().toISOString().slice(0, 10), value: '', doctor: '',
      dosage: '', frequency: '', type: 'Ayurvedic', relative: 'Father',
      condition: '', procedure: '', hospital: '', outcome: 'Resolved / Normal'
    });
  };


  // Filtered queries for search
  const filteredChronic = useMemo(() => {
    return historyData.chronicIllnesses.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [historyData.chronicIllnesses, searchTerm]);

  const filteredAllergies = useMemo(() => {
    return historyData.allergies.filter(item =>
      item.substance.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reaction.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [historyData.allergies, searchTerm]);

  const filteredLabs = useMemo(() => {
    return historyData.labReports.filter(item =>
      item.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [historyData.labReports, searchTerm]);

  const filteredVisits = useMemo(() => {
    return historyData.pastVisits.filter(item =>
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doctor.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [historyData.pastVisits, searchTerm]);

  const filteredMeds = useMemo(() => {
    return historyData.medications.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [historyData.medications, searchTerm]);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col ${isModal ? 'max-h-[90vh]' : 'w-full'}`}>
      
      {/* ────────────────── TOP COMPREHENSIVE HEADER ────────────────── */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Longitudinal Clinical Record (SIH PS 26047)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase">
                ABDM / ABHA Linked
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
              <Stethoscope className="w-6 h-6 text-emerald-400" />
              Comprehensive Medical History & Diagnostic Dossier
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl">
              Unified longitudinal case-sheet: chronic comorbidities, high-alert drug allergies, multi-visit timeline, lab trends, and classical AYUSH Ahara-Vihara.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Record
              </button>
            )}
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
                title="Close Medical History"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Vital Highlight Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-gray-400 block uppercase font-bold">Chronic Illnesses</span>
            <span className="text-base font-black text-white">{historyData.chronicIllnesses.length} Conditions</span>
          </div>
          <div className="bg-rose-500/10 rounded-xl p-2.5 border border-rose-500/20">
            <span className="text-[10px] text-rose-300 block uppercase font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-400" /> Known Allergies
            </span>
            <span className="text-base font-black text-rose-300">{historyData.allergies.length} High-Alert</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-gray-400 block uppercase font-bold">Lab Biomarkers</span>
            <span className="text-base font-black text-emerald-300">{historyData.labReports.length} Tracked</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <span className="text-[10px] text-gray-400 block uppercase font-bold">Past Hospital Visits</span>
            <span className="text-base font-black text-white">{historyData.pastVisits.length} Documented</span>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-gray-400 block uppercase font-bold">Prakriti / Agni</span>
            <span className="text-xs font-black text-amber-300 truncate block">{historyData.aharaVihara.prakriti}</span>
          </div>
        </div>
      </div>

      {/* ────────────────── SEARCH & TAB NAVIGATION ────────────────── */}
      <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-thin">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'labs', label: 'Lab Reports & Trends', icon: Activity, count: historyData.labReports.length },
            { id: 'allergies', label: 'Allergies', icon: AlertTriangle, count: historyData.allergies.length, alert: true },
            { id: 'visits', label: 'Past Visits', icon: Calendar, count: historyData.pastVisits.length },
            { id: 'meds', label: 'Medications', icon: Pill, count: historyData.medications.length },
            { id: 'chronic', label: 'Chronic Illnesses', icon: FileCheck, count: historyData.chronicIllnesses.length },
            { id: 'surgeries', label: 'Surgeries', icon: Stethoscope, count: historyData.surgeries.length },
            { id: 'ayush', label: 'AYUSH Lifestyle', icon: Heart }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.alert && !isActive ? 'text-rose-500' : ''}`} />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-white/25 text-white' : tab.alert ? 'bg-rose-500/20 text-rose-500' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search records, drugs, tests..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ────────────────── MAIN TAB CONTENT CONTAINER ────────────────── */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Critical Allergy & Warning Banner */}
            {historyData.allergies.some(a => a.severity.includes('Critical')) && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex items-start gap-3.5 text-xs text-rose-900 dark:text-rose-200">
                <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                    High-Alert Clinical Contraindication Warning
                  </span>
                  <p className="font-medium leading-relaxed">
                    Patient has documented anaphylactic sensitivity to <strong>Penicillins</strong> and severe gastric reaction to <strong>NSAIDs</strong>. Do not administer beta-lactams or strong synthetic NSAIDs without allergy clearance.
                  </p>
                </div>
              </div>
            )}

            {/* Quick 2-Column Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card A: Active Problem List */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> Active Chronic Conditions
                  </h3>
                  <button onClick={() => setActiveTab('chronic')} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                    View All ({historyData.chronicIllnesses.length})
                  </button>
                </div>
                <div className="space-y-2">
                  {historyData.chronicIllnesses.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{c.name}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{c.code} • Since {c.diagnosedDate}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        c.status === 'Controlled' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card B: Recent Out-of-Range Labs */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" /> Recent Lab Biomarkers
                  </h3>
                  <button onClick={() => setActiveTab('labs')} className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                    Detailed Trends ({historyData.labReports.length})
                  </button>
                </div>
                <div className="space-y-2">
                  {historyData.labReports.slice(0, 3).map(lab => (
                    <div key={lab.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{lab.testName}</span>
                        <span className="text-[10px] text-gray-500 font-mono">{lab.date} • {lab.labName}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-black font-mono text-sm block ${lab.status === 'abnormal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {lab.currentValue}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold">{lab.delta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card C: Current Active Medications */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-200 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-purple-500" /> Ongoing Prescriptions & Regimen
                  </h3>
                  <button onClick={() => setActiveTab('meds')} className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline">
                    All Meds ({historyData.medications.length})
                  </button>
                </div>
                <div className="space-y-2">
                  {historyData.medications.filter(m => m.status === 'Active').slice(0, 3).map(m => (
                    <div key={m.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{m.name} ({m.dosage})</span>
                        <span className="text-[10px] text-gray-500 font-medium">{m.frequency}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-black">
                        {m.type.split('/')[0].trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card D: Last OPD Visit Summary */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-500" /> Latest Hospital Visit
                  </h3>
                  <button onClick={() => setActiveTab('visits')} className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline">
                    Visit History
                  </button>
                </div>
                {historyData.pastVisits[0] && (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{historyData.pastVisits[0].facility}</span>
                      <span className="font-mono text-gray-500 text-[10px]">{historyData.pastVisits[0].visitDate}</span>
                    </div>
                    <p className="text-slate-600 dark:text-gray-300 text-[11px] leading-relaxed">
                      <strong>Diagnosis:</strong> {historyData.pastVisits[0].diagnosis}
                    </p>
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                      <span>Attending: {historyData.pastVisits[0].doctor}</span>
                      <span className="font-mono">{historyData.pastVisits[0].vitalsAtVisit}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: LAB REPORTS & LONGITUDINAL TRENDS */}
        {activeTab === 'labs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Longitudinal Diagnostic Biomarker Trends
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Tracking chronological progression across outpatient visits and external NABL labs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLabs.map(lab => (
                <div
                  key={lab.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    lab.status === 'abnormal'
                      ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-gray-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block">{lab.category}</span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{lab.testName}</h4>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{lab.date} • {lab.labName}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                      lab.status === 'abnormal'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {lab.status === 'abnormal' ? <ArrowUpRight className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {lab.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-200 dark:border-white/10 my-2">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Current Value</span>
                      <span className="text-lg font-black font-mono text-slate-900 dark:text-white">{lab.currentValue}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">Previous Value</span>
                      <span className="text-base font-black font-mono text-gray-500">{lab.previousValue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-gray-500">Ref Range: {lab.normalRange}</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{lab.delta}</span>
                  </div>

                  {lab.significance && (
                    <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/5 text-[11px] font-medium text-slate-700 dark:text-gray-300 leading-relaxed">
                      💡 <strong>Clinical Note:</strong> {lab.significance}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ALLERGIES & ADVERSE DRUG REACTIONS */}
        {activeTab === 'allergies' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Documented Adverse Reactions & Allergies
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Integrated safety system checks newly prescribed AYUSH & allopathic drugs against these documented hazards.
              </p>
            </div>

            <div className="space-y-3">
              {filteredAllergies.map(allergy => (
                <div
                  key={allergy.id}
                  className="p-5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border-2 border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base font-black text-slate-900 dark:text-white">{allergy.substance}</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold text-[10px] uppercase">
                        {allergy.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] uppercase">
                        {allergy.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-rose-200 font-medium">
                      <strong>Reaction Experienced:</strong> {allergy.reaction}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                      Documented: {allergy.diagnosedDate} • Verified by Physician: {allergy.verified ? 'Yes (ABDM)' : 'Self-Reported'}
                    </p>
                  </div>

                  <div className="sm:max-w-xs p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-rose-500/20 text-[11px] text-rose-700 dark:text-rose-300 font-bold shrink-0">
                    ⚠️ {allergy.alertNote}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PAST OPD & IPD VISITS */}
        {activeTab === 'visits' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Outpatient & Inpatient Hospital Visit History
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Chronological case-sheets and clinical consultations across health centers.
              </p>
            </div>

            <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-6">
              {filteredVisits.map((visit) => (
                <div key={visit.id} className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900" />
                  
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                          {visit.type} • {visit.department}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{visit.facility}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{visit.visitDate}</span>
                        <span className="text-[10px] text-gray-500 block">Attending: {visit.doctor}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/5 space-y-1.5 text-xs">
                      <div>
                        <span className="text-gray-400 font-bold">Presenting Complaint: </span>
                        <span className="text-slate-800 dark:text-gray-200 font-medium">{visit.primaryComplaint}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold">Clinical Diagnosis: </span>
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">{visit.diagnosis}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold">Prescription / Action: </span>
                        <span className="text-slate-700 dark:text-gray-300">{visit.rxSummary}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span>Vitals Recorded: {visit.vitalsAtVisit}</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1 cursor-pointer hover:underline">
                        <FileText className="w-3.5 h-3.5" /> View Case Sheet
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MEDICATIONS (CURRENT & PAST) */}
        {activeTab === 'meds' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Comprehensive Drug History (Allopathic & AYUSH)
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Active regimens, dosage schedule, verified adherence rates, and discontinued prescriptions.
              </p>
            </div>

            <div className="space-y-3">
              {filteredMeds.map(m => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    m.status === 'Active'
                      ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/30 border-gray-300 dark:border-white/5 opacity-70'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{m.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                        {m.dosage}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        m.status === 'Active' ? 'bg-blue-500/15 text-blue-600' : 'bg-gray-400/20 text-gray-500'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-gray-300 font-medium">
                      <strong>Dosage & Route:</strong> {m.frequency}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Category: {m.type} • Prescribed by: {m.prescriber} • Started: {m.startedDate}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Adherence</span>
                    <span className="text-xs font-black text-emerald-600 font-mono">{m.adherence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CHRONIC ILLNESSES */}
        {activeTab === 'chronic' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Documented Chronic Non-Communicable Diseases (NCDs)
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                ICD-10 and NAMASTE standardized morbidity diagnostic coding.
              </p>
            </div>

            <div className="space-y-3">
              {filteredChronic.map(c => (
                <div key={c.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{c.name}</h4>
                      <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">{c.code}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                      c.status === 'Controlled' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-gray-300 font-medium leading-relaxed">
                    {c.notes}
                  </p>
                  <div className="pt-2 border-t border-gray-200 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Diagnosed: {c.diagnosedDate}</span>
                    <span>Physician: {c.physician}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: SURGERIES */}
        {activeTab === 'surgeries' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Surgical Interventions, Procedures & Implants
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Critical for MRI safety screening, anesthesia history, and anatomical assessments.
              </p>
            </div>

            <div className="space-y-3">
              {historyData.surgeries.map(s => (
                <div key={s.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">{s.procedure}</h4>
                    <span className="text-xs font-mono font-bold text-gray-500">{s.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-gray-300">
                    <strong>Indication:</strong> {s.indication} • <strong>Hospital:</strong> {s.hospital}
                  </p>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/5 text-[11px] flex items-center justify-between">
                    <span><strong>Prosthetic Implants / Stents:</strong> {s.implants}</span>
                    <span className="text-emerald-600 font-bold">{s.outcome}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: AYUSH AHARA-VIHARA LIFESTYLE */}
        {activeTab === 'ayush' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Classical AYUSH Ahara-Vihara & Prakriti Baseline
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Charaka Samhita individualized constitutional profile (Agni, Koshta, Nidra, Vyayama).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10">
                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Prakriti</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block">{historyData.aharaVihara.prakriti}</span>
                <span className="text-[11px] text-gray-500 mt-1 block">Baseline psycho-somatic constitution</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10">
                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Agni (Digestive Fire)</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 block">{historyData.aharaVihara.agniState}</span>
                <span className="text-[11px] text-gray-500 mt-1 block">Metabolic rate & appetite pattern</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10">
                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Koshta (Bowel)</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block">{historyData.aharaVihara.koshtaHabit}</span>
                <span className="text-[11px] text-gray-500 mt-1 block">Eliminative tract reactivity</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10">
                <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nidra (Circadian Sleep)</span>
                <span className="text-sm font-black text-slate-900 dark:text-white block">{historyData.aharaVihara.sleepPattern}</span>
                <span className="text-[11px] text-gray-500 mt-1 block">Sleep quality and interruptions</span>
              </div>
            </div>

            {/* Hereditary Genogram Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Family Hereditary Health Risks (1st-Degree Relatives)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {historyData.familyHistory.map((fh, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-emerald-600">{fh.relative}</span>
                      <span className="text-[10px] text-gray-400">{fh.status}</span>
                    </div>
                    <p className="text-slate-700 dark:text-gray-300 font-medium text-[11px] leading-relaxed">
                      {fh.condition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ────────────────── ADD RECORD MODAL ────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-emerald-500/30 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" /> Log Clinical Record
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
              {[
                { id: 'chronic', label: 'Condition' },
                { id: 'allergy', label: 'Allergy' },
                { id: 'med', label: 'Medicine' },
                { id: 'lab', label: 'Lab Test' },
                { id: 'surgery', label: 'Surgery' },
                { id: 'family', label: 'Family' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAddType(t.id)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer truncate text-center ${
                    addType === t.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-gray-400 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddEntry} className="space-y-3 text-xs">
              {addType === 'chronic' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Condition / Chronic Disease Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hypothyroidism, Type 2 Diabetes, Asthma"
                      value={newEntryForm.name}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Severity</label>
                      <select
                        value={newEntryForm.severity}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, severity: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High / Severe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Diagnosed Date</label>
                      <input
                        type="date"
                        value={newEntryForm.date}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {addType === 'allergy' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Allergenic Substance / Drug</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sulfa drugs, Ciprofloxacin, Peanuts"
                      value={newEntryForm.substance}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, substance: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Severity / Reaction Level</label>
                    <select
                      value={newEntryForm.severity}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, severity: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="high">Critical / Anaphylactic Risk</option>
                      <option value="moderate">Moderate (Rash, Wheezing)</option>
                      <option value="mild">Mild (Localized Itch)</option>
                    </select>
                  </div>
                </div>
              )}

              {addType === 'med' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Medicine Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Yogaraj Guggulu, Metformin"
                        value={newEntryForm.name}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Dosage & Frequency</label>
                      <input
                        type="text"
                        placeholder="e.g. 500mg Once Daily"
                        value={newEntryForm.dosage}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, dosage: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Medical System</label>
                      <select
                        value={newEntryForm.type}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Classical AYUSH / Ayurvedic">Classical AYUSH / Ayurvedic</option>
                        <option value="Allopathic / Modern Medicine">Allopathic / Modern Medicine</option>
                        <option value="Homeopathy / Alternative">Homeopathy / Alternative</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Prescribing Doctor</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. A. Sharma"
                        value={newEntryForm.doctor}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, doctor: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {addType === 'lab' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Test Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Total Cholesterol, HbA1c"
                        value={newEntryForm.name}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Measured Value</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 210 mg/dL"
                        value={newEntryForm.value}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, value: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Diagnostic Laboratory</label>
                    <input
                      type="text"
                      placeholder="e.g. AIIA Central Lab, Dr Lal Pathlabs"
                      value={newEntryForm.doctor}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, doctor: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {addType === 'surgery' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Surgical Procedure</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Laparoscopic Cholecystectomy, Knee Arthroscopy"
                      value={newEntryForm.procedure}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, procedure: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Hospital / Center</label>
                      <input
                        type="text"
                        placeholder="e.g. AIIA Hospital, AIIMS Delhi"
                        value={newEntryForm.hospital}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, hospital: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Year / Date</label>
                      <input
                        type="text"
                        placeholder="e.g. Jan 2024"
                        value={newEntryForm.date}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {addType === 'family' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Relative</label>
                      <select
                        value={newEntryForm.relative}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, relative: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Paternal Grandfather">Paternal Grandfather</option>
                        <option value="Maternal Grandmother">Maternal Grandmother</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Status</label>
                      <select
                        value={newEntryForm.notes}
                        onChange={(e) => setNewEntryForm({ ...newEntryForm, notes: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Living">Living</option>
                        <option value="Deceased">Deceased</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Hereditary Condition / Disease</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Type 2 Diabetes, Early Myocardial Infarction, Hypertension"
                      value={newEntryForm.condition}
                      onChange={(e) => setNewEntryForm({ ...newEntryForm, condition: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-gray-300 font-bold mb-1">Additional Notes / Clinical Context</label>
                <textarea
                  rows="2"
                  placeholder="Additional context, onset symptoms, or doctor remarks..."
                  value={newEntryForm.notes}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-gray-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Save to Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
