import React, { useState } from 'react';
import { History, Search, FileText, Pill, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorHistory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const mockEncounters = [
    {
      id: 'ENC-2026-0909-01',
      date: '09 Sep 2026',
      patientName: 'Rajesh Sharma',
      age: 52,
      department: 'Kayachikitsa',
      diagnosis: 'Amlapitta (GERD) • ICD-11: DA42',
      prescription: 'Avipattikar Churna 3g BD, Pantoprazole 40mg OD',
      notes: 'Dietary counseling provided. Recommended pathya ahara.'
    },
    {
      id: 'ENC-2026-0908-04',
      date: '08 Sep 2026',
      patientName: 'Sunita Devi',
      age: 61,
      department: 'Panchakarma',
      diagnosis: 'Sandhivata (Osteoarthritis) • ICD-11: FA00',
      prescription: 'Yogaraj Guggulu 2 tab BD, Ashwagandha Churna 3g HS',
      notes: 'Advised Janu Basti therapy at Panchakarma unit.'
    },
    {
      id: 'ENC-2026-0615-02',
      date: '15 Jun 2026',
      patientName: 'Amit Verma',
      age: 34,
      department: 'General Medicine',
      diagnosis: 'Acute Tracheobronchitis • ICD-11: CA42',
      prescription: 'Steam inhalation, Paracetamol 500mg SOS',
      notes: 'SpO2 97%. Strictly avoided NSAIDs due to aspirin-induced asthma risk.'
    }
  ];

  const filtered = mockEncounters.filter(
    (e) =>
      e.patientName.toLowerCase().includes(search.toLowerCase()) ||
      e.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-500" /> Doctor Encounters History
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Log of doctor's prior clinical consultations and prescribed care plans
          </p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, diagnosis, encounter ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((enc) => (
          <div
            key={enc.id}
            className="p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-3 hover:border-emerald-500/40 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-black">
                  {enc.date}
                </span>
                <span className="font-mono text-xs text-gray-500 font-bold">{enc.id}</span>
              </div>
              <span className="px-3 py-1 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 text-xs font-black">
                {enc.department} OPD
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Patient</span>
                <span className="text-slate-900 dark:text-white font-black text-sm block mt-0.5">
                  {enc.patientName} ({enc.age}y)
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Clinical Diagnosis</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  {enc.diagnosis}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Prescription Coded</span>
                <span className="text-slate-800 dark:text-gray-200 font-semibold block mt-0.5 truncate">
                  {enc.prescription}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-slate-700 dark:text-gray-300">
              <span className="font-bold text-slate-900 dark:text-white">Doctor Consultation Notes: </span>
              {enc.notes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
