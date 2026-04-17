import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Bell, Mail, Smartphone, Monitor, Save, 
  RotateCcw, ShieldCheck, Clock, Settings2,
  AlertTriangle, CheckCircle2, RefreshCw,
  Heart, Thermometer, Droplets, Activity,
  Smartphone as PhoneIcon, Globe, Send,
  Zap, ShieldAlert, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_URL } from '../config/api';

/** Canonical rows so toggles always work even if the DB has an older/partial list. */
const DEFAULT_ALERT_ROWS = [
  { alertType: 'vital_out_of_range', pushEnabled: true, emailEnabled: true, inAppEnabled: true },
  { alertType: 'predictive_risk_high', pushEnabled: true, emailEnabled: true, inAppEnabled: true },
  { alertType: 'medication_reminder', pushEnabled: true, emailEnabled: true, inAppEnabled: true },
  { alertType: 'interaction_detected', pushEnabled: true, emailEnabled: true, inAppEnabled: true },
  { alertType: 'lab_test_due', pushEnabled: true, emailEnabled: false, inAppEnabled: true },
  { alertType: 'profile_incomplete', pushEnabled: true, emailEnabled: false, inAppEnabled: true },
  { alertType: 'goal_achieved', pushEnabled: true, emailEnabled: false, inAppEnabled: true },
  { alertType: 'new_feature', pushEnabled: false, emailEnabled: false, inAppEnabled: true },
  { alertType: 'health_tip', pushEnabled: false, emailEnabled: false, inAppEnabled: true }
];

const DEFAULT_THRESHOLDS = {
  systolicBP: { high: 140, low: 90 },
  diastolicBP: { high: 90, low: 60 },
  fastingGlucose: { low: 70, high: 110 },
  heartRate: { high: 100, low: 60 },
  spo2: { low: 94 }
};

function mergeAlertPreferences(serverList = []) {
  const byType = Object.fromEntries((serverList || []).map((p) => [p.alertType, p]));
  return DEFAULT_ALERT_ROWS.map((row) => ({
    ...row,
    ...(byType[row.alertType] || {})
  }));
}

function mergeThresholds(t = {}) {
  return {
    systolicBP: { ...DEFAULT_THRESHOLDS.systolicBP, ...t.systolicBP },
    diastolicBP: { ...DEFAULT_THRESHOLDS.diastolicBP, ...t.diastolicBP },
    fastingGlucose: { ...DEFAULT_THRESHOLDS.fastingGlucose, ...t.fastingGlucose },
    heartRate: { ...DEFAULT_THRESHOLDS.heartRate, ...t.heartRate },
    spo2: { ...DEFAULT_THRESHOLDS.spo2, ...t.spo2 }
  };
}

function alertTypeLabel(type) {
  const map = {
    vital_out_of_range: 'Vitals out of range',
    predictive_risk_high: 'High predictive risk',
    medication_reminder: 'Medication reminders',
    interaction_detected: 'Drug interactions',
    lab_test_due: 'Lab tests due',
    profile_incomplete: 'Profile incomplete',
    goal_achieved: 'Goal milestones',
    new_feature: 'Product updates',
    health_tip: 'Health tips'
  };
  return map[type] || String(type || '').replace(/_/g, ' ');
}

function segmentPriority(alertType) {
  if (!alertType) return 'Medium';
  if (alertType.includes('vital') || alertType.includes('predictive') || alertType.includes('interaction')) return 'High';
  return 'Medium';
}

