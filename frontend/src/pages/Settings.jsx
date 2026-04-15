import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import { 
  User, Shield, Bell, Zap, Database, 
  HelpCircle, Settings as SettingsIcon, Globe, 
  ChevronRight, Save, Trash2, Download, 
  Monitor, Languages, Clock, Activity, 
  CheckCircle2, RefreshCw, XCircle, AlertTriangle,
  Mail, Phone, Calendar, Info, Settings2, Moon, Sun, Monitor  as MonitorIcon,
  Maximize, Type, Image as ImageIcon, FileText, Volume2, Mic, Star,
  MessageSquare, Trash
} from 'lucide-react';
import jsPDF from 'jspdf';
import { generateArchivePDF } from '../utils/pdfGenerator';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const SettingsNav = ({ active, onSelect }) => {
  const categories = [
    { id: 'identity', label: 'Identity & Bio', icon: User, sub: 'Profile metadata' },
    { id: 'sync', label: 'Sync Intelligence', icon: Zap, sub: 'Connected platforms' },
    { id: 'security', label: 'Security & Alerts', icon: Bell, sub: 'Thresholds & defaults' },
    { id: 'preferences', label: 'Global Prefs', icon: Globe, sub: 'Language & units' },
    { id: 'governance', label: 'Data Sovereignty', icon: Database, sub: 'Export, Privacy & Purge' },
    { id: 'display', label: 'Display & UX', icon: Monitor, sub: 'Accessibility & themes' },
    { id: 'support', label: 'Support & Legal', icon: HelpCircle, sub: 'FAQ, feedback & terms' }
  ];

  return (
    <div className="flex flex-col gap-2">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`group flex items-center p-4 rounded-[1.5rem] transition-all ${active === cat.id ? 'bg-emerald-600 text-white shadow-xl translate-x-1' : 'bg-white dark:bg-gray-950 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/5'}`}
        >
          <div className={`p-2.5 rounded-xl mr-4 ${active === cat.id ? 'bg-white/20' : 'bg-gray-50 dark:bg-gray-900 group-hover:bg-emerald-500/10 transition-colors'}`}>
             <cat.icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black uppercase tracking-widest">{cat.label}</div>
            <div className={`text-[9px] font-bold uppercase opacity-60 ${active === cat.id ? 'text-white' : 'text-gray-400'}`}>{cat.sub}</div>
          </div>
          <ChevronRight className={`ml-auto w-4 h-4 transition-transform ${active === cat.id ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
        </button>
      ))}
    </div>
  );
};

const Settings = () => {
  const { user } = useUser();
  const { 
    theme, toggleTheme, 
    fontSize, setFontSize, 
    highContrast, toggleContrast, 
    reducedMotion, toggleMotion 
  } = useTheme();

  const [activeCategory, setActiveCategory] = useState('identity');
  const [profile, setProfile] = useState(null);
  const [pref, setPref] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(localStorage.getItem('voiceGuidance') === 'true');
  const [aiDataSharing, setAiDataSharing] = useState(true);

  const [profileFormData, setProfileFormData] = useState({
     name: '',
     phone: '',
     gender: 'Male',
     dob: ''
  });

  const fetchData = async () => {
    try {
      const [pRes, prefRes] = await Promise.all([
        axios.get(`${API_URL}/profile/${user.id}`),
        axios.get(`${API_URL}/preferences/${user.id}`).catch(() => ({ data: { status: 'error' } }))
      ]);
      if (pRes.data.status === 'success') setProfile(pRes.data.data);
      if (prefRes.data.status === 'success') setPref(prefRes.data.data);
    } catch (err) {
      console.error("Fetch settings error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileFormData({
         name: profile.name?.value || user.fullName || '',
         phone: profile.phone?.value || '',
         gender: profile.gender?.value || 'Male',
         dob: profile.dob?.value?.split('T')[0] || ''
      });
    }
  }, [profile, user]);

  const handleSaveIdentity = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/profile/update`, {
         clerkId: user.id,
         updates: Object.fromEntries(Object.entries(profileFormData).filter(([_, v]) => v !== ''))
      });
      await axios.post(`${API_URL}/reports/hybrid-assessment`, { clerkId: user.id, persist: true }).catch(() => null);
      window.dispatchEvent(new CustomEvent('vaidya-profile-updated'));
      fetchData();
    } catch(err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleVoiceGuidance = () => {
    const val = !voiceGuidance;
    setVoiceGuidance(val);
    localStorage.setItem('voiceGuidance', val);
  };

  const exportDataJSON = async () => {
    try {
      const res = await axios.get(`${API_URL}/governance/export/${user.id}`);
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VaidyaSetu_Export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (err) { console.error("Export failed", err); }
  };

  const exportDataPDF = async () => {
     try {
       const [profileRes, vitalsRes, labRes, medsRes, reportRes] = await Promise.all([
         axios.get(`${API_URL}/profile/${user.id}`).catch(() => ({ data: { data: null } })),
         axios.get(`${API_URL}/vitals/${user.id}`).catch(() => ({ data: { data: [] } })),
         axios.get(`${API_URL}/lab-results/${user.id}`).catch(() => ({ data: { data: [] } })),
         axios.get(`${API_URL}/medications/${user.id}`).catch(() => ({ data: { data: [] } })),
         axios.get(`${API_URL}/reports/${user.id}`).catch(() => ({ data: { data: null } }))
       ]);
       generateArchivePDF(user.fullName || 'User', {
         profile: profileRes.data?.data,
         vitals: vitalsRes.data?.data || [],
         labResults: labRes.data?.data || [],
         medications: medsRes.data?.data || [],
         report: reportRes.data?.data
       });
     } catch (err) {
       console.error('PDF export failed', err);
     }
  };

  const handlePurgeData = async () => {
    try {
      setSaving(true);
      await axios.delete(`${API_URL}/governance/purge/${user.id}`);
      setPurgeConfirm(false);
      window.location.reload();
    } catch (err) {
      console.error("Purge failed", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 animate-pulse flex gap-10">
    <div className="w-64 space-y-4">
       {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-900 rounded-3xl" />)}
    </div>
    <div className="flex-1 h-[600px] bg-gray-50 dark:bg-gray-950 rounded-[3rem]" />
  </div>;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 p-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-1 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em]">Configuration Center</span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none uppercase italic underline decoration-emerald-500/20 underline-offset-8">User Control hub</h1>
           <p className="text-gray-500 dark:text-gray-400 mt-4 font-bold uppercase tracking-widest text-[9px]">Build v1.2.0-Alpha • Core Engine Status: Online</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80">
           <SettingsNav active={activeCategory} onSelect={setActiveCategory} />
        </div>

        {/* Content Panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[3.5rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden min-h-[700px]">
            
            {/* Identity & Bio (Step 67, 69) */}
            {activeCategory === 'identity' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Identity Core</h2>
                  <p className="text-gray-400 font-medium">Demographic metadata and verification status.</p>
                </div>

                <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="relative group">
                      <img src={user.imageUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                      <button className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity flex flex-col gap-1">
                         <ImageIcon className="w-5 h-5" /><span className="text-[8px] uppercase tracking-widest font-black">Upload</span>
                      </button>
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white">{user.fullName || 'User'}</h4>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                         <Mail className="w-3 h-3" /> {user.primaryEmailAddress?.emailAddress} <span className="text-emerald-500">(Verified)</span>
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest px-1">Legal Full Name</label>
                        <input type="text" value={profileFormData.name} onChange={e => setProfileFormData({...profileFormData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest px-1">Phone Number</label>
                        <div className="flex gap-2">
                           <input type="text" placeholder="+91" value={profileFormData.phone} onChange={e => setProfileFormData({...profileFormData, phone: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500/30" />
                           <button className="px-6 bg-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hidden md:block">Verify</button>
                        </div>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest px-1">Demographic Gender</label>
                        <select value={profileFormData.gender} onChange={e => setProfileFormData({...profileFormData, gender: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500/30 appearance-none">
                           <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest px-1">Chronological Entry (DOB)</label>
                        <input type="date" value={profileFormData.dob} onChange={e => setProfileFormData({...profileFormData, dob: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500/30 transition-all" />
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t border-gray-50 dark:border-gray-900 flex justify-end">
                  <button onClick={handleSaveIdentity} disabled={saving} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl transition-all shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                     {saving ? 'Saving...' : 'Save Identity State'}
                  </button>
                </div>
              </div>
            )}

            {/* Sync Intelligence (Step 73) */}
            {activeCategory === 'sync' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Sync Intelligence</h2>
                    <p className="text-gray-400 font-medium">Manage integrated health platforms and real-time biometric pipelines.</p>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] flex items-center justify-between group overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform">
                          <Zap className="w-24 h-24" />
                       </div>
                       <div className="flex items-center gap-6 relative z-10">
                          <div className="p-5 bg-white dark:bg-gray-950 rounded-3xl shadow-xl">
                             <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" className="w-8 h-8 grayscale opacity-50" alt="Google" />
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Google Fit Protocol</h4>
                             <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full" /> Not Connected
                             </div>
                          </div>
                       </div>
                       <button className="px-8 py-4 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-95 relative z-10">Connect Hub</button>
                    </div>

                    <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] opacity-50 relative overflow-hidden grayscale">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                             <div className="p-5 bg-white dark:bg-gray-950 rounded-3xl shadow-xl">
                                <Activity className="w-8 h-8 text-blue-500" />
                             </div>
                             <div>
                                <h4 className="text-lg font-black text-gray-400 uppercase tracking-tight">Apple Health Link</h4>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">iOS Ecosystem Sync</p>
                             </div>
                          </div>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg">Beta Testing</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Security & Reminders (Step 70, 71, 79) */}
            {activeCategory === 'security' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Security & Alerts</h2>
                  <p className="text-gray-400 font-medium">Notification delivery, biometric thresholds, and medication defaults.</p>
                </div>

                <div className="space-y-8">
                   <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] items-center flex justify-between">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-500/10 rounded-2xl"><Bell className="w-6 h-6 text-emerald-500" /></div>
                         <div className="space-y-1">
                            <h4 className="text-lg font-black uppercase tracking-tight">Full Alert Matrix Rules</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configure channels and quiet hours.</p>
                         </div>
                      </div>
                      <button onClick={() => window.location.href='/alerts/settings'} className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all shadow-xl">
                         <ChevronRight className="w-5 h-5" />
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl"><Settings2 className="w-6 h-6 text-amber-500" /></div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Biometric Safe Zones</h4>
                         </div>
                         <div className="space-y-4">
                            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">High Systolic BP</span>
                               <input type="number" defaultValue={140} className="w-16 bg-transparent text-sm font-bold text-right outline-none" />
                            </div>
                            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">Low SPO2 Trigger</span>
                               <input type="number" defaultValue={92} className="w-16 bg-transparent text-sm font-bold text-right outline-none" />
                            </div>
                         </div>
                      </div>

                      <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl"><Clock className="w-6 h-6 text-blue-500" /></div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Medication Defaults</h4>
                         </div>
                         <div className="space-y-4">
                            <div className="p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">Default Time</span>
                               <input type="time" defaultValue="09:00" className="bg-transparent text-sm font-bold text-right outline-none" />
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">Snooze Duration</span>
                               <select className="text-sm font-bold bg-transparent outline-none text-right"><option>15 mins</option><option>30 mins</option></select>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">Refill Alert At</span>
                               <select className="text-sm font-bold bg-transparent outline-none text-right"><option>7 days</option><option>3 days</option></select>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* Global Prefs (Step 68, 78) */}
            {activeCategory === 'preferences' && (
               <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Global Prefs</h2>
                    <p className="text-gray-400 font-medium">Localization and medical unit standards.</p>
                  </div>
                  {/* ... same as before, omitted the full copy to fit, keeping layout valid ... */}
                  <div className="space-y-8">
                     <div className="p-10 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[3.5rem] space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-indigo-500/10 rounded-2xl"><Languages className="w-6 h-6 text-indigo-500" /></div>
                           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Platform Dialect</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali'].map(lang => (
                             <button key={lang} className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'English' ? 'bg-emerald-500 text-white shadow-xl' : 'bg-white dark:bg-gray-950 text-gray-400 border border-gray-100 dark:border-gray-800'}`}>
                               {lang}
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="p-10 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[3.5rem] space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-pink-500/10 rounded-2xl"><Activity className="w-6 h-6 text-pink-500" /></div>
                           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Measurement Standards</h4>
                        </div>
                        <div className="flex gap-6">
                           <div className="flex-1 p-6 bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-100 dark:border-gray-800 space-y-4">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Weight Units</span>
                              <div className="flex gap-2">
                                 {['Metric', 'Imperial'].map(u => <button key={u} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${u === 'Metric' ? 'bg-emerald-500 text-white' : 'text-gray-400 bg-gray-50 dark:bg-gray-900'}`}>{u}</button>)}
                              </div>
                           </div>
                           <div className="flex-1 p-6 bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-100 dark:border-gray-800 space-y-4">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Glucose Scale</span>
                              <div className="flex gap-2">
                                 {['mg/dL', 'mmol/L'].map(u => <button key={u} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${u === 'mg/dL' ? 'bg-emerald-500 text-white' : 'text-gray-400 bg-gray-50 dark:bg-gray-900'}`}>{u}</button>)}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Governance, Privacy & Sovereignty (Step 74, 75, 76) */}
            {activeCategory === 'governance' && (
               <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Data Sovereignty & Privacy</h2>
                     <p className="text-gray-400 font-medium">Control over what data is logged, shared, and deleted.</p>
                  </div>

                  <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl"><Shield className="w-6 h-6 text-purple-500" /></div>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">AI Privacy Controls</h4>
                     </div>
                     <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div>
                           <p className="text-sm font-black uppercase text-gray-700 dark:text-white">Clinical AI Analysis Pool</p>
                           <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1 max-w-sm">Allow system to use generalized biometric trends to improve alert modeling. Data remains completely unidentifiable.</p>
                        </div>
                        <label className="cursor-pointer flex items-center">
                           <input type="checkbox" checked={aiDataSharing} onChange={() => setAiDataSharing(!aiDataSharing)} className="hidden" />
                           <div className={`w-12 h-6 rounded-full transition-all ${aiDataSharing ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}>
                              <div className={`w-6 h-6 bg-white rounded-full border transform transition-transform ${aiDataSharing ? 'translate-x-6' : 'translate-x-0'}`} />
                           </div>
                        </label>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="p-8 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-[3rem] space-y-6">
                        <div className="flex items-center justify-between">
                           <Download className="w-8 h-8 text-emerald-500 opacity-80" />
                           <div className="flex gap-2">
                              <button onClick={exportDataJSON} className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 shadow-xl">JSON Data</button>
                              <button onClick={exportDataPDF} className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 shadow-xl">Report PDF</button>
                           </div>
                        </div>
                        <div>
                           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Clinical Archive</h4>
                           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2 leading-relaxed">Download a complete structured JSON dataset or a PDF ready for physician review. Includes all charts and timelines.</p>
                        </div>
                     </div>

                     <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-[3rem] space-y-6">
                        <Trash2 className="w-8 h-8 text-red-500 opacity-80" />
                        <div>
                           <h4 className="text-lg font-black text-red-600 dark:text-red-500 uppercase tracking-tight">Partial or Global Purge</h4>
                           <p className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest mt-2 leading-relaxed italic">Selectively wipe vital history or initialize a permanent wipe of all your clinical records across the matrix.</p>
                        </div>
                        <div className="flex gap-2">
                           <button className="flex-1 py-3 border border-red-500/30 text-red-600 dark:text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10">Wipe Vitals Only</button>
                           <button onClick={() => setPurgeConfirm(true)} className="flex-1 py-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 shadow-red-500/30 shadow-xl">Global Purge</button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Display & Accessibility (Step 77) */}
            {activeCategory === 'display' && (
               <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Display & UX</h2>
                    <p className="text-gray-400 font-medium">Visual preferences and clinical accessibility controls.</p>
                  </div>

                  <div className="space-y-8">
                     <div className="p-10 bg-gray-50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800 rounded-[3.5rem] space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-blue-500/10 rounded-2xl"><MonitorIcon className="w-6 h-6 text-blue-500" /></div>
                           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Chromatic Profile</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <button onClick={() => theme !== 'light' && toggleTheme()} className={`flex items-center gap-6 p-6 rounded-3xl border transition-all ${theme === 'light' ? 'bg-white border-emerald-500 shadow-2xl' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-400'}`}>
                              <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-emerald-500' : ''}`} />
                              <div className="text-left">
                                 <div className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Crystal Day</div>
                                 <p className="text-[9px] font-bold uppercase mt-1">Light Optimized Protocol</p>
                              </div>
                           </button>
                           <button onClick={() => theme !== 'dark' && toggleTheme()} className={`flex items-center gap-6 p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-2xl' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-400'}`}>
                              <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-emerald-500' : ''}`} />
                              <div className="text-left">
                                 <div className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Obsidian Night</div>
                                 <p className="text-[9px] font-bold uppercase mt-1">Dark Matrix Preferred</p>
                              </div>
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <button onClick={toggleContrast} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 text-center ${highContrast ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-xl' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-400'}`}>
                           <Maximize className={`w-6 h-6 ${highContrast ? 'text-emerald-500' : ''}`} />
                           <span className="text-[10px] font-black uppercase tracking-widest leading-tight">High Contrast</span>
                        </button>
                        <button className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 text-center bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-400 cursor-pointer`}>
                           <Type className="w-6 h-6" />
                           <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Font Scale (WIP)</span>
                        </button>
                        <button onClick={toggleMotion} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 text-center ${reducedMotion ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-xl' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-400'}`}>
                           <Zap className={`w-6 h-6 ${reducedMotion ? 'text-emerald-500' : 'opacity-20'}`} />
                           <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Reduce Motion</span>
                        </button>
                        <button onClick={toggleVoiceGuidance} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 text-center ${voiceGuidance ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-xl text-emerald-500' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-400'}`}>
                           {voiceGuidance ? <Volume2 className="w-6 h-6 text-emerald-500" /> : <Volume2 className="w-6 h-6" />}
                           <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Voice Assist</span>
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* Support & Legal (Step 80, 81) */}
            {activeCategory === 'support' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Support & Legal</h2>
                  <p className="text-gray-400 font-medium">Platform policies, help center, and contribution forms.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <button onClick={() => window.location.href='/privacy'} className="w-full p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] flex items-center gap-6 hover:border-emerald-500/30 transition-all text-left">
                         <div className="p-4 bg-emerald-500/10 rounded-2xl"><Shield className="w-6 h-6 text-emerald-500" /></div>
                         <div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Privacy Protocol</h4>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Medical auditing logic</p>
                         </div>
                      </button>
                      <button onClick={() => window.location.href='/terms'} className="w-full p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] flex items-center gap-6 hover:border-emerald-500/30 transition-all text-left">
                         <div className="p-4 bg-blue-500/10 rounded-2xl"><FileText className="w-6 h-6 text-blue-500" /></div>
                         <div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Terms of Service</h4>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Liabilities & usage consent</p>
                         </div>
                      </button>
                   </div>
                   
                   <div className="p-8 bg-emerald-500 text-white rounded-[3rem] shadow-2xl shadow-emerald-500/20 flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><MessageSquare className="w-24 h-24" /></div>
                      <div className="relative z-10 space-y-2">
                         <h4 className="text-xl font-black uppercase tracking-tighter italic">Report Incident</h4>
                         <p className="text-xs text-emerald-100 font-bold max-w-[80%] uppercase tracking-widest leading-relaxed">Submit a bug report or request a clinical feature addition.</p>
                      </div>
                      <button className="w-max px-6 py-4 mt-6 bg-white text-emerald-600 font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl relative z-10">Initialize Form</button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <button className="p-8 bg-gray-50 dark:bg-gray-950 rounded-[3rem] text-center border border-gray-100 dark:border-gray-800 hover:border-emerald-500/30 group">
                      <Star className="w-8 h-8 mx-auto text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Rate the App</h4>
                   </button>
                   <button className="p-8 bg-gray-50 dark:bg-gray-950 rounded-[3rem] text-center border border-gray-100 dark:border-gray-800 hover:border-emerald-500/30 group">
                      <Zap className="w-8 h-8 mx-auto text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Share Platform</h4>
                   </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Purge Modal */}
      {purgeConfirm && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#030712]/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 border border-red-500/30 rounded-[4rem] p-12 max-w-xl text-center space-y-10 shadow-3xl shadow-red-500/20 animate-in zoom-in duration-500">
               <div className="p-8 bg-red-500/10 rounded-full w-max mx-auto shadow-2xl">
                  <AlertTriangle className="w-20 h-20 text-red-500 animate-pulse" />
               </div>
               <div className="space-y-4">
                  <h2 className="text-4xl font-black text-red-600 uppercase tracking-tighter leading-none italic underline decoration-red-500/20 underline-offset-8">Critical Warning</h2>
                  <p className="text-gray-500 dark:text-gray-400 font-bold text-lg leading-relaxed px-4 uppercase tracking-tighter">You are about to permanently purge all clinical history from the VaidyaSetu matrix. Your identity will remain, but all biometric records will be liquidated.</p>
               </div>
               <div className="flex flex-col md:flex-row gap-4">
                  <button onClick={() => setPurgeConfirm(false)} className="flex-1 py-6 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-black rounded-[2.5rem] uppercase tracking-widest text-xs hover:bg-gray-200">Abort Sequence</button>
                  <button onClick={handlePurgeData} disabled={saving} className="flex-1 py-6 bg-red-600 text-white font-black rounded-[2.5rem] uppercase tracking-widest text-xs shadow-2xl shadow-red-500/40 hover:bg-red-500 disabled:opacity-50">
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Deletion'}
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default Settings;
