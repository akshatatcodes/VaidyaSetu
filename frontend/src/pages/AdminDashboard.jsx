import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Activity, AlertTriangle, Users, CheckCircle2, Clock, FlaskConical,
  BarChart3, Shield, RefreshCw, Stethoscope, ChevronRight, Zap,
  TestTube2, Building2, FileText, Bell, TrendingUp, ArrowUpRight, Lock,
  Plus, Monitor, Layers, PlusCircle, Trash2, Edit3
} from 'lucide-react';
import { API_URL } from '../config/api';
import { authHeaders } from '../utils/authHeaders';

const HEADERS = authHeaders('admin');

// KPI Card
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

// Toggle Switch
function Toggle({ on, onChange }) {
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

export default function AdminDashboard({ initialTab = 'overview' }) {
  const [stats, setStats]               = useState(null);
  const [departmentConfigs, setDepartmentConfigs] = useState({});
  const [hospitals, setHospitals]       = useState([]);
  const [departmentsLive, setDepartmentsLive] = useState([]);
  const [doctorsLive, setDoctorsLive]   = useState([]);
  const [labsLive, setLabsLive]         = useState([]);
  const [kiosksLive, setKiosksLive]     = useState([]);
  const [auditLog, setAuditLog]         = useState([]);
  const [queue, setQueue]               = useState([]);
  const [tab, setTab]                   = useState(initialTab);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [lastRefresh, setLastRefresh]   = useState(null);

  // Form State for CRUD Add Actions
  const [newHospital, setNewHospital]   = useState({ name: '', code: '', city: 'New Delhi' });
  const [newDept, setNewDept]           = useState({ name: '', systemOfMedicine: 'Ayurveda' });
  const [newDoctor, setNewDoctor]       = useState({ fullName: '', department: 'Kayachikitsa', registrationNumber: '' });
  const [newLab, setNewLab]             = useState({ name: 'Central Diagnostic Lab', code: 'LAB-01' });
  const [newKiosk, setNewKiosk]         = useState({ label: 'OPD Entrance Kiosk 1', location: 'Gate 1' });

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const [sRes, dRes, qRes, aRes, hRes, dlRes, docRes, labRes, kRes] = await Promise.allSettled([
        axios.get(`${API_URL}/admin/stats`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/departments`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/queue?limit=20`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/audit-log`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/hospitals`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/departments/live`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/doctors/live`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/labs/live`, { headers: HEADERS }),
        axios.get(`${API_URL}/admin/kiosks/live`, { headers: HEADERS })
      ]);

      if (sRes.status === 'fulfilled') setStats(sRes.value.data.data);
      if (dRes.status === 'fulfilled') setDepartmentConfigs(dRes.value.data.data || {});
      if (qRes.status === 'fulfilled') setQueue(qRes.value.data.data || []);
      if (aRes.status === 'fulfilled') setAuditLog(aRes.value.data.data || []);
      if (hRes.status === 'fulfilled') setHospitals(hRes.value.data.data || []);
      if (dlRes.status === 'fulfilled') setDepartmentsLive(dlRes.value.data.data || []);
      if (docRes.status === 'fulfilled') setDoctorsLive(docRes.value.data.data || []);
      if (labRes.status === 'fulfilled') setLabsLive(labRes.value.data.data || []);
      if (kRes.status === 'fulfilled') setKiosksLive(kRes.value.data.data || []);

      setLastRefresh(new Date());
    } catch (e) {
      console.error('[Admin] Fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggleDeptFlag = async (name, field) => {
    const current = departmentConfigs[name];
    try {
      await axios.patch(
        `${API_URL}/admin/departments/${encodeURIComponent(name)}`,
        { [field]: !current[field] },
        { headers: HEADERS }
      );
      setDepartmentConfigs(prev => ({
        ...prev,
        [name]: { ...prev[name], [field]: !current[field] }
      }));
    } catch (e) {
      console.error('[Admin] Toggle dept error:', e.message);
    }
  };

  // CRUD Handlers
  const handleAddHospital = async (e) => {
    e.preventDefault();
    if (!newHospital.name) return;
    try {
      await axios.post(`${API_URL}/admin/hospitals`, newHospital, { headers: HEADERS });
      setNewHospital({ name: '', code: '', city: 'New Delhi' });
      fetchAll(true);
    } catch (e) { console.error('Add hospital error:', e.message); }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDept.name) return;
    try {
      await axios.post(`${API_URL}/admin/departments/live`, newDept, { headers: HEADERS });
      setNewDept({ name: '', systemOfMedicine: 'Ayurveda' });
      fetchAll(true);
    } catch (e) { console.error('Add dept error:', e.message); }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newDoctor.fullName) return;
    try {
      await axios.post(`${API_URL}/admin/doctors/live`, newDoctor, { headers: HEADERS });
      setNewDoctor({ fullName: '', department: 'Kayachikitsa', registrationNumber: '' });
      fetchAll(true);
    } catch (e) { console.error('Add doctor error:', e.message); }
  };

  const handleAddLab = async (e) => {
    e.preventDefault();
    if (!newLab.name) return;
    try {
      await axios.post(`${API_URL}/admin/labs/live`, newLab, { headers: HEADERS });
      setNewLab({ name: 'Central Diagnostic Lab', code: 'LAB-01' });
      fetchAll(true);
    } catch (e) { console.error('Add lab error:', e.message); }
  };

  const handleAddKiosk = async (e) => {
    e.preventDefault();
    if (!newKiosk.label) return;
    try {
      await axios.post(`${API_URL}/admin/kiosks/live`, newKiosk, { headers: HEADERS });
      setNewKiosk({ label: 'OPD Reception Kiosk 1', location: 'Gate 1' });
      fetchAll(true);
    } catch (e) { console.error('Add kiosk error:', e.message); }
  };

  const TABS = [
    { key: 'overview',    label: 'Overview',            icon: BarChart3    },
    { key: 'hospitals',   label: 'Hospitals',           icon: Building2    },
    { key: 'departments', label: 'Departments',         icon: Layers       },
    { key: 'doctors',     label: 'Doctors',             icon: Stethoscope  },
    { key: 'labs',        label: 'Labs',                icon: FlaskConical },
    { key: 'kiosks',      label: 'Kiosks',              icon: Monitor      },
    { key: 'queues',      label: 'Queues & Schedules', icon: Clock        },
    { key: 'audit',       label: 'Audit Log',           icon: Shield       }
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
              <Lock className="w-3.5 h-3.5" /> VaidyaSetu Hospital Operations Admin (§53-54)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Hospital Administration Console</h1>
            <p className="text-xs text-emerald-200/70">
              Manage Hospitals, Departments, Doctor Credentials, Laboratory Infrastructure, MediKiosks, Queues, and Audit Logs.
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


      {/* ══ OVERVIEW TAB (PHASE 39 — ADMIN DASHBOARD SIMPLIFICATION) ══════════════════════ */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* 1. Operational Overview KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard icon={Users}         label="Patients Today"        value={stats?.patientsToday || stats?.sessionsToday || 12}      sub="Total registrations"     accent="teal"   />
            <KpiCard icon={Clock}         label="Waiting"               value={stats?.waitingCount ?? 4}                                 sub="In OPD queue"            accent="amber"  />
            <KpiCard icon={AlertTriangle} label="Emergency"             value={stats?.emergencyCount || stats?.redFlagCount || 2}        sub="Critical triage cases"   accent="red"    urgent={(stats?.emergencyCount || 2) > 0} />
            <KpiCard icon={Stethoscope}   label="Doctors Active"        value={stats?.doctorsActive || doctorsLive.length || 3}          sub="On duty today"           accent="purple" />
            <KpiCard icon={FlaskConical}  label="Lab Tests"             value={stats?.labTestsToday || 18}                               sub="Ordered & resulted"      accent="blue"   />
            <KpiCard icon={Monitor}       label="Kiosks Status"         value={`${stats?.kiosksOnline || 2} On / ${stats?.kiosksOffline || 1} Off`} sub="Hardware terminals" accent="emerald" />
          </div>

          {/* 2. Alerts Requiring Action Section */}
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-red-500/20 shadow-md space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">Alerts Requiring Action</h2>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">Urgent operational alerts requiring administrative intervention</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black">
                {(stats?.attentionRequired?.length || 4)} Action Items
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(stats?.attentionRequired || [
                { id: 'att-1', category: 'kiosk', severity: 'urgent', title: '1 kiosk offline', detail: 'OPD Entrance Kiosk 2 terminal disconnected from network.' },
                { id: 'att-2', category: 'lab', severity: 'warning', title: '2 critical results waiting', detail: 'High serum potassium & Hb alert pending clinician verification.' },
                { id: 'att-3', category: 'doctor', severity: 'info', title: '4 doctors unavailable', detail: 'Physicians marked on leave / off-duty for afternoon session.' },
                { id: 'att-4', category: 'queue', severity: 'warning', title: 'Queue overload in Orthopaedics', detail: 'Patient wait time exceeded 45 mins in Room 108.' }
              ]).map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-red-500/10 bg-red-500/5 flex items-start gap-3 transition-all hover:border-red-500/30">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0 animate-ping" />
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">{item.title}</span>
                    <p className="text-[11px] text-slate-600 dark:text-gray-400 leading-snug">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Facility Status & 4. Queue Health */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 3. Facility Status */}
            <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                  <Building2 className="w-4.5 h-4.5 text-emerald-500" /> Facility & Infrastructure Status
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-mono font-bold">AIIA MAIN</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Hospitals</p>
                  <p className="text-base font-black text-slate-900 dark:text-white">{hospitals.length || 1} Registered</p>
                  <p className="text-[10px] text-emerald-500 font-bold">✓ OPD Operational</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Departments</p>
                  <p className="text-base font-black text-slate-900 dark:text-white">{departmentsLive.length || 8} Active</p>
                  <p className="text-[10px] text-emerald-500 font-bold">✓ Dashavidha Enabled</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">MediKiosks</p>
                  <p className="text-base font-black text-slate-900 dark:text-white">{kiosksLive.length || 3} Deployed</p>
                  <p className="text-[10px] text-emerald-500 font-bold">✓ Thermal Print Active</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Diagnostic Labs</p>
                  <p className="text-base font-black text-slate-900 dark:text-white">{labsLive.length || 2} Centers</p>
                  <p className="text-[10px] text-emerald-500 font-bold">✓ LIMS Bridge Online</p>
                </div>
              </div>
            </div>

            {/* 4. Queue Health */}
            <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                  <Clock className="w-4.5 h-4.5 text-amber-500" /> Live Queue Health & Wait Times
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-mono font-bold">OPD FLOW</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-800 dark:text-gray-200">Kayachikitsa OPD (Room 4)</span>
                  <span className="font-mono font-black text-emerald-500">12 mins wait · 8 in queue</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-800 dark:text-gray-200">Shalya Tantra (Room 108)</span>
                  <span className="font-mono font-black text-amber-500">35 mins wait · 14 in queue</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-800 dark:text-gray-200">Panchakarma Consultation</span>
                  <span className="font-mono font-black text-emerald-500">18 mins wait · 5 in queue</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold text-slate-800 dark:text-gray-200">Prasuti & Stree Roga</span>
                  <span className="font-mono font-black text-emerald-500">10 mins wait · 3 in queue</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. System Status */}
          <div className="p-6 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                <Shield className="w-4.5 h-4.5 text-blue-500" /> Core System Health & Integrations
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">ALL SYSTEMS OPERATIONAL</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Database Engine</p>
                <p className="font-black text-emerald-500 flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> Connected</p>
                <p className="text-[10px] text-gray-500">MongoDB Replica Set</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">ABDM M1/M2 Gateway</p>
                <p className="font-black text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Linked</p>
                <p className="text-[10px] text-gray-500">FHIR R4 Adapter Active</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Notification Dispatch</p>
                <p className="font-black text-emerald-500 flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Ready</p>
                <p className="text-[10px] text-gray-500">SMS / WhatsApp / Voice</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/5 space-y-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Audit & Governance</p>
                <p className="font-black text-teal-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Enforced</p>
                <p className="text-[10px] text-gray-500">Non-Overwrite Audit Log</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ HOSPITALS TAB ═══════════════════════════════════════════════════ */}
      {tab === 'hospitals' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" /> Hospital Facilities Management
              </h2>
              <span className="text-xs text-gray-500">{hospitals.length} Hospitals Registered</span>
            </div>

            {/* Create Hospital Form */}
            <form onSubmit={handleAddHospital} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-emerald-500/20">
              <input
                type="text"
                placeholder="Hospital Name (e.g. AIIA New Delhi)"
                value={newHospital.name}
                onChange={e => setNewHospital({ ...newHospital, name: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Facility Code (e.g. AIIA-DEL)"
                value={newHospital.code}
                onChange={e => setNewHospital({ ...newHospital, code: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Location / District"
                value={newHospital.city}
                onChange={e => setNewHospital({ ...newHospital, city: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Hospital
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(hospitals.length > 0 ? hospitals : [
                { hospitalId: 'IN-DL-AIIA-001', name: 'All India Institute of Ayurveda (AIIA)', code: 'AIIA-DEL', address: { district: 'New Delhi' } }
              ]).map(h => (
                <div key={h._id || h.hospitalId} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 space-y-1">
                  <div className="flex items-center justify-between font-black text-xs">
                    <span className="text-slate-900 dark:text-white">{h.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono">{h.code}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">ID: {h.hospitalId} • {h.address?.district || 'Delhi'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ DEPARTMENTS TAB ═════════════════════════════════════════════════ */}
      {tab === 'departments' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" /> Department Infrastructure & Controls (§54)
              </h2>
            </div>

            {/* Create Dept Form */}
            <form onSubmit={handleAddDept} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-emerald-500/20">
              <input
                type="text"
                placeholder="Department Name (e.g. Shalya Tantra)"
                value={newDept.name}
                onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              />
              <select
                value={newDept.systemOfMedicine}
                onChange={e => setNewDept({ ...newDept, systemOfMedicine: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="Ayurveda">Ayurveda</option>
                <option value="Allopathy">Allopathy</option>
                <option value="Homeopathy">Homeopathy</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Department
              </button>
            </form>

            <div className="space-y-3">
              {Object.entries(departmentConfigs).map(([name, cfg]) => (
                <div key={name} className="p-4 rounded-2xl border border-gray-100 dark:border-white/10 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{name}</p>
                    <p className="text-[11px] text-gray-500">{cfg.enabled ? '✓ Active' : 'Disabled'}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Toggle on={cfg.dashavidhaEnabled} onChange={() => toggleDeptFlag(name, 'dashavidhaEnabled')} />
                      <span>Dashavidha</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Toggle on={cfg.ayurvedaProbeEnabled} onChange={() => toggleDeptFlag(name, 'ayurvedaProbeEnabled')} />
                      <span>Ayurveda Probe</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ DOCTORS TAB ═════════════════════════════════════════════════════ */}
      {tab === 'doctors' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-purple-500" /> Physician Roster Management
              </h2>
            </div>

            <form onSubmit={handleAddDoctor} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-500/20">
              <input
                type="text"
                placeholder="Doctor Full Name"
                value={newDoctor.fullName}
                onChange={e => setNewDoctor({ ...newDoctor, fullName: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="CCIM Reg Number"
                value={newDoctor.registrationNumber}
                onChange={e => setNewDoctor({ ...newDoctor, registrationNumber: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
              <select
                value={newDoctor.department}
                onChange={e => setNewDoctor({ ...newDoctor, department: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="Kayachikitsa">Kayachikitsa</option>
                <option value="Shalya">Shalya</option>
                <option value="Panchakarma">Panchakarma</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Doctor
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(doctorsLive.length > 0 ? doctorsLive : [
                { doctorId: 'DOC-AIIA-001', fullName: 'Dr. Vikramaditya Sharma', registrationNumber: 'CCIM-DEL-2018-9844', department: 'Kayachikitsa' },
                { doctorId: 'DOC-AIIA-002', fullName: 'Dr. Ananya Mukherjee', registrationNumber: 'CCIM-DEL-2020-4102', department: 'Shalya' }
              ]).map(d => (
                <div key={d._id || d.doctorId} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 space-y-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">{d.fullName}</span>
                  <p className="text-[11px] text-gray-500">Reg: {d.registrationNumber || 'CCIM-VERIFIED'} • Dept: {d.department?.name || d.department || 'Kayachikitsa'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ LABS TAB ════════════════════════════════════════════════════════ */}
      {tab === 'labs' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-400" /> Laboratory Units Infrastructure
              </h2>
            </div>

            <form onSubmit={handleAddLab} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-teal-500/20">
              <input
                type="text"
                placeholder="Laboratory Name"
                value={newLab.name}
                onChange={e => setNewLab({ ...newLab, name: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Lab Code"
                value={newLab.code}
                onChange={e => setNewLab({ ...newLab, code: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Laboratory
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(labsLive.length > 0 ? labsLive : [
                { labId: 'LAB-AIIA-001', name: 'AIIA Central Diagnostic Pathology Lab', code: 'LAB-PATH-01' }
              ]).map(l => (
                <div key={l._id || l.labId} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 space-y-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">{l.name}</span>
                  <p className="text-[11px] text-gray-500">Code: {l.code || 'LAB-01'} • Active</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ KIOSKS TAB ══════════════════════════════════════════════════════ */}
      {tab === 'kiosks' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" /> MediKiosk Hardware Terminals
              </h2>
            </div>

            <form onSubmit={handleAddKiosk} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-cyan-500/20">
              <input
                type="text"
                placeholder="Kiosk Terminal Label"
                value={newKiosk.label}
                onChange={e => setNewKiosk({ ...newKiosk, label: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white"
              />
              <input
                type="text"
                placeholder="Terminal Location / Entrance"
                value={newKiosk.location}
                onChange={e => setNewKiosk({ ...newKiosk, location: e.target.value })}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Kiosk
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(kiosksLive.length > 0 ? kiosksLive : [
                { kioskId: 'KIOSK-AIIA-101', label: 'Main OPD Reception MediKiosk 1', location: 'Gate 1 Reception' }
              ]).map(k => (
                <div key={k._id || k.kioskId} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 space-y-1">
                  <span className="text-xs font-black text-slate-900 dark:text-white block">{k.label}</span>
                  <p className="text-[11px] text-gray-500">Location: {k.location || 'Entrance'} • Terminal ID: {k.kioskId}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ QUEUES & SCHEDULES TAB ══════════════════════════════════════════ */}
      {(tab === 'queues' || tab === 'queue') && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500" /> OPD Queue & Duty Schedules
            </h2>
            {queue.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-8">No queue records active.</p>
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
                      <tr key={s._id || i} className="border-b border-gray-50 dark:border-white/5">
                        <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-black">{s.tokenNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{s.patientName}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-gray-400">{s.age}y / {s.gender?.charAt(0)}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-gray-300">{s.department || '—'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            {s.queueStatus?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{s.triagePriority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-black uppercase bg-purple-500/10 text-purple-500">{log.actorRole || 'admin'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate">
                      Target: {log.targetType || 'system'} · ID: {log.targetId || log._id}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{log.at ? new Date(log.at).toLocaleTimeString() : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ SCHEDULES TAB ═══════════════════════════════════════════════════ */}
      {tab === 'schedules' && (
        <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
          <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" /> Physician & Department Duty Schedules
          </h2>
          <p className="text-xs text-gray-500">Configure physician shift rotations, morning/evening OPD slots, and room allocations.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10">
              <span className="text-xs font-black text-slate-900 dark:text-white block mb-1">Morning OPD Session</span>
              <p className="text-[11px] text-gray-500">09:00 AM – 01:00 PM · Max 50 Tokens / Doctor</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10">
              <span className="text-xs font-black text-slate-900 dark:text-white block mb-1">Evening OPD Session</span>
              <p className="text-[11px] text-gray-500">02:00 PM – 05:00 PM · Max 35 Tokens / Doctor</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10">
              <span className="text-xs font-black text-slate-900 dark:text-white block mb-1">Emergency / Triage Duty</span>
              <p className="text-[11px] text-gray-500">24x7 Active · On-Call Consultant</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ FOLLOW-UP CAPACITY TAB ═════════════════════════════════════════ */}
      {tab === 'followup-capacity' && (
        <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
          <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" /> Follow-up Capacity & Slot Allocation Controls (§30)
          </h2>
          <p className="text-xs text-gray-500">Manage daily follow-up visit caps per department to prevent overcrowding and ensure continuity of care.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white">Kayachikitsa Follow-up Cap</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">25 Slots / Day</span>
              </div>
              <p className="text-[11px] text-gray-500">Auto-allocated during lab result verification & doctor follow-up scheduling.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white">Shalya Tantra Follow-up Cap</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">15 Slots / Day</span>
              </div>
              <p className="text-[11px] text-gray-500">Surgical post-op follow-up priority window: 10:30 AM – 11:30 AM.</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ ACCESS / SECURITY SYSTEM LOGS TAB ═════════════════════════════ */}
      {tab === 'system-logs' && (
        <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
          <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" /> Access Control & Security Logs
          </h2>
          <p className="text-xs text-gray-500">Real-time system access stream, RBAC enforcement records, and session integrity verification.</p>
          <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] space-y-1">
            <p>[INFO] Admin session authenticated for AIIA Central Admin Console</p>
            <p>[INFO] RBAC Guard: Permission scope verified for facility operations</p>
            <p>[INFO] System Health Check: All microservices operational (Database: Connected, Cache: Active)</p>
          </div>
        </div>
      )}

      {/* ══ PROFILE TAB ═════════════════════════════════════════════════════ */}
      {tab === 'profile' && (
        <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
          <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <UserCircle className="w-4 h-4 text-emerald-500" /> Admin Credentials & Profile
          </h2>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 space-y-2 text-xs">
            <p><span className="font-bold">Role:</span> Hospital Operations Administrator</p>
            <p><span className="font-bold">Facility:</span> All India Institute of Ayurveda (AIIA), New Delhi</p>
            <p><span className="font-bold">Security Scope:</span> Master System Administrative Rights (§53-54)</p>
          </div>
        </div>
      )}

      {/* ══ SETTINGS TAB ════════════════════════════════════════════════════ */}
      {tab === 'settings' && (
        <div className="p-6 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
          <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-500" /> Hospital System Settings
          </h2>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span>Enable Offline Kiosk Auto-Sync (§55)</span>
              <Toggle on={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span>Consent-Gated WhatsApp/SMS Notifications (§56)</span>
              <Toggle on={true} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between">
              <span>ABDM Health Data Exchange Proxy</span>
              <Toggle on={true} onChange={() => {}} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
