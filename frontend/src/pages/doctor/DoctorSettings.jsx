import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Smartphone, FileText, LogOut, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DoctorSettings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const mockSessions = [
    { device: 'AIIA OPD Terminal (Room 104)', ip: '10.20.14.88', status: 'Active Now', time: 'Logged in today 08:30 AM' },
    { device: 'Doctor iPad Pro (Hospital Wi-Fi)', ip: '10.20.18.22', status: 'Idle', time: 'Last active yesterday' }
  ];

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-500" /> Physician Privacy & Security Control
        </h1>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          Manage authentication security, active device sessions, access logs, and DPDP consent compliance.
        </p>
      </div>

      {/* Security & Sessions */}
      <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-500" /> Security & Active Terminal Sessions
        </h3>

        <div className="space-y-3">
          {mockSessions.map((s, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-black text-slate-900 dark:text-white block">{s.device}</span>
                <span className="text-[10px] text-gray-500">IP: {s.ip} • {s.time}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold text-[10px] uppercase">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Purpose-Based Access Control & Audit Log Info */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white border border-emerald-500/30 shadow-xl space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" /> Purpose-Based Access Control (§49) & Audit Compliance
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed font-medium">
          All clinical actions, QR scans, and case sheet signatures generate tamper-evident Audit Log records in compliance with DPDP Right to Erasure (§51) and ABDM HIS integration specifications.
        </p>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-gray-200 dark:border-white/10">
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out of AIIA Doctor Cockpit
        </button>
      </div>
    </div>
  );
}
