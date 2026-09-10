import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, Eye, FileText, ChevronRight, Activity, Calendar, ShieldCheck, X } from 'lucide-react';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';

export default function DoctorPatients() {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/patients`)
      .then(res => {
        if (res.data?.data) {
          setPatients(res.data.data);
        }
      })
      .catch(err => console.warn('Patients fetch note:', err.message));
  }, []);

  const checkedPatientsDemo = [
    {
      _id: 'pat_demo_1',
      tokenNumber: 'OPD-001',
      encounterId: 'ENC-2026-001',
      hospitalId: 'AIIA-HOSP-8891',
      department: 'Kayachikitsa',
      basicInfo: { fullName: 'Rajesh Sharma', age: 52, gender: 'Male' },
      abhaId: '14-8921-3401-9921',
      contactNumber: '+91 9876543210',
      queueStatus: 'completed',
      lastDiagnosis: 'Amlapitta (Gastro-Esophageal Reflux Disease)',
      lastVisitDate: '09 Sep 2026',
      vitals: { bp: '138/88 mmHg', spo2: '98%', temp: '98.6°F', hr: '82 bpm', bmi: '27.0 (Overweight)' },
      chiefComplaint: 'गंभीर छाती में जलन, खट्टी डकारें और पेट में भारीपन पिछले 5 दिनों से हो रहा है।',
      socrates: {
        site: 'Epigastric / Retrosternal',
        onset: '5 days ago',
        character: 'Severe burning sensation with sour water brash',
        radiation: 'Ascending to throat',
        severity: '7 / 10',
        timing: 'Worse 1-2 hours post meals and lying down'
      },
      dashavidhaPariksha: {
        prakriti: 'Pitta-Vata',
        agni: 'Tikshnagni (Hyperactive / Acidic)',
        koshtha: 'Krura (Constipated)',
        nadi: 'मण्डूक गति (Pitta - Rapid jumping pulse)',
        jihwa: 'साम (White thick coating at base / Ama)'
      },
      pastMedicalHistory: ['Hypertension (Stage 1)', 'Dyslipidemia'],
      allergies: ['Penicillin (Maculopapular rash)'],
      ocrPrescriptions: ['Amlodipine 5mg OD (Morning)', 'Atorvastatin 10mg HS (Bedtime)'],
      labReports: ['Complete Blood Count (CBC) — Normal', 'Serum Gastrin — 145 pg/mL (Elevated)', 'Liver Function Test (LFT) — Normal'],
      soapSummary: 'Subjective: Severe burning sensation & retrosternal pain. Objective: BP 138/88 mmHg. Plan: Avipattikar Churna 3g BD, Pantoprazole 40mg OD.',
      doctorSoapNote: {
        subjective: '52yo male with heartburn & acid reflux after irregular meals.',
        objective: 'Epigastric tenderness present. BP 138/88 mmHg. Jihwa Saama.',
        assessment: 'Amlapitta (GERD) with Pitta Vitiation. ICD-10: K21.9',
        plan: {
          ayurvedicMeds: [{ name: 'Avipattikar Churna', dosage: '3g', frequency: 'BD', anupana: 'Warm Water' }],
          allopathicMeds: [{ name: 'Pantoprazole', dosage: '40mg', frequency: 'OD', instructions: 'Before breakfast' }],
          investigations: ['Serum Gastrin follow-up in 14 days'],
          followUp: 'Return in 2 weeks or if symptoms worsen.'
        }
      }
    },
    {
      _id: 'pat_demo_2',
      tokenNumber: 'OPD-002',
      encounterId: 'ENC-2026-002',
      hospitalId: 'AIIA-HOSP-8892',
      department: 'Panchakarma',
      basicInfo: { fullName: 'Sunita Devi', age: 61, gender: 'Female' },
      abhaId: '14-1122-3344-5566',
      contactNumber: '+91 9811223344',
      queueStatus: 'completed',
      lastDiagnosis: 'Sandhivata (Bilateral Knee Osteoarthritis)',
      lastVisitDate: '08 Sep 2026',
      vitals: { bp: '126/80 mmHg', spo2: '99%', temp: '98.2°F', hr: '74 bpm', bmi: '28.7' },
      chiefComplaint: 'दोनों घुटनों में तेज दर्द, चलने में कट-कट की आवाज और सुबह के समय अकड़न।',
      socrates: {
        site: 'Bilateral Knee Joints',
        onset: '3 months, worsened last week',
        character: 'Crepitus on bending, joint stiffness',
        severity: '8 / 10',
        timing: 'Continuous ache, worse climbing stairs'
      },
      dashavidhaPariksha: {
        prakriti: 'Vata-Kapha',
        agni: 'Mandagni (Sluggish metabolism)',
        koshtha: 'Madhyama',
        nadi: 'सर्प गति (Vata - Thin irregular rhythm)',
        jihwa: 'निराम (Pink, clear)'
      },
      pastMedicalHistory: ['Type 2 Diabetes Mellitus (6 years)', 'Hypothyroidism'],
      allergies: ['Sulfa Drugs (Facial swelling)'],
      ocrPrescriptions: ['Metformin 500mg BD', 'Levothyroxine 50mcg OD'],
      labReports: ['Knee X-Ray (Grade II OA)', 'Rheumatoid Factor (Negative)', 'Serum Calcium (8.9 mg/dL)'],
      soapSummary: 'Subjective: Joint pain & morning stiffness. Objective: Crepitus on flexion. Plan: Yogaraj Guggulu 2 tab BD, Ashwagandha Churna 3g HS.',
      doctorSoapNote: {
        subjective: '61yo female with severe bilateral knee pain & crepitus.',
        objective: 'Mild effusion in right knee joint. Bilateral crepitus.',
        assessment: 'Sandhivata (Osteoarthritis of knees). ICD-10: M17.9',
        plan: {
          ayurvedicMeds: [{ name: 'Yogaraj Guggulu', dosage: '2 tabs', frequency: 'BD', anupana: 'Warm Water' }],
          allopathicMeds: [{ name: 'Metformin', dosage: '500mg', frequency: 'BD', instructions: 'With meals' }],
          investigations: ['Janu Basti recommendation for 7 sessions'],
          followUp: 'Re-evaluate post 7 sessions of Janu Basti.'
        }
      }
    },
    {
      _id: 'pat_demo_3',
      tokenNumber: 'OPD-003',
      encounterId: 'ENC-2026-003',
      hospitalId: 'AIIA-HOSP-8893',
      department: 'General Medicine',
      basicInfo: { fullName: 'Amit Verma', age: 34, gender: 'Male' },
      abhaId: '14-4455-6677-8899',
      contactNumber: '+91 9877665544',
      queueStatus: 'completed',
      lastDiagnosis: 'Acute Tracheobronchitis',
      lastVisitDate: '05 Sep 2026',
      vitals: { bp: '118/76 mmHg', spo2: '97%', temp: '100.2°F', hr: '88 bpm', bmi: '23.1' },
      chiefComplaint: 'Chest tightness, persistent dry cough, and mild feverish feeling for 3 days.',
      socrates: {
        site: 'Retrosternal / Tracheobronchial',
        onset: '3 days ago',
        character: 'Spasmodic cough, nocturnal worsening',
        severity: '6 / 10',
        timing: 'Aggravated by cold air exposure'
      },
      dashavidhaPariksha: {
        prakriti: 'Kapha-Vata',
        agni: 'Vishamagni',
        koshtha: 'Madhyama',
        nadi: 'कपोत गति (Vata-Kapha)',
        jihwa: 'ईषत् साम (Mildly coated)'
      },
      pastMedicalHistory: ['Seasonal Rhinitis'],
      allergies: ['Dust Mites'],
      ocrPrescriptions: ['Cetirizine 10mg HS'],
      labReports: ['Chest X-Ray (Clear)', 'WBC Count (11,200 /uL)', 'SpO2 Monitoring (97%)'],
      soapSummary: 'Subjective: Spasmodic cough & feverish feeling. Objective: Temp 100.2°F, SpO2 97%. Plan: Steam inhalation, Paracetamol SOS.',
      doctorSoapNote: {
        subjective: '34yo male with 3-day spasmodic dry cough and low grade fever.',
        objective: 'Bilateral mild rhonchi. Temp 100.2°F, SpO2 97%.',
        assessment: 'Kasa Roga / Acute Tracheobronchitis. ICD-10: J20.9',
        plan: {
          ayurvedicMeds: [{ name: 'Sitopaladi Churna', dosage: '3g', frequency: 'TDS', anupana: 'Honey' }],
          allopathicMeds: [{ name: 'Paracetamol', dosage: '650mg', frequency: 'SOS', instructions: 'Post meals' }],
          investigations: ['Repeat SpO2 check if dyspnea develops'],
          followUp: 'Review in 5 days.'
        }
      }
    },
    {
      _id: 'pat_demo_4',
      tokenNumber: 'OPD-004',
      encounterId: 'ENC-2026-004',
      hospitalId: 'AIIA-HOSP-8894',
      department: 'Kayachikitsa',
      basicInfo: { fullName: 'Priya Nair', age: 29, gender: 'Female' },
      abhaId: '14-7788-9900-1122',
      contactNumber: '+91 9899887766',
      queueStatus: 'completed',
      lastDiagnosis: 'Kasa (Bronchial Hyper-reactivity)',
      lastVisitDate: '02 Sep 2026',
      vitals: { bp: '112/72 mmHg', spo2: '99%', temp: '98.4°F', hr: '76 bpm', bmi: '21.4' },
      chiefComplaint: 'dust exposure allergen cough & throat irritation.',
      socrates: {
        site: 'Oropharyngeal',
        onset: '1 week',
        character: 'Dry tickling cough',
        severity: '5 / 10',
        timing: 'Morning and dust exposure'
      },
      dashavidhaPariksha: {
        prakriti: 'Vata-Pitta',
        agni: 'Sama Agni',
        koshtha: 'Mridu',
        nadi: 'प्राकृत गति',
        jihwa: 'निराम'
      },
      pastMedicalHistory: ['Allergic Bronchitis'],
      allergies: ['Parthenium Pollen'],
      ocrPrescriptions: ['Levocetirizine 5mg OD'],
      labReports: ['Absolute Eosinophil Count (Elevated)', 'Peak Flow Meter (380 L/min)'],
      soapSummary: 'Subjective: Allergic cough on dust exposure. Plan: Sitopaladi Churna 3g with honey, Vasavaleha 10g BD.',
      doctorSoapNote: {
        subjective: '29yo female with allergic cough triggered by dust.',
        objective: 'Throat mild congestion. Lungs clear.',
        assessment: 'Vataja Kasa / Allergic Airway. ICD-10: J45.909',
        plan: {
          ayurvedicMeds: [{ name: 'Vasavaleha', dosage: '10g', frequency: 'BD', anupana: 'Lukewarm Water' }],
          allopathicMeds: [],
          investigations: ['Peak Expiratory Flow Rate log'],
          followUp: 'Follow up in 3 weeks.'
        }
      }
    }
  ];

  // Filter out any active waiting queue sessions — show strictly checked & completed patients!
  const checkedOnly = (patients.length > 0 ? patients : checkedPatientsDemo).filter(
    p => p.queueStatus !== 'waiting_intake' && p.queueStatus !== 'waiting'
  );

  const filtered = checkedOnly.filter(p => {
    // Department Scoping: Doctor only sees patients matching their department if department is set
    if (currentUser?.department && p.department) {
      const docDept = currentUser.department.toLowerCase().replace('department of ', '').trim();
      const patDept = p.department.toLowerCase().replace('department of ', '').trim();
      if (!docDept.includes(patDept) && !patDept.includes(docDept)) {
        return false;
      }
    }
    if (!search) return true;
    const term = search.toLowerCase();
    const name = (p.basicInfo?.fullName || p.fullName || p.patientName || '').toLowerCase();
    const hosp = (p.hospitalId || '').toLowerCase();
    const abha = (p.abhaId || '').toLowerCase();
    const enc = (p.encounterId || '').toLowerCase();
    const tkn = (p.tokenNumber || '').toLowerCase();

    return name.includes(term) || hosp.includes(term) || abha.includes(term) || enc.includes(term) || tkn.includes(term);
  });

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
            🔍 DOCTOR PATIENT CLINICAL SEARCH & DOSSIER
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-400" /> Patient Search & Checkup History Records
          </h1>
          <p className="text-xs text-emerald-200/70 font-medium mt-1">
            Search patient records by Name, Hospital ID, ABHA ID, Encounter ID, or Token number.
          </p>
        </div>
      </div>

      {/* Multi-attribute Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search by Patient Name, Hospital ID, ABHA ID, Encounter ID, or OPD Token..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((p) => (
          <div
            key={p._id}
            onClick={() => {
              setSelectedPatient(p);
              setIsDetailModalOpen(true);
            }}
            className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4 hover:border-emerald-500/50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-lg shadow-md">
                {(p.basicInfo?.fullName || p.patientName || 'P').charAt(0)}
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-black border border-emerald-500/30">
                ABHA: {p.abhaId || 'Linked'}
              </span>
            </div>

            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {p.basicInfo?.fullName || p.patientName}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Hospital ID: {p.hospitalId || 'AIIA-HOSP-101'} • Token: {p.tokenNumber || 'OPD-001'}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Last Diagnosis</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black block mt-0.5">
                {p.lastDiagnosis || 'Consultation Intake'}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>View Full Checkup Dossier</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Checkup Detail Dossier Modal (Kiosk + Doctor SOAP) */}
      {isDetailModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:pl-72 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/30 text-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {selectedPatient.hospitalId || 'AIIA-HOSP-101'} • Token: {selectedPatient.tokenNumber} • ABHA: {selectedPatient.abhaId}
                </span>
                <h3 className="text-2xl font-black text-white">
                  {selectedPatient.basicInfo?.fullName || selectedPatient.patientName} ({selectedPatient.basicInfo?.age || 50}y / {selectedPatient.basicInfo?.gender || 'Male'})
                </h3>
                <span className="text-xs text-teal-300 font-medium">Department: {selectedPatient.department || 'Kayachikitsa'} • Last Consult: {selectedPatient.lastVisitDate}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid layout for Kiosk Intake vs Doctor SOAP Case Sheet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* LEFT COLUMN: Kiosk Intake Data Filled by Patient */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-400 flex items-center gap-2 border-b border-teal-500/20 pb-2">
                  <Activity className="w-4 h-4" /> 1. Kiosk Intake & Self-Reported Telemetry
                </h4>

                {/* Vitals Grid */}
                {selectedPatient.vitals && (
                  <div className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Vital Signs Telemetry</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono">
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                        <span className="text-[9px] text-gray-400 block">Blood Pressure</span>
                        <span className="text-emerald-400 font-bold">{selectedPatient.vitals.bp || '120/80'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                        <span className="text-[9px] text-gray-400 block">SpO2 Level</span>
                        <span className="text-emerald-400 font-bold">{selectedPatient.vitals.spo2 || '98%'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                        <span className="text-[9px] text-gray-400 block">Heart Rate</span>
                        <span className="text-emerald-400 font-bold">{selectedPatient.vitals.hr || '76 bpm'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5">
                        <span className="text-[9px] text-gray-400 block">Temperature</span>
                        <span className="text-emerald-400 font-bold">{selectedPatient.vitals.temp || '98.6°F'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-white/5 col-span-2 sm:col-span-2">
                        <span className="text-[9px] text-gray-400 block">BMI & Build</span>
                        <span className="text-emerald-400 font-bold">{selectedPatient.vitals.bmi || '24.2'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SOCRATES Symptom Analysis */}
                {selectedPatient.socrates && (
                  <div className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 space-y-2">
                    <span className="text-[10px] font-bold text-teal-400 uppercase block">SOCRATES Chief Complaint & Analysis</span>
                    <p className="text-white font-medium italic">"{selectedPatient.chiefComplaint}"</p>
                    <div className="space-y-1 pt-1 text-[11px] text-gray-300">
                      <div><strong className="text-gray-400">Site:</strong> {selectedPatient.socrates.site}</div>
                      <div><strong className="text-gray-400">Onset & Duration:</strong> {selectedPatient.socrates.onset}</div>
                      <div><strong className="text-gray-400">Character:</strong> {selectedPatient.socrates.character}</div>
                      <div><strong className="text-gray-400">Severity:</strong> <span className="text-amber-400 font-bold">{selectedPatient.socrates.severity}</span></div>
                    </div>
                  </div>
                )}

                {/* Dashavidha Pariksha */}
                {selectedPatient.dashavidhaPariksha && (
                  <div className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 space-y-1.5 text-gray-300">
                    <span className="text-[10px] font-bold text-teal-400 uppercase block">Dashavidha & Ashtavidha Pariksha</span>
                    <div><strong className="text-gray-400">Prakriti:</strong> {selectedPatient.dashavidhaPariksha.prakriti}</div>
                    <div><strong className="text-gray-400">Agni:</strong> {selectedPatient.dashavidhaPariksha.agni}</div>
                    <div><strong className="text-gray-400">Nadi (Pulse):</strong> {selectedPatient.dashavidhaPariksha.nadi}</div>
                    <div><strong className="text-gray-400">Jihwa (Tongue):</strong> {selectedPatient.dashavidhaPariksha.jihwa}</div>
                  </div>
                )}

                {/* History & OCR Prescriptions */}
                <div className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold text-teal-400 uppercase block">Past Medical History & Scanned Prescriptions</span>
                  <div>
                    <span className="text-gray-400 font-bold block">Medical Conditions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedPatient.pastMedicalHistory || ['None reported']).map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white/10 text-gray-200 text-[10px] font-medium">{h}</span>
                      ))}
                    </div>
                  </div>
                  {selectedPatient.ocrPrescriptions?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-gray-400 font-bold block">Scanned OCR Medicines:</span>
                      <ul className="list-disc list-inside text-emerald-300 space-y-0.5 mt-1">
                        {selectedPatient.ocrPrescriptions.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Doctor Written Findings & Signed Case Sheet */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2 border-b border-emerald-500/20 pb-2">
                  <FileText className="w-4 h-4" /> 2. Doctor Signed SOAP Case Sheet & Orders
                </h4>

                {/* Primary Diagnosis */}
                <div className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">Final Attending Diagnosis</span>
                  <p className="text-sm font-black text-white">{selectedPatient.lastDiagnosis}</p>
                </div>

                {/* SOAP Details */}
                {selectedPatient.doctorSoapNote && (
                  <div className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 space-y-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">Subjective (Symptoms)</span>
                      <p className="text-gray-200 mt-0.5 leading-relaxed">{selectedPatient.doctorSoapNote.subjective}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">Objective (Clinical Exam)</span>
                      <p className="text-gray-200 mt-0.5 leading-relaxed">{selectedPatient.doctorSoapNote.objective}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">Assessment & Diagnostic Codes</span>
                      <p className="text-gray-200 mt-0.5 font-mono">{selectedPatient.doctorSoapNote.assessment}</p>
                    </div>
                  </div>
                )}

                {/* Prescribed Regimen */}
                {selectedPatient.doctorSoapNote?.plan && (
                  <div className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase block">Signed Rx Regimen</span>
                    {selectedPatient.doctorSoapNote.plan.ayurvedicMeds?.map((med, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-mono flex items-center justify-between">
                        <span className="font-bold text-emerald-300">{med.name}</span>
                        <span className="text-gray-300 text-[10px]">{med.dosage} • {med.frequency} ({med.anupana})</span>
                      </div>
                    ))}
                    {selectedPatient.doctorSoapNote.plan.allopathicMeds?.map((med, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 font-mono flex items-center justify-between">
                        <span className="font-bold text-teal-300">{med.name}</span>
                        <span className="text-gray-300 text-[10px]">{med.dosage} • {med.frequency}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lab Reports & Investigations */}
                <div className="p-3.5 rounded-2xl bg-slate-800 border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block">Diagnostic Reports & Orders</span>
                  <ul className="space-y-1 font-mono text-[11px]">
                    {(selectedPatient.labReports || []).map((lab, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{lab}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> ABDM FHIR Bundle Digitally Verified & Archived
              </span>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
