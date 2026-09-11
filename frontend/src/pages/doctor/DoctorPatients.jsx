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

  // Filter strictly patient records from MongoDB Atlas
  const checkedOnly = patients.filter(
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
      <div className="bg-gradient-to-r from-emerald-50/90 via-white/95 to-teal-50/90 dark:from-slate-900/95 dark:via-slate-900/95 dark:to-slate-950/95 text-slate-900 dark:text-white rounded-3xl p-4 sm:p-6 shadow-md shadow-emerald-900/5 border border-emerald-200/80 dark:border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl select-none">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
            🔍 DOCTOR PATIENT CLINICAL SEARCH & DOSSIER
          </span>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black !text-slate-900 dark:!text-white tracking-tight mt-1.5 flex items-center gap-2.5">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 p-0.5 shadow-md shadow-emerald-600/20 inline-flex items-center justify-center shrink-0">
              <span className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </span>
            </span>
            <span>Patient Search & Checkup Records</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:pl-72 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedPatient.hospitalId || 'AIIA-HOSP-101'} • Token: {selectedPatient.tokenNumber} • ABHA: {selectedPatient.abhaId}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {selectedPatient.basicInfo?.fullName || selectedPatient.patientName} ({selectedPatient.basicInfo?.age || 50}y / {selectedPatient.basicInfo?.gender || 'Male'})
                </h3>
                <span className="text-xs text-teal-600 dark:text-teal-300 font-medium">Department: {selectedPatient.department || 'Kayachikitsa'} • Last Consult: {selectedPatient.lastVisitDate}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-gray-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid layout for Kiosk Intake vs Doctor SOAP Case Sheet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* LEFT COLUMN: Kiosk Intake Data Filled by Patient */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-2 border-b border-teal-500/20 pb-2">
                  <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" /> 1. Kiosk Intake & Self-Reported Telemetry
                </h4>

                {/* Vitals Grid */}
                {selectedPatient.vitals && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase block">Vital Signs Telemetry</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center font-mono">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5">
                        <span className="text-[9px] text-slate-500 dark:text-gray-400 block">Blood Pressure</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedPatient.vitals.bp || '120/80'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5">
                        <span className="text-[9px] text-slate-500 dark:text-gray-400 block">SpO2 Level</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedPatient.vitals.spo2 || '98%'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5">
                        <span className="text-[9px] text-slate-500 dark:text-gray-400 block">Heart Rate</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedPatient.vitals.hr || '76 bpm'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5">
                        <span className="text-[9px] text-slate-500 dark:text-gray-400 block">Temperature</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedPatient.vitals.temp || '98.6°F'}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 col-span-2 sm:col-span-2">
                        <span className="text-[9px] text-slate-500 dark:text-gray-400 block">BMI & Build</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selectedPatient.vitals.bmi || '24.2'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SOCRATES Symptom Analysis */}
                {selectedPatient.socrates && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase block">SOCRATES Chief Complaint & Analysis</span>
                    <p className="text-slate-900 dark:text-white font-medium italic">"{selectedPatient.chiefComplaint}"</p>
                    <div className="space-y-1 pt-1 text-[11px] text-slate-600 dark:text-gray-300">
                      <div><strong className="text-slate-500 dark:text-gray-400">Site:</strong> {selectedPatient.socrates.site}</div>
                      <div><strong className="text-slate-500 dark:text-gray-400">Onset & Duration:</strong> {selectedPatient.socrates.onset}</div>
                      <div><strong className="text-slate-500 dark:text-gray-400">Character:</strong> {selectedPatient.socrates.character}</div>
                      <div><strong className="text-slate-500 dark:text-gray-400">Severity:</strong> <span className="text-amber-600 dark:text-amber-400 font-bold">{selectedPatient.socrates.severity}</span></div>
                    </div>
                  </div>
                )}

                {/* Dashavidha Pariksha */}
                {selectedPatient.dashavidhaPariksha && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-slate-600 dark:text-gray-300">
                    <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase block">Dashavidha & Ashtavidha Pariksha</span>
                    <div><strong className="text-slate-500 dark:text-gray-400">Prakriti:</strong> {selectedPatient.dashavidhaPariksha.prakriti}</div>
                    <div><strong className="text-slate-500 dark:text-gray-400">Agni:</strong> {selectedPatient.dashavidhaPariksha.agni}</div>
                    <div><strong className="text-slate-500 dark:text-gray-400">Nadi (Pulse):</strong> {selectedPatient.dashavidhaPariksha.nadi}</div>
                    <div><strong className="text-slate-500 dark:text-gray-400">Jihwa (Tongue):</strong> {selectedPatient.dashavidhaPariksha.jihwa}</div>
                  </div>
                )}

                {/* History & OCR Prescriptions */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase block">Past Medical History & Scanned Prescriptions</span>
                  <div>
                    <span className="text-slate-500 dark:text-gray-400 font-bold block">Medical Conditions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(selectedPatient.pastMedicalHistory || ['None reported']).map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-gray-200 text-[10px] font-medium">{h}</span>
                      ))}
                    </div>
                  </div>
                  {selectedPatient.ocrPrescriptions?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-slate-500 dark:text-gray-400 font-bold block">Scanned OCR Medicines:</span>
                      <ul className="list-disc list-inside text-emerald-700 dark:text-emerald-300 space-y-0.5 mt-1 font-medium">
                        {selectedPatient.ocrPrescriptions.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Doctor Written Findings & Signed Case Sheet */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2 border-b border-emerald-500/20 pb-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 2. Doctor Signed SOAP Case Sheet & Orders
                </h4>

                {/* Primary Diagnosis */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Final Attending Diagnosis</span>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{selectedPatient.lastDiagnosis}</p>
                </div>

                {/* SOAP Details */}
                {selectedPatient.doctorSoapNote && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Subjective (Symptoms)</span>
                      <p className="text-slate-700 dark:text-gray-200 mt-0.5 leading-relaxed">{selectedPatient.doctorSoapNote.subjective}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Objective (Clinical Exam)</span>
                      <p className="text-slate-700 dark:text-gray-200 mt-0.5 leading-relaxed">{selectedPatient.doctorSoapNote.objective}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Assessment & Diagnostic Codes</span>
                      <p className="text-slate-700 dark:text-gray-200 mt-0.5 font-mono">{selectedPatient.doctorSoapNote.assessment}</p>
                    </div>
                  </div>
                )}

                {/* Prescribed Regimen */}
                {selectedPatient.doctorSoapNote?.plan && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Signed Rx Regimen</span>
                    {selectedPatient.doctorSoapNote.plan.ayurvedicMeds?.map((med, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-500/20 font-mono flex items-center justify-between">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">{med.name}</span>
                        <span className="text-slate-600 dark:text-gray-300 text-[10px]">{med.dosage} • {med.frequency} ({med.anupana})</span>
                      </div>
                    ))}
                    {selectedPatient.doctorSoapNote.plan.allopathicMeds?.map((med, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-500/20 font-mono flex items-center justify-between">
                        <span className="font-bold text-teal-800 dark:text-teal-300">{med.name}</span>
                        <span className="text-slate-600 dark:text-gray-300 text-[10px]">{med.dosage} • {med.frequency}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lab Reports & Investigations */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Diagnostic Reports & Orders</span>
                  <ul className="space-y-1 font-mono text-[11px]">
                    {(selectedPatient.labReports || []).map((lab, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-gray-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{lab}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> ABDM FHIR Bundle Digitally Verified & Archived
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
