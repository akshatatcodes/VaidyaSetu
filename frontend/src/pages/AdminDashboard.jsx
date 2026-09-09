import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Activity, AlertTriangle, Users, CheckCircle2, Clock, FlaskConical,
  BarChart3, Shield, RefreshCw, Stethoscope, ChevronRight, Zap,
  TestTube2, Building2, FileText, Bell, TrendingUp, ArrowUpRight, Lock
} from 'lucide-react';
import { API_URL } from '../config/api';
import { authHeaders } from '../utils/authHeaders';

const DEPT_LABELS = {
  Kayachikitsa: 'Kayachikitsa',
  Panchakarma: 'Panchakarma',
  Shalya: 'Shalya',
  Shalakya: 'Shalakya',
  'Prasuti & Stri Roga': 'Prasuti & Stri Roga',
  Kaumarbhritya: 'Kaumarbhritya',
  Swasthavritta: 'Swasthavritta',
  'General Medicine': 'General Medicine'
};

const HEADERS = authHeaders('admin');

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, accent = 'emerald', urgent = false }) {
  const accentMap = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    red:     { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20'     },
    amber:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20'   },
    blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20'    },
    purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20'  },
    teal:    { bg: 'bg-teal-500/10',    text: 'text-teal-400',    border: 'border-teal-500/20'    },
  };
  const c = accentMap[accent] || accentMap.emerald;
  return (
    <div className={`relative rounded-2xl border ${c.border} bg-white/95 dark:bg-slate-900/90 p-5 shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300 ${urgent ? 'ring-2 ring-red-500/40 animate-pulse-slow' : ''}`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${c.bg} blur-2xl pointer-events-none`} />
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-gray-400">{label}</span>
          <div className={`text-3xl font-black ${urgent ? 'text-red-400' : 'text-slate-900 dark:text-white'}`}>{value ?? '—'}</div>
          {sub && <p className="text-[11px] text-slate-500 dark:text-gray-500">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors cursor-pointer ${on ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`absolute w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    ordered:   'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    collected: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    resulted:  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    cancelled: 'bg-slate-500/15 text-slate-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${map[status] || map.ordered}`}>
      {status}
    </span>
  );
}

// ── Urgency Badge ────────────────────────────────────────────────────────────
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

export default function AdminDashboard() {
  const [stats, setStats]           = useState(null);
  const [departments, setDepartments] = useState({});
  const [labOrders, setLabOrders]   = useState([]);
  const [auditLog, setAuditLog]     = useState([]);
  const [queue, setQueue]           = useState([]);
  const [tab, setTab]               = useState('overview');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [updatingLab, setUpdatingLab] = useState(null);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const [sRes, dRes, lRes, qRes, aRes] = await Promise.allSettled([
        axios.get(`${API_URL}/admin/stats`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/departments`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/lab-orders?status=ordered`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/queue?limit=20`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/audit-log`, { headers: HEADERS })
      ]);
      if (sRes.status === 'fulfilled') setStats(sRes.value.data.data);
      if (dRes.status === 'fulfilled') setDepartments(dRes.value.data.data || {});
      if (lRes.status === 'fulfilled') setLabOrders(lRes.value.data.data || []);
      if (qRes.status === 'fulfilled') setQueue(qRes.value.data.data || []);
      if (aRes.status === 'fulfilled') setAuditLog(aRes.value.data.data || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('[Admin] Fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const toggleDept = async (name, field) => {
    const current = departments[name];
    try {
      await axios.patch(
        `${API_URL}/admin/departments/${encodeURIComponent(name)}`,
        { [field]: !current[field] },
        { headers: HEADERS }
      );
      setDepartments(prev => ({
        ...prev,
        [name]: { ...prev[name], [field]: !current[field] }
      }));
    } catch (e) {
      console.error('[Admin] Toggle dept error:', e.message);
    }
  };

  const markLabCollected = async (order) => {
    setUpdatingLab(order.orderId);
    try {
      await axios.patch(
        `${API_URL}/admin/lab-orders/${order.sessionId}/${order.orderId}/status`,
        { status: 'collected', labTechnicianId: 'LAB-TECH-01' },
        { headers: HEADERS }
      );
      await fetchAll(true);
    } catch (e) {
      console.error('[Admin] Mark collected error:', e.message);
    } finally {
      setUpdatingLab(null);
    }
  };

  const TABS = [
    { key: 'overview',    label: 'Overview',      icon: BarChart3    },
    { key: 'queue',       label: 'OPD Queue',     icon: Users        },
    { key: 'labs',        label: 'Lab Orders',    icon: FlaskConical },
    { key: 'departments', label: 'Departments',   icon: Building2    },
    { key: 'audit',       label: 'Audit Log',     icon: Shield       }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Loading Admin Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6 animate-in fade-in duration-300">

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" /> MediSahayak Admin Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">OPD Operations Dashboard</h1>
            <p className="text-xs text-emerald-200/70">
              AI-generated draft metrics — physician verification required for clinical decisions.
              {lastRefresh && <span className="ml-2 opacity-60">Last synced: {lastRefresh.toLocaleTimeString()}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-black transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW TAB ════════════════════════════════════════════════════ */}
      {tab === 'overview' && stats && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard icon={Users}        label="Sessions Today"        value={stats.sessionsToday}           sub="Total OPD registrations"         accent="teal"   />
            <KpiCard icon={AlertTriangle} label="Red Flags"             value={stats.redFlagCount}            sub="Emergency & critical triage"     accent="red"    urgent={stats.redFlagCount > 0} />
            <KpiCard icon={Clock}        label="Avg Intake (min)"      value={stats.avgIntakeMinutes}        sub="Voice-to-token completion time"  accent="blue"   />
            <KpiCard icon={TrendingUp}   label="AI Edits by Doctor"    value={`${stats.pctAiSummariesEditedByDoctor}%`} sub="Physician correction rate" accent="purple" />
          </div>

          {/* Queue Summary + Lab Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Queue Summary */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-500" /> Live Queue Summary
              </h2>
              {stats.queueSummary && (
                <div className="space-y-3">
                  {[
                    { label: 'Waiting Intake',    val: stats.queueSummary.waitingIntake,    color: 'bg-amber-400'   },
                    { label: 'Intake Completed',  val: stats.queueSummary.intakeCompleted,  color: 'bg-blue-400'    },
                    { label: 'In Consultation',   val: stats.queueSummary.inConsultation,   color: 'bg-purple-400'  },
                    { label: 'Completed',         val: stats.queueSummary.completed,        color: 'bg-emerald-400' }
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-gray-400 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${row.color}`} />
                        {row.label}
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{row.val ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lab Stats */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-500" /> Lab Module Summary
              </h2>
              {stats.labStats && (
                <div className="space-y-3">
                  {[
                    { label: 'Pending/Collected', val: stats.labStats.pendingLabs,   color: 'bg-amber-400'   },
                    { label: 'Resulted',          val: stats.labStats.resultedLabs,  color: 'bg-emerald-400' },
                    { label: 'STAT / Urgent',     val: stats.labStats.urgentLabs,    color: 'bg-red-400'     },
                    { label: 'Total Ordered',     val: stats.labStats.totalOrdered,  color: 'bg-blue-400'    }
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-gray-400 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${row.color}`} />
                        {row.label}
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{row.val ?? 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Department Volume + Red Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department Volume */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" /> Session Volume by Department
              </h2>
              <div className="space-y-2">
                {stats.byDepartment && Object.entries(stats.byDepartment)
                  .sort(([,a],[,b]) => b - a)
                  .map(([dept, count]) => {
                    const max = Math.max(...Object.values(stats.byDepartment), 1);
                    return (
                      <div key={dept} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-gray-400 font-medium">{dept}</span>
                          <span className="font-black text-slate-900 dark:text-white">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                            style={{ width: `${(count / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Recent Red Flags */}
            <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-red-500/20 shadow-sm space-y-4">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-red-500" /> Recent Emergency Flags
              </h2>
              {stats.recentRedFlags && stats.recentRedFlags.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentRedFlags.map((f, i) => (
                    <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{f.tokenNumber}</span>
                        <span className="text-[10px] font-black uppercase text-red-400 px-2 py-0.5 bg-red-500/10 rounded-lg">{f.triagePriority}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">{f.patientName} · {f.department}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(f.flags || []).slice(0, 2).map((fl, fi) => (
                          <span key={fi} className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded">{fl}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-semibold">No active red flags today. All clear.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ QUEUE TAB ════════════════════════════════════════════════════════ */}
      {tab === 'queue' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm">
            <h2 className="font-black text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-500" /> Today's OPD Queue
            </h2>
            {queue.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No sessions in queue today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/10">
                      {['Token', 'Patient', 'Age/Gender', 'Department', 'Status', 'Triage'].map(h => (
                        <th key={h} className="text-left py-2 px-3 font-black text-slate-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((s, i) => (
                      <tr key={s._id || i} className="border-b border-gray-50 dark:border-white/5 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-black">{s.tokenNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{s.patientName}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-gray-400">{s.age}y / {s.gender?.charAt(0)}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-gray-300">{s.department || '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            s.queueStatus === 'waiting_intake'  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                            s.queueStatus === 'intake_completed' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' :
                            s.queueStatus === 'in_consultation' ? 'bg-purple-500/15 text-purple-500' :
                            s.queueStatus === 'completed'       ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                            'bg-red-500/15 text-red-500'
                          }`}>{s.queueStatus?.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            s.triagePriority === 'emergency' ? 'bg-red-500/15 text-red-500' :
                            s.triagePriority === 'urgent'    ? 'bg-amber-500/15 text-amber-500' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>{s.triagePriority}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ LAB ORDERS TAB ══════════════════════════════════════════════════ */}
      {tab === 'labs' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TestTube2 className="w-4 h-4 text-purple-500" /> Pending Lab Orders — Lab Technician View
              </h2>
              <span className="text-xs text-slate-500 dark:text-gray-400 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">{labOrders.length} pending</span>
            </div>
            {labOrders.length === 0 ? (
              <div className="flex items-center gap-3 p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs font-semibold">All lab orders have been processed for today.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {labOrders.map((order, i) => (
                  <div key={`${order.sessionId}-${order.orderId}`} className={`p-4 rounded-2xl border ${order.urgency === 'stat' ? 'border-red-500/30 bg-red-500/5' : 'border-gray-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40'} flex flex-wrap items-center justify-between gap-4`}>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{order.testName}</span>
                        <UrgencyBadge urgency={order.urgency} />
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-gray-400">
                        {order.patientName} · {order.tokenNumber} · {order.department || '—'}
                      </p>
                      {order.notes && <p className="text-[11px] text-slate-400 italic">Note: {order.notes}</p>}
                    </div>
                    <button
                      type="button"
                      disabled={updatingLab === order.orderId}
                      onClick={() => markLabCollected(order)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white text-xs font-black transition-all shadow-sm cursor-pointer shrink-0"
                    >
                      {updatingLab === order.orderId ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FlaskConical className="w-3.5 h-3.5" />
                      )}
                      Mark Collected
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ DEPARTMENTS TAB ══════════════════════════════════════════════════ */}
      {tab === 'departments' && (
        <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-5">
          <div>
            <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-blue-500" /> Department Questionnaire Controls
            </h2>
            <p className="text-[11px] text-slate-400">Enable or disable Dashavidha Pariksha and Ayurveda probe per department for questionnaire flow management.</p>
          </div>
          <div className="space-y-3">
            {Object.entries(departments).map(([name, cfg]) => (
              <div key={name} className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {cfg.enabled ? '✓ Active' : '✗ Disabled'}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Toggle on={cfg.dashavidhaEnabled} onChange={() => toggleDept(name, 'dashavidhaEnabled')} />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-gray-300">Dashavidha</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Toggle on={cfg.ayurvedaProbeEnabled} onChange={() => toggleDept(name, 'ayurvedaProbeEnabled')} />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-gray-300">Ayurveda Probe</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Toggle on={cfg.enabled} onChange={() => toggleDept(name, 'enabled')} />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-gray-300">Dept. Active</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ AUDIT LOG TAB ════════════════════════════════════════════════════ */}
      {tab === 'audit' && (
        <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
          <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" /> DPDP Compliance Audit Log
          </h2>
          {auditLog.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">No audit entries found for today.</p>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
              {auditLog.map((log, i) => (
                <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">{log.action?.replace(/_/g, ' ')}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${
                        log.actorRole === 'doctor' ? 'bg-blue-500/10 text-blue-500' :
                        log.actorRole === 'admin'  ? 'bg-purple-500/10 text-purple-500' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}>{log.actorRole}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate">
                      {log.tokenNumber} · {log.patientName} · {log.field}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{log.at ? new Date(log.at).toLocaleTimeString() : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
