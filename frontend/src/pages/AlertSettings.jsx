import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Bell, Mail, Smartphone, Monitor, Save, 
  RotateCcw, ShieldCheck, Clock, Settings2,
  AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const AlertSettings = () => {
  const { user } = useUser();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/preferences/${user.id}`)
        .then(res => {
          if (res.data.status === 'success') {
             const data = res.data.data || {};
             if (!data.quietHours) data.quietHours = { enabled: false, start: '22:00', end: '07:00' };
             if (!data.customThresholds) data.customThresholds = { systolicBP: { high: 140 }, spo2: { low: 90 } };
             if (!data.customThresholds.systolicBP) data.customThresholds.systolicBP = { high: 140 };
             if (!data.customThresholds.spo2) data.customThresholds.spo2 = { low: 90 };
             if (!data.preferences) data.preferences = [];
             setPrefs(data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleToggle = (alertType, channel) => {
    const updated = { ...prefs };
    const idx = updated.preferences.findIndex(p => p.alertType === alertType);
    if (idx !== -1) {
       updated.preferences[idx][channel] = !updated.preferences[idx][channel];
       setPrefs(updated);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/preferences/${user.id}`, prefs);
      alert("Alert preferences saved successfully!");
    } catch (err) {
      console.error("Save preferences failed", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prefs) return <div className="p-12 animate-pulse space-y-8">
    <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    <div className="h-96 bg-gray-100 dark:bg-gray-900 rounded-3xl" />
  </div>;

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 space-y-10 animate-in fade-in duration-700">
      
      <div className="flex justify-between items-end px-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Security Preferences</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Configure clinical alert delivery and biometric thresholds</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-3 disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Commit Changes
        </button>
      </div>

      {/* Notification Matrix (Step 62) */}
      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                 <Bell className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Delivery Matrix</h3>
           </div>
           <div className="flex gap-8 text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest px-4">
              <span className="w-16 text-center">In-App</span>
              <span className="w-16 text-center">Browser</span>
              <span className="w-16 text-center">Email</span>
           </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
           {(prefs.preferences || []).map((p) => (
             <div key={p.alertType} className="p-8 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                <div className="space-y-1">
                   <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">{p.alertType.replace(/_/g, ' ')}</h4>
                   <p className="text-[10px] text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest">Protocol Type: {p.alertType.split('_')[0]}</p>
                </div>
                <div className="flex gap-8">
                   <label className="w-16 flex justify-center cursor-pointer">
                      <input type="checkbox" checked={p.inAppEnabled} onChange={() => handleToggle(p.alertType, 'inAppEnabled')} className="hidden" />
                      <div className={`w-10 h-6 rounded-full p-1 transition-all ${p.inAppEnabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${p.inAppEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                   </label>
                   <label className="w-16 flex justify-center cursor-pointer">
                      <input type="checkbox" checked={p.pushEnabled} onChange={() => handleToggle(p.alertType, 'pushEnabled')} className="hidden" />
                      <div className={`w-10 h-6 rounded-full p-1 transition-all ${p.pushEnabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-800'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${p.pushEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                   </label>
                   <label className="w-16 flex justify-center cursor-pointer">
                      <input type="checkbox" checked={p.emailEnabled} onChange={() => handleToggle(p.alertType, 'emailEnabled')} className="hidden" />
                      <div className={`w-10 h-6 rounded-full p-1 transition-all ${p.emailEnabled ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-800'}`}>
                         <div className={`w-4 h-4 bg-white rounded-full transition-transform ${p.emailEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                   </label>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Threshold & Quiet Hours (Step 62) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-8 rounded-[2.5rem] shadow-xl space-y-8">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Clock className="w-6 h-6 text-blue-500" />
               </div>
               <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Quiet Protocol</h3>
            </div>
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Enable Quiet Hours</span>
                  <label className="cursor-pointer">
                     <input type="checkbox" checked={prefs.quietHours.enabled} onChange={() => setPrefs({...prefs, quietHours: {...prefs.quietHours, enabled: !prefs.quietHours.enabled}})} className="hidden" />
                     <div className={`w-12 h-7 rounded-full p-1 transition-all ${prefs.quietHours.enabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${prefs.quietHours.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                     </div>
                  </label>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2">Start Transmission</label>
                     <input type="time" value={prefs.quietHours.start} onChange={(e) => setPrefs({...prefs, quietHours: {...prefs.quietHours, start: e.target.value}})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-xs outline-none" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2">End Transmission</label>
                     <input type="time" value={prefs.quietHours.end} onChange={(e) => setPrefs({...prefs, quietHours: {...prefs.quietHours, end: e.target.value}})} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-xs outline-none" />
                  </div>
               </div>
            </div>
         </div>

         <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-8 rounded-[2.5rem] shadow-xl space-y-8">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <Settings2 className="w-6 h-6 text-amber-500" />
               </div>
               <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">Biometric Limits</h3>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">High BP Systolic</span>
                  <div className="flex items-center gap-3">
                     <input type="number" value={prefs.customThresholds.systolicBP.high || 140} className="w-16 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-center font-bold" />
                     <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">mmHg</span>
                  </div>
               </div>
               <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Low SpO2 Critical</span>
                  <div className="flex items-center gap-3">
                     <input type="number" value={prefs.customThresholds.spo2.low || 90} className="w-16 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-2 text-xs text-center font-bold" />
                     <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">%</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default AlertSettings;
