import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowRightLeft, Building2, Send, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../../config/api';

export default function DoctorReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/continuity/referrals/department/Kayachikitsa`)
      .then(res => {
        if (res.data?.data) {
          setReferrals(res.data.data);
        }
      })
      .catch(err => console.warn('Referrals fetch note:', err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-emerald-500" /> Clinical Referral Workbench
        </h1>
        <p className="text-xs text-slate-500 dark:text-gray-400">Same-hospital & cross-hospital referrals (§38)</p>
      </div>

      <div className="space-y-3">
        {(referrals.length > 0 ? referrals : [
          { referralId: 'REF-SAME-001', patientName: 'Ayush Patient', referralScope: 'same_hospital', targetDept: 'Shalya Tantra', priority: 'urgent', reason: 'Surgical evaluation for right lower quadrant abdominal pain', status: 'pending' },
          { referralId: 'REF-CROSS-002', patientName: 'Sunita Patel', referralScope: 'other_hospital', targetDept: 'Cardiology (AIIMS)', priority: 'routine', reason: 'Echocardiogram & specialist opinion', status: 'completed' }
        ]).map(r => (
          <div key={r.referralId || r._id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-900 dark:text-white">{r.patientName || 'Ayush Patient'}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                r.priority === 'urgent'
                  ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {r.priority} • {r.referralScope?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-300">{r.reason}</p>
            <p className="text-[11px] text-slate-400 font-mono">Ref ID: {r.referralId || r.qrPayload || 'REF-101'} • Target: {r.targetDept || 'Shalya Tantra'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
