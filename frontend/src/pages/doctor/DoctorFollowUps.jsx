import React, { useState } from 'react';
import { RotateCcw, Clock, CheckCircle2, FlaskConical, Search, Calendar, FileText, ChevronRight, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorFollowUps() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('due_today'); // due_today | awaiting_lab | result_ready | tomorrow | future
  const [search, setSearch] = useState('');

  const mockFollowUps = [
    {
      id: 'F-28',
      patientName: 'Rajesh Jain',
      age: 52,
      gender: 'Male',
      reason: 'Review CBC & Liver Enzymes',
      status: 'Report Ready',
      statusCode: 'result_ready',
      timeWindow: '11:30–12:00 Today',
      date: 'Today',
      dueDateCategory: 'due_today',
      reportAvailable: true
    },
    {
      id: 'F-29',
      patientName: 'Sunita Devi',
      age: 61,
      gender: 'Female',
      reason: 'Post-Panchakarma Joint Evaluation',
      status: 'Awaiting Lab Result',
      statusCode: 'awaiting_lab',
      timeWindow: '02:00–02:30 PM Today',
      date: 'Today',
      dueDateCategory: 'awaiting_lab',
      reportAvailable: false
    },
    {
      id: 'F-30',
      patientName: 'Amit Verma',
      age: 34,
      gender: 'Male',
      reason: 'Asthma Symptom & Chest X-Ray Review',
      status: 'Scheduled Tomorrow',
      statusCode: 'tomorrow',
      timeWindow: '10:00–10:30 AM Tomorrow',
      date: 'Tomorrow',
      dueDateCategory: 'tomorrow',
      reportAvailable: true
    }
  ];

  const filtered = mockFollowUps.filter((f) => {
    const matchesSearch =
      f.patientName.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase()) ||
      f.reason.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'due_today') return f.dueDateCategory === 'due_today' || f.statusCode === 'result_ready';
    if (activeTab === 'awaiting_lab') return f.statusCode === 'awaiting_lab';
    if (activeTab === 'result_ready') return f.statusCode === 'result_ready' || f.reportAvailable;
    if (activeTab === 'tomorrow') return f.statusCode === 'tomorrow';
    if (activeTab === 'future') return f.statusCode === 'future';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
            🔄 CONTINUITY OF CARE & FOLLOW-UP ENGINE (§35–§37)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-emerald-400" /> Follow-up Consultation Roster
          </h1>
          <p className="text-xs text-emerald-200/70 font-medium mt-1">
            Complete report reviews and next-day follow-ups directly without restarting OPD registration.
          </p>
        </div>
      </div>

      {/* 5 Sub-Tabs: Due Today, Awaiting Lab, Result Ready, Tomorrow, Future */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl text-xs font-bold">
        {[
          { id: 'due_today', label: 'Follow-up Due Today' },
          { id: 'awaiting_lab', label: 'Awaiting Lab Result' },
          { id: 'result_ready', label: 'Result Ready for Review' },
          { id: 'tomorrow', label: 'Tomorrow' },
          { id: 'future', label: 'Future Schedulable' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl transition-all cursor-pointer font-black ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Search patient name, follow-up ID, reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Follow-up Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                  {item.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    item.statusCode === 'result_ready'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{item.patientName}</h3>
                <p className="text-xs text-gray-500 font-medium">{item.age}y • {item.gender} • Slot: {item.timeWindow}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Follow-up Reason</span>
                <span className="text-slate-900 dark:text-white font-bold block mt-0.5">{item.reason}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => navigate('/doctor')}
                className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" /> Open Result & Complete Follow-Up
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
