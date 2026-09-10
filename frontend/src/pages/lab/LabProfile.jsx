import React from 'react';
import { UserCheck, Shield, TestTube2, Mail, Building, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LabProfile() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-cyan-950 text-white rounded-3xl p-6 sm:p-8 border border-cyan-500/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{currentUser?.name || 'Lab Technician Console'}</h1>
            <p className="text-xs text-cyan-300">Role: Laboratory Officer / Technician • AIIA Diagnostic Center</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>Security & Access Clearance</span>
          </div>
          <div className="space-y-2 text-xs text-slate-700 dark:text-gray-300">
            <p><b>Role Scope:</b> Diagnostic State Machine Operator & Verifier</p>
            <p><b>Clearance Level:</b> Level 2 (Sample Collection, Result Entry, Verification Audit)</p>
            <p><b>Audit Trail Compliance:</b> Active (§30 Non-Overwrite Lock)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-sm">
            <Building className="w-4 h-4" />
            <span>Department & Facility</span>
          </div>
          <div className="space-y-2 text-xs text-slate-700 dark:text-gray-300">
            <p><b>Facility:</b> AIIA Central Diagnostic Laboratory</p>
            <p><b>Equipment Sync:</b> LIMS Bridge Active</p>
            <p><b>Operational Hours:</b> 08:00 - 20:00 IST</p>
          </div>
        </div>
      </div>
    </div>
  );
}
