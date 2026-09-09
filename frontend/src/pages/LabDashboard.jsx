import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  FlaskConical, TestTube2, AlertTriangle, CheckCircle2, Clock,
  RefreshCw, Shield, Loader2, X, Save, Zap, Search, ChevronRight
} from 'lucide-react';
import { API_URL } from '../config/api';
import { authHeaders } from '../utils/authHeaders';

const HEADERS = authHeaders('lab');

// ── Urgency badge ────────────────────────────────────────────────────────────
function UrgencyBadge({ urgency }) {
  const map = {
    stat:    'bg-red-500/15 text-red-500',
    urgent:  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    routine: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-gray-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${map[urgency] || map.routine}`}>
      {urgency}
    </span>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ordered:   'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    collected: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    resulted:  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    verified:  'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    cancelled: 'bg-slate-500/15 text-slate-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${map[status] || map.ordered}`}>
      {status}
    </span>
  );
}

// ── Result entry modal (order → resulted) ────────────────────────────────────
function ResultModal({ order, onClose, onSave }) {
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [refRange, setRefRange] = useState('');
  const [critical, setCritical] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ value, unit, referenceRange: refRange, critical });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">Enter Result</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Test</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{order.testName}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Patient</p>
            <p className="text-xs text-slate-600 dark:text-gray-300">
              {order.patientName} · {order.tokenNumber} · {order.age}y
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Result Value *</label>
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="e.g. 12.4"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="mg/dL"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Reference Range</label>
              <input
                type="text"
                value={refRange}
                onChange={e => setRefRange(e.target.value)}
                placeholder="70-100"
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-red-500/20 bg-red-500/5 cursor-pointer">
            <input type="checkbox" checked={critical} onChange={e => setCritical(e.target.checked)} className="w-4 h-4 accent-red-500" />
            <span className="text-xs font-bold text-red-600 dark:text-red-400">Flag as CRITICAL — urgent clinician attention</span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !value}
          className="mt-5 w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-cyan-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Result
        </button>
      </div>
    </div>
  );
}

