import React, { useState } from 'react';
import { Share2, ArrowUpRight, CheckCircle2, Clock, Filter, Plus, Search, Check } from 'lucide-react';

export default function DoctorReferrals() {
  const [activeTab, setActiveTab] = useState('created'); // created | incoming | pending | completed
  const [search, setSearch] = useState('');

  const mockReferrals = [
    {
      id: 'REF-101',
      patientName: 'Rajesh Sharma',
      fromDepartment: 'Orthopaedics',
      toDepartment: 'Cardiology',
      priority: 'Routine',
      reason: 'Pre-operative ECG & Cardiovascular Clearance for Knee Arthroscopy.',
      status: 'Pending',
      type: 'created'
    },
    {
      id: 'REF-102',
      patientName: 'Sunita Devi',
      fromDepartment: 'Kayachikitsa',
      toDepartment: 'Panchakarma',
      priority: 'Urgent',
      reason: 'Panchakarma Detox Consultation & Janu Basti Evaluation.',
      status: 'Completed',
      type: 'incoming'
    },
    {
      id: 'REF-103',
      patientName: 'Amit Verma',
      fromDepartment: 'Emergency',
      toDepartment: 'Kayachikitsa',
      priority: 'Stat',
      reason: 'Post-acute Tracheobronchitis Follow-Up.',
      status: 'Pending',
      type: 'incoming'
    }
  ];

  const filtered = mockReferrals.filter((r) => {
    const matchesSearch =
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.fromDepartment.toLowerCase().includes(search.toLowerCase()) ||
      r.toDepartment.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'created') return r.type === 'created';
    if (activeTab === 'incoming') return r.type === 'incoming';
    if (activeTab === 'pending') return r.status === 'Pending';
    if (activeTab === 'completed') return r.status === 'Completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
            🤝 INTER-DEPARTMENTAL CLINICAL REFERRAL ENGINE (§38)
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
            <Share2 className="w-7 h-7 text-emerald-400" /> Doctor Clinical Referrals
          </h1>
          <p className="text-xs text-emerald-200/70 font-medium mt-1">
            Doctor-to-Doctor and Hospital-to-Hospital referrals with QR payload tracking.
          </p>
        </div>
      </div>

      {/* 4 Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl text-xs font-bold">
        {[
          { id: 'created', label: 'Referrals Created' },
          { id: 'incoming', label: 'Incoming Referrals' },
          { id: 'pending', label: 'Pending Action' },
          { id: 'completed', label: 'Completed Referrals' }
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
          placeholder="Search patient, department, reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Referral Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ref) => (
          <div
            key={ref.id}
            className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30">
                  {ref.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    ref.status === 'Completed'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {ref.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{ref.patientName}</h3>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-500 mt-1">
                  <span>From: {ref.fromDepartment}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  <span>To: {ref.toDepartment}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Clinical Reason</span>
                <span className="text-slate-900 dark:text-white font-semibold block mt-0.5">{ref.reason}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-white/10">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block text-right">
                Priority: {ref.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
