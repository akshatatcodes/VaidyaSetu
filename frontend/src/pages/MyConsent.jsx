import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, RefreshCw, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const PURPOSE_META = {
  clinical_history: { label: 'Clinical Data Capture', desc: 'Symptoms, vitals & Ayush Pariksha recorded during OPD visits' },
  document_scanning: { label: 'Document Storage & OCR', desc: 'Paper prescriptions and diagnostic lab report scans' },
  doctor_sharing: { label: 'Consulting Physician Access', desc: 'Sharing intake summaries with assigned hospital OPD doctors' },
  lab_sharing: { label: 'Laboratory Diagnostics Access', desc: 'Sharing test orders and sample statuses with institute lab' },
  abdm_exchange: { label: 'ABDM Health Locker Exchange', desc: 'Linking consultation records with ABHA digital health locker' },
  secondary_use: { label: 'Ayush Public Health Analytics', desc: 'Anonymized clinical research data aggregation' }
};

export default function MyConsent() {
  const { currentUser } = useAuth();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const patientId = currentUser?.id || localStorage.getItem('vaidya_patient_id') || '60d0fe4f5311236168a109ca';

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/consent/my/${patientId}`);
      if (res.data?.status === 'success') {
        setConsents(res.data.data || []);
      }
    } catch (err) {
      console.warn('[MyConsent] Error fetching consents:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, [patientId]);

  const handleRevoke = async (consentId, purpose) => {
    try {
      const res = await axios.post(`${API_URL}/consent/revoke`, { consentId, patientId, purpose });
      if (res.data?.status === 'success') {
        setActionMessage(`Successfully revoked consent for [${PURPOSE_META[purpose]?.label || purpose}]`);
        fetchConsents();
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      alert(`Revocation failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleGrant = async (purpose) => {
    try {
      const res = await axios.post(`${API_URL}/consent/grant`, {
        patientId,
        purpose,
        dataScope: 'opd_encounter_data',
        recipient: 'assigned_clinical_team',
        method: 'patient_dashboard_ui',
        language: 'en'
      });
      if (res.data?.status === 'success') {
        setActionMessage(`Successfully granted consent for [${PURPOSE_META[purpose]?.label || purpose}]`);
        fetchConsents();
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      alert(`Grant failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">My Consents & Privacy Dashboard</h1>
            <p className="text-slate-400 text-xs mt-1">Manage, audit and revoke active data sharing scopes (§48)</p>
          </div>
        </div>

        <button
          onClick={fetchConsents}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Consents
        </button>
      </div>

      {/* Action Banner */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-semibold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Consents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PURPOSE_META).map(([purposeKey, meta]) => {
          const consentRecord = consents.find(c => c.purpose === purposeKey);
          const isActive = consentRecord?.status === 'active';

          return (
            <div
              key={purposeKey}
              className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'bg-slate-900/90 border-teal-500/30 shadow-xl shadow-teal-500/5'
                  : 'bg-slate-950/60 border-slate-800 opacity-75'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-base text-white">{meta.label}</span>
                  {isActive ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" /> REVOKED
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">{meta.desc}</p>

                {consentRecord && (
                  <div className="pt-3 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-500">
                    <div><span className="font-semibold text-slate-400">Consent ID:</span> {consentRecord.consentId || consentRecord._id}</div>
                    <div><span className="font-semibold text-slate-400">Granted On:</span> {new Date(consentRecord.grantedAt || consentRecord.createdAt).toLocaleString()}</div>
                    <div><span className="font-semibold text-slate-400">Recipient:</span> {consentRecord.recipient || 'assigned_clinical_team'}</div>
                    {consentRecord.revokedAt && (
                      <div className="text-rose-400"><span className="font-semibold">Revoked On:</span> {new Date(consentRecord.revokedAt).toLocaleString()}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2">
                {isActive ? (
                  <button
                    onClick={() => handleRevoke(consentRecord?.consentId, purposeKey)}
                    className="w-full py-2.5 rounded-xl font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" /> Revoke Consent
                  </button>
                ) : (
                  <button
                    onClick={() => handleGrant(purposeKey)}
                    className="w-full py-2.5 rounded-xl font-bold bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> Grant Consent
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