export default function LabDashboard() {
  const [pending, setPending]     = useState([]);
  const [criticals, setCriticals] = useState([]);
  const [tab, setTab]             = useState('pending');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [busy, setBusy]           = useState(null);     // orderId being transitioned
  const [resultModal, setResultModal] = useState(null); // order being resulted
  const [search, setSearch]       = useState('');

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const [pRes, cRes] = await Promise.allSettled([
        axios.get(`${API_URL}/lab/pending`, { headers: HEADERS }),
        axios.get(`${API_URL}/lab/critical`, { headers: HEADERS })
      ]);
      if (pRes.status === 'fulfilled') setPending(pRes.value.data.data || []);
      if (cRes.status === 'fulfilled') setCriticals(cRes.value.data.data || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('[Lab] Fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Transition helper
  const transition = async (order, body, label) => {
    setBusy(order.orderId);
    try {
      await axios.patch(
        `${API_URL}/lab/orders/${order.sessionId}/${order.orderId}/status`,
        body,
        { headers: HEADERS }
      );
      await fetchAll(true);
      if (label === 'verified') setTab('critical');
    } catch (e) {
      console.error(`[Lab] ${label} error:`, e.message);
    } finally {
      setBusy(null);
    }
  };

  const markCollected = (order) =>
    transition(order, { status: 'collected', labTechnicianId: HEADERS['X-User-Role'] || 'lab' }, 'collected');

  // Save result from modal (resulted → optionally verify)
  const saveResult = async (payload) => {
    const order = resultModal;
    try {
      await axios.patch(
        `${API_URL}/lab/orders/${order.sessionId}/${order.orderId}/status`,
        {
          status: 'resulted',
          resultValue: payload.value,
          resultUnit: payload.unit,
          referenceRange: payload.referenceRange,
          critical: payload.critical,
          labTechnicianId: 'lab'
        },
        { headers: HEADERS }
      );
      setResultModal(null);
      await fetchAll(true);
    } catch (e) {
      console.error('[Lab] Save result error:', e.message);
    }
  };

  const verifyResult = (order) =>
    transition(order, { status: 'verified', labTechnicianId: 'lab' }, 'verified');

  const filteredPending = pending.filter(o =>
    !search ||
    (o.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.testName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.tokenNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Loading Lab Workbench...</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: 'pending',  label: 'Pending Orders', icon: FlaskConical },
    { key: 'critical', label: 'Critical Results', icon: AlertTriangle }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6 animate-in fade-in duration-300">
      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-slate-950 via-cyan-950 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-black uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> AIIA Lab Workbench
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Diagnostic Result Entry</h1>
            <p className="text-xs text-cyan-200/70">
              Order → collected → resulted → verified. Critical values surface to clinicians the moment they're signed off.
              {lastRefresh && <span className="ml-2 opacity-60">Last synced: {lastRefresh.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs font-black transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── SUMMARY ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-500/20 bg-white/95 dark:bg-slate-900/90 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">Awaiting Sample</p>
          <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{pending.filter(o => o.status === 'ordered').length}</p>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-white/95 dark:bg-slate-900/90 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">Collected</p>
          <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{pending.filter(o => o.status === 'collected').length}</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-white/95 dark:bg-slate-900/90 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">Critical Pending</p>
          <p className="text-3xl font-black text-red-500">{criticals.filter(c => c.status !== 'verified').length}</p>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-900/80 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              tab === t.key
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient / test / token"
            className="py-1.5 text-xs bg-transparent border-b border-gray-200 dark:border-white/10 focus:border-cyan-500 outline-none text-slate-700 dark:text-gray-200"
          />
        </div>
      </div>

      {/* ══ PENDING TAB ════════════════════════════════════════════════════ */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {filteredPending.length === 0 && (
            <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
              <TestTube2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">No pending lab orders right now.</p>
            </div>
          )}
          {filteredPending.map(order => (
            <div key={order.orderId} className="bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={order.status} />
                  <UrgencyBadge urgency={order.urgency} />
                  {order.urgency === 'stat' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <p className="text-base font-black text-slate-900 dark:text-white truncate">{order.testName}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  {order.patientName} · {order.tokenNumber} · {order.age}y {order.gender} · {order.department || 'OPD'}
                </p>
                {order.result && (
                  <p className="text-xs text-cyan-700 dark:text-cyan-300 font-mono mt-1">
                    {order.result.value} {order.result.unit} {order.result.referenceRange ? `(${order.result.referenceRange})` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {order.status === 'ordered' && (
                  <button
                    type="button"
                    onClick={() => markCollected(order)}
                    disabled={busy === order.orderId}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    {busy === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                    Mark Collected
                  </button>
                )}
                {order.status === 'collected' && (
                  <button
                    type="button"
                    onClick={() => setResultModal(order)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Enter Result
                  </button>
                )}
                {order.status === 'resulted' && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Awaiting Verify
                  </span>
                )}
                {order.status === 'verified' && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ CRITICAL TAB ════════════════════════════════════════════════════ */}
      {tab === 'critical' && (
        <div className="space-y-3">
          {criticals.length === 0 && (
            <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-300 dark:text-emerald-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">No critical results. All clear.</p>
            </div>
          )}
          {criticals.map(order => (
            <div key={order.orderId} className="bg-white/95 dark:bg-slate-900/90 border border-red-500/30 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <StatusBadge status={order.status} />
                  <UrgencyBadge urgency={order.urgency} />
                </div>
                <p className="text-base font-black text-slate-900 dark:text-white truncate">{order.testName}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  {order.patientName} · {order.tokenNumber} · {order.age}y {order.gender} · {order.department || 'OPD'}
                </p>
                {order.result && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-mono font-black mt-1">
                    {order.result.value} {order.result.unit} {order.result.referenceRange ? `(ref ${order.result.referenceRange})` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {order.status === 'resulted' && (
                  <button
                    type="button"
                    onClick={() => verifyResult(order)}
                    disabled={busy === order.orderId}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    {busy === order.orderId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Verify & Push to Record
                  </button>
                )}
                {order.status === 'verified' && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1.5 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> In Patient Record
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RESULT MODAL ── */}
      {resultModal && (
        <ResultModal order={resultModal} onClose={() => setResultModal(null)} onSave={saveResult} />
      )}
    </div>
  );
}
