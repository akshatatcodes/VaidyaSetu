import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { History, X, Loader2 } from 'lucide-react';
import { API_URL } from '../../config/api';

export default function VersionHistoryModal({ order, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      try {
        const orderId = order.orderId || order._id;
        const res = await axios.get(`${API_URL}/lab/results/version-history/${orderId}`);
        if (res.data?.status === 'success') {
          setVersions(res.data.data || []);
        }
      } catch (e) {
        console.warn('Version history note:', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVersions();
  }, [order]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-teal-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Lab Result Audit Trail (§30 Non-Overwrite Log)
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1 text-xs">
          <p className="font-bold text-slate-900 dark:text-white">{order.testName}</p>
          <p className="text-gray-500">Patient: {order.patientName} (Token: {order.tokenNumber})</p>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" /> Fetching versioned audit trail...
            </div>
          ) : versions.length === 0 ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 text-center text-xs text-gray-400">
              Initial result record (Version 1). No subsequent amendments logged.
            </div>
          ) : (
            versions.map((ver) => (
              <div key={ver._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/20 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-black">
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] uppercase font-mono">
                    Version {ver.version} {ver.version === 1 ? '(Original)' : '(Amended)'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(ver.createdAt || ver.sampleDate).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 font-mono font-bold text-slate-900 dark:text-white pt-1">
                  <span className="text-sm text-teal-600 dark:text-teal-400">{ver.resultValue} {ver.unit}</span>
                  <span className="text-[10px] text-gray-400">Ref: {ver.referenceRange || 'N/A'}</span>
                </div>
                <p className="text-[10px] text-gray-500">
                  Entered by: {ver.clerkId || ver.technicianId || 'Lab Technician'} • Non-overwrite lock active
                </p>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-800 dark:text-white text-xs font-bold cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
}
