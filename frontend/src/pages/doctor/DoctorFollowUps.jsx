import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, CheckCircle2, FlaskConical } from 'lucide-react';
import { API_URL } from '../../config/api';

export default function DoctorFollowUps() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/continuity/followups/doctor/DOC-AIIA-001`)
      .then(res => {
        if (res.data?.data) {
          setFollowups(res.data.data);
        }
      })
      .catch(err => console.warn('Follow-ups fetch note:', err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6 text-emerald-500" /> Scheduled Follow-Up Tasks & Continuity
        </h1>
        <p className="text-xs text-slate-500 dark:text-gray-400">Post-lab test follow-up slot allocations (§37)</p>
      </div>

      <div className="space-y-3">
        {(followups.length > 0 ? followups : [
          { followupId: 'FOL-101', patientName: 'Ayush Patient', followupDate: '15 Sep 2026', window: '10:30-11:00 AM', status: 'waiting_for_results', linkedTestsCount: 2 },
          { followupId: 'FOL-102', patientName: 'Sunita Patel', followupDate: '18 Sep 2026', window: '11:00-11:30 AM', status: 'scheduled', linkedTestsCount: 1 }
        ]).map(f => (
          <div key={f.followupId} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-black text-sm text-slate-900 dark:text-white">{f.patientName}</span>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                Date: {f.followupDate} • Time Window: {f.window} • Linked Tests: {f.linkedTestsCount}
              </p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              f.status === 'waiting_for_results'
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
            }`}>
              {f.status?.replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