const AlertSettings = () => {
  const { user } = useUser();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/preferences/${user.id}`)
        .then(res => {
          if (res.data.status === 'success') {
            const data = res.data.data || {};
            const quietHours = data.quietHours && typeof data.quietHours === 'object'
              ? { enabled: false, start: '22:00', end: '07:00', ...data.quietHours }
              : { enabled: false, start: '22:00', end: '07:00' };
            setPrefs({
              ...data,
              quietHours,
              preferences: mergeAlertPreferences(data.preferences),
              customThresholds: mergeThresholds(data.customThresholds)
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggle = (alertType, channel) => {
    const updated = { ...prefs };
    const idx = updated.preferences.findIndex(p => p.alertType === alertType);
    if (idx === -1) return;
    updated.preferences = [...updated.preferences];
    updated.preferences[idx] = {
      ...updated.preferences[idx],
      [channel]: !updated.preferences[idx][channel]
    };
    setPrefs(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/preferences/${user.id}`, prefs);
      showToast("Clinical alert architecture synchronized successfully.");
    } catch (err) {
      console.error("Save preferences failed", err);
      showToast("Failed to synchronize preferences.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all alert protocols to clinical defaults?")) return;
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/preferences/${user.id}/reset`);
      if (res.data.status === 'success') {
        const d = res.data.data || {};
        setPrefs({
          ...d,
          quietHours: d.quietHours && typeof d.quietHours === 'object'
            ? { enabled: false, start: '22:00', end: '07:00', ...d.quietHours }
            : { enabled: false, start: '22:00', end: '07:00' },
          preferences: mergeAlertPreferences(d.preferences),
          customThresholds: mergeThresholds(d.customThresholds)
        });
        showToast("Protocols reset to baseline.");
      }
    } catch (err) {
      showToast("Reset failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestAlert = async () => {
    setTesting(true);
    try {
      await axios.post(`${API_URL}/preferences/${user.id}/test`);
      showToast("Test signal broadcasted to your matrix.");
    } catch (err) {
      showToast("Signal broadcast failed.", "error");
    } finally {
      setTesting(false);
    }
  };

  if (loading || !prefs) return (
    <div className="p-12 animate-pulse space-y-12">
      <div className="h-12 w-80 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="h-96 md:col-span-2 bg-gray-100 dark:bg-gray-900 rounded-[3rem]" />
        <div className="h-96 bg-gray-100 dark:bg-gray-900 rounded-[3rem]" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto w-full pb-32 space-y-12 animate-in fade-in duration-1000">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-1 bg-emerald-500 rounded-full" />
             <span className="text-xs font-black uppercase text-emerald-500 tracking-[0.4em]">Notification Layer</span>
          </div>
          <h2 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Security Protocols</h2>
          <p className="text-base text-gray-600 dark:text-gray-400 font-medium max-w-xl">Configure biometric anomaly thresholds and clinical delivery channels for your health matrix.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleReset}
            className="px-6 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset Matrix
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center gap-3 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Commit Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 px-4">
        
        {/* Delivery Matrix (Channels) */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
              <div className="p-10 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center relative z-10">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                       <Bell className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Delivery Matrix</h3>
                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Cross-platform signal routing</p>
                    </div>
                 </div>
                 <div className="hidden sm:flex gap-10 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] px-4">
                    <span className="w-20 text-center">In-App</span>
                    <span className="w-20 text-center">Push</span>
                    <span className="w-20 text-center">Email</span>
                 </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-white/5 relative z-10">
                 {prefs.preferences.map((p) => (
                   <motion.div 
                     key={p.alertType} 
                     whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.02)' }}
                     className="p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
                   >
                      <div className="space-y-1">
                         <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">{alertTypeLabel(p.alertType)}</h4>
                         <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">Priority: {segmentPriority(p.alertType)}</p>
                      </div>
                      <div className="flex gap-10 self-end sm:self-auto">
                         <ToggleSwitch 
                            checked={p.inAppEnabled} 
                            onChange={() => handleToggle(p.alertType, 'inAppEnabled')}
                            color="emerald"
                            icon={<Monitor className="w-3 h-3" />}
                         />
                         <ToggleSwitch 
                            checked={p.pushEnabled} 
                            onChange={() => handleToggle(p.alertType, 'pushEnabled')}
                            color="blue"
                            icon={<Smartphone className="w-3 h-3" />}
                         />
                         <ToggleSwitch 
                            checked={p.emailEnabled} 
                            onChange={() => handleToggle(p.alertType, 'emailEnabled')}
                            color="amber"
                            icon={<Mail className="w-3 h-3" />}
                         />
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>

           {/* Emergency & Systems Control */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-slate-100 dark:border-white/5 p-10 rounded-[3rem] shadow-xl space-y-8 group transition-all hover:border-blue-500/30">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                       <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Matrix Integrity</h3>
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">Broadcast a diagnostic signal to verify delivery across all active channels.</p>
                 <button 
                  onClick={handleTestAlert}
                  disabled={testing}
                  className="w-full py-4 bg-gray-50 dark:bg-white/5 hover:bg-blue-500 hover:text-white border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                 >
                   {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                   Transmit Test Signal
                 </button>
              </div>

              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-slate-100 dark:border-white/5 p-10 rounded-[3rem] shadow-xl space-y-8 group transition-all hover:border-purple-500/30">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-purple-500 text-white rounded-2xl shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                       <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Quiet Protocol</h3>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">Silent Signal Mode</span>
                    <ToggleSwitch 
                      checked={prefs.quietHours.enabled} 
                      onChange={() => setPrefs({...prefs, quietHours: {...prefs.quietHours, enabled: !prefs.quietHours.enabled}})}
                      color="purple"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest px-1">Commence</label>
                       <input type="time" value={prefs.quietHours.start} onChange={(e) => setPrefs({...prefs, quietHours: {...prefs.quietHours, start: e.target.value}})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl p-4 text-xs font-black outline-none focus:border-purple-500/50 transition-all dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest px-1">Terminate</label>
                       <input type="time" value={prefs.quietHours.end} onChange={(e) => setPrefs({...prefs, quietHours: {...prefs.quietHours, end: e.target.value}})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl p-4 text-xs font-black outline-none focus:border-purple-500/50 transition-all dark:text-white" />
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Biometric Thresholds (Sidebar Card) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white dark:bg-black border border-emerald-100 dark:border-white/10 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
              
              <div className="flex items-center gap-5 mb-10 relative z-10">
                 <div className="p-4 bg-emerald-500/10 dark:bg-white/10 text-emerald-700 dark:text-white rounded-2xl">
                    <SlidersHorizontal className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Biometric Gates</h3>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Clinical threshold Logic</p>
                 </div>
              </div>

              <div className="space-y-8 relative z-10">
                 <ThresholdInput 
                    label="Systolic Upper Bound" 
                    value={prefs.customThresholds.systolicBP.high} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, systolicBP: {...prefs.customThresholds.systolicBP, high: val}}})}
                    unit="mmHg"
                    icon={<Activity className="w-4 h-4" />}
                 />
                 <ThresholdInput 
                    label="Systolic Lower Bound" 
                    value={prefs.customThresholds.systolicBP.low} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, systolicBP: {...prefs.customThresholds.systolicBP, low: val}}})}
                    unit="mmHg"
                    icon={<Activity className="w-4 h-4" />}
                 />
                 <ThresholdInput 
                    label="Diastolic Upper Bound" 
                    value={prefs.customThresholds.diastolicBP?.high ?? DEFAULT_THRESHOLDS.diastolicBP.high} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, diastolicBP: {...prefs.customThresholds.diastolicBP, high: val, low: prefs.customThresholds.diastolicBP?.low ?? DEFAULT_THRESHOLDS.diastolicBP.low}}})}
                    unit="mmHg"
                    icon={<Activity className="w-4 h-4" />}
                 />
                 <ThresholdInput 
                    label="Diastolic Lower Bound" 
                    value={prefs.customThresholds.diastolicBP?.low ?? DEFAULT_THRESHOLDS.diastolicBP.low} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, diastolicBP: {...prefs.customThresholds.diastolicBP, low: val, high: prefs.customThresholds.diastolicBP?.high ?? DEFAULT_THRESHOLDS.diastolicBP.high}}})}
                    unit="mmHg"
                    icon={<Activity className="w-4 h-4" />}
                 />
                 <ThresholdInput 
                    label="Fasting Glucose Upper" 
                    value={prefs.customThresholds.fastingGlucose?.high ?? DEFAULT_THRESHOLDS.fastingGlucose.high} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, fastingGlucose: {...prefs.customThresholds.fastingGlucose, high: val, low: prefs.customThresholds.fastingGlucose?.low ?? DEFAULT_THRESHOLDS.fastingGlucose.low}}})}
                    unit="mg/dL"
                    max={600}
                    icon={<Zap className="w-4 h-4" />}
                 />
                 <ThresholdInput 
                    label="Fasting Glucose Lower" 
                    value={prefs.customThresholds.fastingGlucose?.low ?? DEFAULT_THRESHOLDS.fastingGlucose.low} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, fastingGlucose: {...prefs.customThresholds.fastingGlucose, low: val, high: prefs.customThresholds.fastingGlucose?.high ?? DEFAULT_THRESHOLDS.fastingGlucose.high}}})}
                    unit="mg/dL"
                    max={600}
                    icon={<Zap className="w-4 h-4" />}
                 />
                 <ThresholdInput 
                    label="Minimum SPO2 Levels" 
                    value={prefs.customThresholds.spo2.low} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, spo2: { ...prefs.customThresholds.spo2, low: val } }})}
                    unit="%"
                    max={100}
                    icon={<Droplets className="w-4 h-4" />}
                 />
                 <ThresholdInput 
                    label="Max Pulse Velocity" 
                    value={prefs.customThresholds.heartRate.high} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, heartRate: {...prefs.customThresholds.heartRate, high: val}}})}
                    unit="BPM"
                    icon={<Heart className="w-4 h-4" />}
                 />
                 <ThresholdInput 
                    label="Min Pulse Velocity" 
                    value={prefs.customThresholds.heartRate.low} 
                    onChange={(val) => setPrefs({...prefs, customThresholds: {...prefs.customThresholds, heartRate: {...prefs.customThresholds.heartRate, low: val}}})}
                    unit="BPM"
                    icon={<Heart className="w-4 h-4" />}
                 />
              </div>

              <div className="mt-10 p-6 bg-emerald-50/70 dark:bg-white/5 rounded-3xl border border-emerald-100 dark:border-white/5 space-y-3">
                 <div className="flex items-center gap-3">
                    <ShieldAlert className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Active Guard</span>
                 </div>
                 <p className="text-[9px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed italic">Changes to biometric gates will trigger immediate recalibration of real-time monitoring streams.</p>
              </div>
           </div>

           <div className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
              <Zap className="absolute top-[-20px] right-[-20px] w-32 h-32 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
              <h4 className="text-lg font-black uppercase tracking-tight mb-2">Live Analysis</h4>
              <p className="text-xs font-bold opacity-80 leading-relaxed mb-6">Your alert matrix is currently connected to 3 real-time data streams via clinical endpoints.</p>
              <div className="flex items-center gap-4">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-emerald-600 bg-white/20 backdrop-blur-md" />)}
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest">Active Logic Chains</span>
              </div>
           </div>
        </div>

      </div>

      {/* Floating Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-8 py-5 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-4 border backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 'bg-gray-900/90 border-white/10 text-white'}`}
          >
             {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
             <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

const ToggleSwitch = ({ checked, onChange, color, icon }) => {
   const colors = {
      emerald: 'bg-emerald-500',
      blue: 'bg-blue-500',
      amber: 'bg-amber-500',
      purple: 'bg-purple-500'
   };
   
   return (
      <label className="w-20 flex flex-col items-center gap-2 cursor-pointer group">
         <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
         <div className={`w-14 h-8 rounded-full p-1.5 transition-all duration-500 ${checked ? (colors[color] || 'bg-emerald-500') : 'bg-gray-200 dark:bg-gray-800'}`}>
            <motion.div 
               animate={{ x: checked ? 24 : 0 }}
               transition={{ type: 'spring', stiffness: 500, damping: 30 }}
               className={`w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg transition-colors ${checked ? 'text-' + color + '-500' : 'text-gray-400'}`}
            >
               {icon}
            </motion.div>
         </div>
      </label>
   );
};

const ThresholdInput = ({ label, value, onChange, unit, icon, max }) => (
   <div className="space-y-3">
      <div className="flex items-center gap-3">
         <div className="text-gray-400">{icon}</div>
         <label className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 tracking-widest">{label}</label>
      </div>
      <div className="relative group">
         <input 
            type="number" 
            value={value} 
            max={max}
            onChange={(e) => onChange(Number(e.target.value))} 
            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 group-hover:border-emerald-500/30 rounded-2xl p-5 text-lg font-black text-gray-900 dark:text-white outline-none transition-all pr-16" 
         />
         <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500 uppercase tracking-widest">{unit}</span>
      </div>
   </div>
);

export default AlertSettings;

