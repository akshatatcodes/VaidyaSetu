import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle,
  Hospital, Stethoscope, QrCode, ArrowRight, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const ReferralView = () => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);

  const activePatientId = currentUser?.patientId || currentUser?.id;

  const loadReferrals = async () => {
    if (!activePatientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/continuity/referrals/my/${activePatientId}`);
      if (res.data.status === 'success') {
        setReferrals(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [activePatientId]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RefreshCw className="w-10 h-10 text-teal-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-bold mb-2">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Hospital className="text-teal-500" /> Doctor Referral Pass Status (§38)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Doctor-initiated same-hospital and cross-hospital referrals with QR verification passes.
          </p>
        </div>
      </div>

      {referrals.length > 0 ? (
        <div className="space-y-4">
          {referrals.map((ref) => (
            <div key={ref._id} className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Scope: {ref.referralScope}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                    ref.priority === 'stat' || ref.priority === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    Priority: {ref.priority}
                  </span>
                </div>

                <span className="text-xs font-mono text-slate-400">
                  Status: <span className="text-teal-300 font-bold uppercase">{ref.status}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Clinical Reason</p>
                  <p className="text-sm font-bold text-white">{ref.reason}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Target Department ID</p>
                  <p className="text-sm font-mono text-teal-300">{ref.toDepartmentId}</p>
                </div>
              </div>

              {/* QR Payload Code */}
              {ref.qrPayload && (
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode size={24} className="text-teal-400" />
                    <div>
                      <p className="text-xs font-bold text-white">Digital Referral Verification Token</p>
                      <p className="text-xs font-mono text-slate-400">{ref.qrPayload}</p>
                    </div>
                  </div>
                  <ShieldCheck size={20} className="text-teal-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl text-center space-y-3">
          <Hospital className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Doctor Referrals Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not currently have any active doctor-initiated referral passes on record.
          </p>
        </div>
      )}

    </div>
  );
};

export default ReferralView;
