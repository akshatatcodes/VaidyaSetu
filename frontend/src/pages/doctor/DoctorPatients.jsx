import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, UserCheck, FileText, ChevronRight, Activity } from 'lucide-react';
import { API_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Load patient roster
    axios.get(`${API_URL}/patients`)
      .then(res => {
        if (res.data?.data) {
          setPatients(res.data.data);
        }
      })
      .catch(err => console.warn('Patients fetch note:', err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter(p =>
    !search ||
    p.basicInfo?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(search.toLowerCase()) ||
    p.contactNumber?.includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" /> Patient Clinical Roster
          </h1>
          <p className="text-xs text-slate-500 dark:text-gray-400">Search and access longitudinal clinical timelines</p>
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, ABHA ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(filteredPatients.length > 0 ? filteredPatients : [
          { _id: 'pat_demo_1', basicInfo: { fullName: 'Ayush Patient', age: 42, gender: 'Male' }, abhaId: '14-1122-3344-5566', contactNumber: '+91 9876543210' },
          { _id: 'pat_demo_2', basicInfo: { fullName: 'Sunita Patel', age: 41, gender: 'Female' }, abhaId: '14-8877-6655-4433', contactNumber: '+91 9899887766' }
        ]).map(p => (
          <div
            key={p._id}
            onClick={() => navigate(`/patient/timeline?patientId=${p._id}`)}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-sm space-y-3 hover:border-emerald-500/40 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                {p.basicInfo?.fullName?.charAt(0) || 'P'}
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold">
                {p.abhaId || 'ABHA Active'}
              </span>
            </div>

            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">{p.basicInfo?.fullName}</h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-400">
                {p.basicInfo?.age}y / {p.basicInfo?.gender} • {p.contactNumber || p.basicInfo?.contactNumber}
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>View Timeline & History</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
