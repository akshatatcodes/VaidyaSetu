import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { useTranslation } from 'react-i18next';

import { API_URL } from '../config/api';

const LANGUAGE_MAP = {
  'English': 'en',
  'Hindi': 'hi',
  'Marathi': 'mr',
  'Tamil': 'ta',
  'Telugu': 'te',
  'Bengali': 'bn',
  'Gujarati': 'gu',
  'Kannada': 'kn',
  'Malayalam': 'ml',
  'Odia': 'or',
  'Punjabi': 'pa',
  'Assamese': 'as',
  'Urdu': 'ur'
};
const getLanguageCode = (languageLabelOrCode) => LANGUAGE_MAP[languageLabelOrCode] || languageLabelOrCode || 'en';

const SettingsNav = ({ active, onSelect }) => {
  const { t } = useTranslation();
  const categories = [
    { id: 'identity', label: t('settings.categories.identity'), icon: User, sub: t('settings.categories.identity_sub') },
    { id: 'sync', label: t('settings.categories.sync'), icon: Zap, sub: t('settings.categories.sync_sub') },
    { id: 'security', label: t('settings.categories.security'), icon: Bell, sub: t('settings.categories.security_sub') },
    { id: 'preferences', label: t('settings.categories.preferences'), icon: Globe, sub: t('settings.categories.preferences_sub') },
    { id: 'governance', label: t('settings.categories.governance'), icon: Database, sub: t('settings.categories.governance_sub') },
    { id: 'display', label: t('settings.categories.display'), icon: Monitor, sub: t('settings.categories.display_sub') },
    { id: 'support', label: t('settings.categories.support'), icon: HelpCircle, sub: t('settings.categories.support_sub') }
  ];

  return (
    <div className="flex flex-col gap-3">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`group flex items-center p-5 rounded-[2rem] transition-all duration-500 border ${active === cat.id ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20 translate-x-1 border-emerald-500/50' : 'bg-white/40 dark:bg-white/5 backdrop-blur-xl text-gray-600 dark:text-gray-300 border-slate-100 dark:border-white/5 hover:border-emerald-500/30'}`}
        >
          <div className={`p-3 rounded-2xl mr-4 transition-all duration-500 ${active === cat.id ? 'bg-white/20' : 'bg-gray-50 dark:bg-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 shadow-sm'}`}>
             <cat.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div className="text-left">
            <div className={`text-xs font-black uppercase tracking-[0.2em] mb-1 ${active === cat.id ? 'text-white' : 'text-slate-900 dark:text-gray-100'}`}>{cat.label}</div>
            <div className={`text-[10px] font-bold uppercase opacity-60 tracking-wider ${active === cat.id ? 'text-white' : 'text-slate-500 dark:text-gray-400'}`}>{cat.sub}</div>
          </div>
          <ChevronRight className={`ml-auto w-4 h-4 transition-all duration-500 ${active === cat.id ? 'rotate-90 scale-125' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} />
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
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('cat') || 'identity';
  const setActiveCategory = (cat) => setSearchParams({ cat });

  const [profile, setProfile] = useState(null);
  const [pref, setPref] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(localStorage.getItem('voiceGuidance') === 'true');
  const [googleFitConnected, setGoogleFitConnected] = useState(localStorage.getItem('googleFitConnected') === 'true');
  const [syncingFit, setSyncingFit] = useState(false);
  const [aiDataSharing, setAiDataSharing] = useState(true);

  const [profileFormData, setProfileFormData] = useState({
     name: '',
     phone: '',
     gender: 'Male',
     dob: ''
  });

  const [alertSettings, setAlertSettings] = useState({
     highSystolicBP: 140,
     lowSPO2: 92,
     defaultTime: '09:00',
     snoozeDuration: 15,
     refillAlertAt: 7
  });

  const [globalPrefs, setGlobalPrefs] = useState({
     language: 'English',
     measurementUnits: 'metric',
     glucoseUnits: 'mg/dL'
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
         phone: user.primaryPhoneNumber?.phoneNumber || profile.phone?.value || '',
         gender: profile.gender?.value || 'Male',
         dob: profile.dob?.value?.split('T')[0] || ''
      });
      setAlertSettings(prev => ({
         ...prev,
         defaultTime: profile.settings?.defaultReminderTime || '09:00',
         snoozeDuration: profile.settings?.snoozeDuration || 15,
         refillAlertAt: profile.settings?.refillAlertThreshold || 7
      }));
      setGlobalPrefs({
         language: Object.keys(LANGUAGE_MAP).includes(profile.settings?.language)
           ? profile.settings.language
           : (Object.entries(LANGUAGE_MAP).find(([, code]) => code === profile.settings?.language)?.[0] || 'English'),
         measurementUnits: profile.settings?.measurementUnits || 'metric',
         glucoseUnits: profile.settings?.glucoseUnits || 'mg/dL'
      });
    }
    if (pref) {
       setAlertSettings(prev => ({
          ...prev,
          highSystolicBP: pref.customThresholds?.systolicBP?.high || 140,
          lowSPO2: pref.customThresholds?.spo2?.low || 92
       }));
    }
  }, [profile, pref, user]);

  useEffect(() => {
    const preferredLang = profile?.settings?.language;
    if (!preferredLang) return;

    const isoCode = LANGUAGE_MAP[preferredLang] || preferredLang;
    if (isoCode && i18n.language !== isoCode) {
      i18n.changeLanguage(isoCode);
      localStorage.setItem('i18nextLng', isoCode);
    }
  }, [profile?.settings?.language, i18n]);

  // Handle Google OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token') && user) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        setSyncingFit(true);
        axios.post(`${API_URL}/fitness/sync-extended`, { clerkId: user.id, accessToken: token })
          .then(() => {
            setGoogleFitConnected(true);
            localStorage.setItem('googleFitConnected', 'true');
            alert('Real Google Fit OAuth complete! Data synced using LIVE token.');
            window.history.replaceState(null, null, window.location.pathname); // clear hash
          })
          .catch(err => {
            alert('Sync failed from Google hook. ' + err.message);
          })
          .finally(() => setSyncingFit(false));
      }
    }
  }, [user]);

  const handleSaveIdentity = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_URL}/profile/update`, {
         clerkId: user.id,
         updates: Object.fromEntries(Object.entries(profileFormData).filter(([_, v]) => v !== ''))
      });
      await axios.post(`${API_URL}/reports/predictive-risk/recompute`, { clerkId: user.id, persist: true }).catch(() => null);
      window.dispatchEvent(new CustomEvent('vaidya-profile-updated'));
      fetchData();
      alert("Saved changes");
    } catch(err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      setSaving(true);
      await Promise.all([
        axios.patch(`${API_URL}/preferences/${user.id}`, {
           customThresholds: {
              ...pref?.customThresholds,
              systolicBP: { ...pref?.customThresholds?.systolicBP, high: alertSettings.highSystolicBP },
              spo2: { ...pref?.customThresholds?.spo2, low: alertSettings.lowSPO2 }
           }
        }),
        axios.patch(`${API_URL}/profile/settings/${user.id}`, {
           settings: {
              ...profile?.settings,
              defaultReminderTime: alertSettings.defaultTime,
              snoozeDuration: alertSettings.snoozeDuration,
              refillAlertThreshold: alertSettings.refillAlertAt
           }
        })
      ]);
      fetchData();
      alert("Security & Alert changes saved successfully!");
    } catch(err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGlobalPrefs = async () => {
    try {
      setSaving(true);
      await axios.patch(`${API_URL}/profile/settings/${user.id}`, {
         settings: {
            ...profile?.settings,
            language: getLanguageCode(globalPrefs.language),
            measurementUnits: globalPrefs.measurementUnits,
            glucoseUnits: globalPrefs.glucoseUnits
         }
      });
      
      // Update i18n active language immediately
      const isoCode = LANGUAGE_MAP[globalPrefs.language];
      if (isoCode) {
        i18n.changeLanguage(isoCode);
        localStorage.setItem('i18nextLng', isoCode);
      }
      
      fetchData();
      alert(t('settings.global_prefs.save'));
    } catch(err) {
      console.error(err);
      alert("Failed to save global preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPhone = async () => {
    try {
      if (!profileFormData.phone) {
        alert("Please enter a phone number first.");
        return;
      }
      
      const code = window.prompt(`Verification SMS sent to ${profileFormData.phone}. Enter code (Since Clerk strict mode is on, just enter 1234 to simulate):`);
      if (code) {
        alert("Phone number verified (Simulated)! You can now click Save Identity State to save it to your profile.");
      }
    } catch (err) {
      console.error("Verification failed", err);
      alert("Verification failed: " + err.message);
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

  const handleToggleAIDataSharing = async () => {
     try {
        const newVal = !aiDataSharing;
        setAiDataSharing(newVal);
        await axios.patch(`${API_URL}/profile/settings/${user.id}`, {
           settings: {
              ...profile?.settings,
              aiDataSharing: newVal
           }
        });
     } catch (err) {
        console.error("Failed to update AI data sharing", err);
        setAiDataSharing(!aiDataSharing); // Revert on fail
     }
  };

  const handleWipeVitals = async () => {
    if(window.confirm("Are you sure you want to permanently delete all logged vital signs? This cannot be undone.")) {
      try {
        setSaving(true);
        await axios.delete(`${API_URL}/vitals/purge/${user.id}`);
        alert("Vitals partially purged from the clinical matrix.");
        window.location.reload();
      } catch (err) {
        console.error("Purge failed", err);
        alert("Failed to wipe vitals.");
      } finally {
        setSaving(false);
      }
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

  const handleConnectGoogleFit = async () => {
    if (googleFitConnected) {
       setGoogleFitConnected(false);
       localStorage.setItem('googleFitConnected', 'false');
       return;
    }
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'PLACEHOLDER';
    if (clientId === 'PLACEHOLDER') {
       alert("Note: Initiating real Google Login, but since you are using a placeholder client ID, Google will show an 'invalid_client' error page. Add your real Google Cloud Client ID to .env.local as VITE_GOOGLE_CLIENT_ID to make it fully work.");
    }

    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const scope = encodeURIComponent('https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.sleep.read');
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&prompt=consent`;
    
    window.location.href = oauthUrl;
  };

  const handleInitializeReport = () => {
    const reportType = window.prompt("Enter Incident Type (Bug/Feature/Data Conflict):");
    if (reportType) {
      alert(`Incident [${reportType}] initialized. Our clinical engineering team will review your session logs.`);
    }
  };

  const handleRateApp = () => {
    alert("Thank you for your feedback! Redirecting to VaidyaSetu Evaluation Portal...");
    window.open('https://github.com/akshatatcodes/VaidyaSetu', '_blank');
  };

  const handleSharePlatform = async () => {
     if (navigator.share) {
       try {
         await navigator.share({
           title: 'VaidyaSetu AI',
           text: 'Check out this advanced Clinical AI platform for health tracking!',
           url: window.location.origin,
         });
       } catch (err) { console.log('Share failed', err); }
     } else {
       alert(`Share this link: ${window.location.origin}`);
     }
  };

  const handleLanguageSelect = (lang) => {
    setGlobalPrefs({ ...globalPrefs, language: lang });
    const isoCode = LANGUAGE_MAP[lang];
    if (isoCode) {
      i18n.changeLanguage(isoCode);
      localStorage.setItem('i18nextLng', isoCode);
    }
  };

  if (loading) return <div className="p-12 animate-pulse flex gap-10">
    <div className="w-64 space-y-4">
       {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-900 rounded-3xl" />)}
    </div>
    <div className="flex-1 h-[600px] bg-gray-50 dark:bg-gray-950 rounded-[3rem]" />
  </div>;

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 space-y-10 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-1 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.4em]">{t('settings.configuration')}</span>
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none uppercase italic underline decoration-emerald-500/20 underline-offset-8">{t('settings.title')}</h1>
           <p className="text-gray-600 dark:text-gray-300 mt-4 font-bold uppercase tracking-widest text-[9px]">{t('settings.status_alpha')}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-80">
           <SettingsNav active={activeCategory} onSelect={setActiveCategory} />
        </div>

        {/* Content Panel */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/5 rounded-[3.5rem] p-10 lg:p-14 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden min-h-[700px] group transition-all duration-500 hover:shadow-[0_40px_80px_rgba(35,60,111,0.08)]">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-125" />
            
            {/* Identity & Bio */}
            {activeCategory === 'identity' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('settings.identity.title')}</h2>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">{t('settings.identity.subtitle')}</p>
                </div>

                <div className="flex items-center gap-6 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-white/5">
                   <div className="relative group">
                      <img src={user.imageUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                      <button className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity flex flex-col gap-1">
                         <ImageIcon className="w-5 h-5" /><span className="text-[8px] uppercase tracking-widest font-black">{t('settings.identity.upload')}</span>
                      </button>
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-gray-900 dark:text-white">{user.fullName || 'User'}</h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                         <Mail className="w-3 h-3" /> {user.primaryEmailAddress?.emailAddress} <span className="text-emerald-500">{t('settings.identity.verified')}</span>
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest px-1">{t('settings.identity.name')}</label>
                        <input type="text" value={profileFormData.name} onChange={e => setProfileFormData({...profileFormData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500/30 transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest px-1">{t('settings.identity.phone')}</label>
                        <div className="flex gap-2">
                           <input type="text" placeholder="+91" value={profileFormData.phone} onChange={e => setProfileFormData({...profileFormData, phone: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500/30" />
                           <button onClick={handleVerifyPhone} className="px-6 bg-emerald-500/10 text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hidden md:block">{t('settings.identity.verify')}</button>
                        </div>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest px-1">{t('settings.identity.gender')}</label>
                        <select value={profileFormData.gender} onChange={e => setProfileFormData({...profileFormData, gender: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500/30 appearance-none">
                           <option value="Male">{t('settings.identity.male')}</option>
                           <option value="Female">{t('settings.identity.female')}</option>
                           <option value="Other">{t('settings.identity.other')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest px-1">{t('settings.identity.dob')}</label>
                        <input type="date" value={profileFormData.dob} onChange={e => setProfileFormData({...profileFormData, dob: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 text-sm font-bold outline-none focus:border-emerald-500/30 transition-all" />
                      </div>
                   </div>
                </div>

                <div className="pt-10 border-t border-gray-50 dark:border-gray-900 flex justify-end">
                  <button onClick={handleSaveIdentity} disabled={saving} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl transition-all shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                     {saving ? t('settings.identity.saving') : t('settings.identity.save')}
                  </button>
                </div>
              </div>
            )}

            {/* Sync Intelligence */}
            {activeCategory === 'sync' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                 <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('settings.sync.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{t('settings.sync.subtitle')}</p>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] flex items-center justify-between group overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform">
                          <Zap className="w-24 h-24" />
                       </div>
                       <div className="flex items-center gap-6 relative z-10">
                          <div className="p-5 bg-white dark:bg-gray-950 rounded-3xl shadow-xl">
                             <img src="https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png" className={`w-8 h-8 ${googleFitConnected ? '' : 'grayscale opacity-50'}`} alt="Google" />
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings.sync.google_fit')}</h4>
                             <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                <div className={`w-2 h-2 rounded-full ${googleFitConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} /> {googleFitConnected ? t('settings.sync.connected') : t('settings.sync.not_connected')}
                             </div>
                          </div>
                       </div>
                       <button onClick={handleConnectGoogleFit} disabled={syncingFit} className={`px-8 py-4 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 relative z-10 ${googleFitConnected ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-600 hover:text-white'}`}>{syncingFit ? t('settings.sync.syncing') : (googleFitConnected ? t('settings.sync.disconnect') : t('settings.sync.connect'))}</button>
                    </div>

                    <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] opacity-50 relative overflow-hidden grayscale">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                             <div className="p-5 bg-white dark:bg-gray-950 rounded-3xl shadow-xl">
                                <Activity className="w-8 h-8 text-blue-500" />
                             </div>
                             <div>
                                <h4 className="text-lg font-black text-gray-600 dark:text-gray-300 uppercase tracking-tight">{t('settings.sync.apple_health')}</h4>
                                <p className="text-[10px] text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest mt-1">{t('settings.sync.ios_ecosystem')}</p>
                             </div>
                          </div>
                          <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest bg-gray-200 dark:bg-gray-800 px-4 py-2 rounded-lg">{t('settings.sync.beta')}</span>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {/* Security & Reminders */}
            {activeCategory === 'security' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('settings.security.title')}</h2>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">{t('settings.security.subtitle')}</p>
                </div>

                <div className="space-y-8">
                   <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] items-center flex justify-between">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-500/10 rounded-2xl"><Bell className="w-6 h-6 text-emerald-500" /></div>
                         <div className="space-y-1">
                            <h4 className="text-lg font-black uppercase tracking-tight">{t('settings.security.alert_rules')}</h4>
                            <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">{t('settings.security.alert_rules_desc')}</p>
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
                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings.security.safe_zones')}</h4>
                         </div>
                         <div className="space-y-4">
                            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">{t('settings.security.high_systolic')}</span>
                               <input type="number" value={alertSettings.highSystolicBP} onChange={e => setAlertSettings({...alertSettings, highSystolicBP: Number(e.target.value)})} className="w-16 bg-transparent text-sm font-bold text-right outline-none" />
                            </div>
                            <div className="p-5 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">{t('settings.security.low_spo2')}</span>
                               <input type="number" value={alertSettings.lowSPO2} onChange={e => setAlertSettings({...alertSettings, lowSPO2: Number(e.target.value)})} className="w-16 bg-transparent text-sm font-bold text-right outline-none" />
                            </div>
                         </div>
                      </div>

                      <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] space-y-6">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl"><Clock className="w-6 h-6 text-blue-500" /></div>
                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings.security.medication_defaults')}</h4>
                         </div>
                         <div className="space-y-4">
                            <div className="p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">{t('settings.security.default_time')}</span>
                               <input type="time" value={alertSettings.defaultTime} onChange={e => setAlertSettings({...alertSettings, defaultTime: e.target.value})} className="bg-transparent text-sm font-bold text-right outline-none" />
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">{t('settings.security.snooze')}</span>
                               <select value={alertSettings.snoozeDuration} onChange={e => setAlertSettings({...alertSettings, snoozeDuration: Number(e.target.value)})} className="text-sm font-bold bg-transparent outline-none text-right"><option value={15}>{t('settings.security.mins', { val: 15 })}</option><option value={30}>{t('settings.security.mins', { val: 30 })}</option></select>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-950 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                               <span className="text-[10px] font-black uppercase text-gray-400">{t('settings.security.refill')}</span>
                               <select value={alertSettings.refillAlertAt} onChange={e => setAlertSettings({...alertSettings, refillAlertAt: Number(e.target.value)})} className="text-sm font-bold bg-transparent outline-none text-right"><option value={7}>{t('settings.security.days', { val: 7 })}</option><option value={3}>{t('settings.security.days', { val: 3 })}</option></select>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="pt-10 border-t border-gray-50 dark:border-gray-900 flex justify-end">
                  <button onClick={handleSaveSecuritySettings} disabled={saving} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl transition-all shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                     {saving ? t('settings.security.saving') : t('settings.security.save')}
                  </button>
                </div>
              </div>
            )}

             {/* Global Prefs */}
            {activeCategory === 'preferences' && (
               <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('settings.global_prefs.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{t('settings.global_prefs.subtitle')}</p>
                  </div>
                  <div className="space-y-8">
                     <div className="p-10 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[3.5rem] space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-indigo-500/10 rounded-2xl"><Languages className="w-6 h-6 text-indigo-500" /></div>
                           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings.global_prefs.platform_dialect')}</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                           {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Punjabi', 'Assamese', 'Urdu'].map(lang => (
                             <button 
                               key={lang} 
                               onClick={() => handleLanguageSelect(lang)} 
                               className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${lang === globalPrefs.language ? 'bg-emerald-500 text-white shadow-xl' : 'bg-white dark:bg-gray-950 text-gray-400 border border-gray-100 dark:border-gray-800'}`}
                             >
                               {lang}
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="p-10 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[3.5rem] space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-pink-500/10 rounded-2xl"><Activity className="w-6 h-6 text-pink-500" /></div>
                           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings.global_prefs.measurement_standards')}</h4>
                        </div>
                        <div className="flex gap-6">
                           <div className="flex-1 p-6 bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-100 dark:border-gray-800 space-y-4">
                              <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">{t('settings.global_prefs.weight_units')}</span>
                              <div className="flex gap-2">
                                 {['metric', 'imperial'].map(u => <button key={u} onClick={() => setGlobalPrefs({...globalPrefs, measurementUnits: u})} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${u === globalPrefs.measurementUnits ? 'bg-emerald-500 text-white' : 'text-gray-400 bg-gray-50 dark:bg-gray-900'}`}>{u}</button>)}
                              </div>
                           </div>
                           <div className="flex-1 p-6 bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-100 dark:border-gray-800 space-y-4">
                              <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">{t('settings.global_prefs.glucose_scale')}</span>
                              <div className="flex gap-2">
                                 {['mg/dL', 'mmol/L'].map(u => <button key={u} onClick={() => setGlobalPrefs({...globalPrefs, glucoseUnits: u})} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${u === globalPrefs.glucoseUnits ? 'bg-emerald-500 text-white' : 'text-gray-400 bg-gray-50 dark:bg-gray-900'}`}>{u}</button>)}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                <div className="pt-10 border-t border-gray-50 dark:border-gray-900 flex justify-end">
                  <button onClick={handleSaveGlobalPrefs} disabled={saving} className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl transition-all shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                     {saving ? t('settings.global_prefs.saving') : t('settings.global_prefs.save')}
                  </button>
                </div>
               </div>
            )}

            {/* Governance, Privacy & Sovereignty */}
            {activeCategory === 'governance' && (
               <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('settings.governance.title')}</h2>
                     <p className="text-gray-600 dark:text-gray-300 font-medium">{t('settings.governance.subtitle')}</p>
                  </div>

                  <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl"><Shield className="w-6 h-6 text-purple-500" /></div>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings.governance.ai_privacy')}</h4>
                     </div>
                     <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div>
                           <p className="text-sm font-black uppercase text-gray-700 dark:text-white">{t('settings.governance.ai_pool')}</p>
                           <p className="text-[9px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mt-1 max-w-sm">{t('settings.governance.ai_pool_desc')}</p>
                        </div>
                        <label className="cursor-pointer flex items-center">
                           <input type="checkbox" checked={aiDataSharing} onChange={handleToggleAIDataSharing} className="hidden" />
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
                              <button onClick={exportDataJSON} className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 shadow-xl">{t('settings.governance.json_data')}</button>
                              <button onClick={exportDataPDF} className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 shadow-xl">{t('settings.governance.report_pdf')}</button>
                           </div>
                        </div>
                        <div>
                           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings.governance.archive')}</h4>
                           <p className="text-[10px] text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest mt-2 leading-relaxed">{t('settings.governance.archive_desc')}</p>
                        </div>
                     </div>

                     <div className="p-8 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-[3rem] space-y-6">
                        <Trash2 className="w-8 h-8 text-red-500 opacity-80" />
                        <div>
                           <h4 className="text-lg font-black text-red-600 dark:text-red-500 uppercase tracking-tight">{t('settings.governance.purge')}</h4>
                           <p className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest mt-2 leading-relaxed italic">{t('settings.governance.purge_desc')}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={handleWipeVitals} className="flex-1 py-3 border border-red-500/30 text-red-600 dark:text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10">{t('settings.governance.wipe_vitals')}</button>
                           <button onClick={() => setPurgeConfirm(true)} className="flex-1 py-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500 shadow-red-500/30 shadow-xl">{t('settings.governance.global_purge')}</button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Display & Accessibility */}
            {activeCategory === 'display' && (
               <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('settings.display.title')}</h2>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">{t('settings.display.subtitle')}</p>
                  </div>

                  <div className="space-y-8">
                     <div className="p-10 bg-gray-50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800 rounded-[3.5rem] space-y-8">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-blue-500/10 rounded-2xl"><MonitorIcon className="w-6 h-6 text-blue-500" /></div>
                           <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{t('settings.display.chromatic')}</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <button onClick={() => theme !== 'light' && toggleTheme()} className={`flex items-center gap-6 p-6 rounded-3xl border transition-all ${theme === 'light' ? 'bg-white border-emerald-500 shadow-2xl' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-600 dark:text-gray-300'}`}>
                              <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-emerald-500' : ''}`} />
                              <div className="text-left">
                                 <div className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{t('settings.display.crystal_day')}</div>
                                 <p className="text-[9px] font-bold uppercase mt-1">{t('settings.display.light_desc')}</p>
                              </div>
                           </button>
                           <button onClick={() => theme !== 'dark' && toggleTheme()} className={`flex items-center gap-6 p-6 rounded-3xl border transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-2xl' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-600 dark:text-gray-300'}`}>
                              <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-emerald-500' : ''}`} />
                              <div className="text-left">
                                 <div className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{t('settings.display.obsidian_night')}</div>
                                 <p className="text-[9px] font-bold uppercase mt-1">{t('settings.display.dark_desc')}</p>
                              </div>
                           </button>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <button onClick={toggleContrast} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 text-center ${highContrast ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-xl' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}>
                           <Maximize className={`w-6 h-6 ${highContrast ? 'text-emerald-500' : ''}`} />
                           <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{t('settings.display.high_contrast')}</span>
                        </button>
                        <button onClick={() => setFontSize(prev => prev === 'base' ? 'large' : prev === 'large' ? 'x-large' : 'base')} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 text-center ${fontSize !== 'base' ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-xl text-emerald-500' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-400'}`}>
                           <Type className="w-6 h-6" />
                           <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{t('settings.display.font_scale')}: {fontSize}</span>
                        </button>
                        <button onClick={toggleMotion} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 text-center ${reducedMotion ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-xl' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}>
                           <Zap className={`w-6 h-6 ${reducedMotion ? 'text-emerald-500' : 'opacity-20'}`} />
                           <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{t('settings.display.reduce_motion')}</span>
                        </button>
                        <button onClick={toggleVoiceGuidance} className={`p-6 rounded-[2.5rem] border transition-all flex flex-col items-center gap-4 text-center ${voiceGuidance ? 'bg-white dark:bg-gray-900 border-emerald-500 shadow-xl text-emerald-500' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}>
                           {voiceGuidance ? <Volume2 className="w-6 h-6 text-emerald-500" /> : <Volume2 className="w-6 h-6" />}
                           <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{t('settings.display.voice_assist')}</span>
                        </button>
                     </div>
                  </div>
               </div>
            )}

            {/* Support & Legal (Step 80, 81) */}
            {activeCategory === 'support' && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{t('settings.support.title')}</h2>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">{t('settings.support.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <button onClick={() => navigate('/privacy')} className="w-full p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] flex items-center gap-6 hover:border-emerald-500/30 transition-all text-left">
                         <div className="p-4 bg-emerald-500/10 rounded-2xl"><Shield className="w-6 h-6 text-emerald-500" /></div>
                         <div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Privacy Protocol</h4>
                            <p className="text-[9px] text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest">Medical auditing logic</p>
                         </div>
                      </button>
                      <button onClick={() => navigate('/terms')} className="w-full p-8 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/5 rounded-[3rem] flex items-center gap-6 hover:border-emerald-500/30 transition-all text-left">
                         <div className="p-4 bg-blue-500/10 rounded-2xl"><FileText className="w-6 h-6 text-blue-500" /></div>
                         <div>
                            <h4 className="text-sm font-black uppercase tracking-tight">Terms of Service</h4>
                            <p className="text-[9px] text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest">Liabilities & usage consent</p>
                         </div>
                      </button>
                   </div>
                   
                   <div className="p-8 bg-emerald-500 text-white rounded-[3rem] shadow-2xl shadow-emerald-500/20 flex flex-col justify-between relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><MessageSquare className="w-24 h-24" /></div>
                      <div className="relative z-10 space-y-2">
                         <h4 className="text-xl font-black uppercase tracking-tighter italic">Report Incident</h4>
                         <p className="text-xs text-emerald-100 font-bold max-w-[80%] uppercase tracking-widest leading-relaxed">Submit a bug report or request a clinical feature addition.</p>
                      </div>
                      <button onClick={handleInitializeReport} className="w-max px-6 py-4 mt-6 bg-white text-emerald-600 font-black rounded-xl text-[10px] uppercase tracking-[0.2em] shadow-xl relative z-10">Initialize Form</button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <button onClick={handleRateApp} className="p-8 bg-gray-50 dark:bg-gray-950 rounded-[3rem] text-center border border-gray-100 dark:border-gray-800 hover:border-emerald-500/30 group">
                      <Star className="w-8 h-8 mx-auto text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white">Rate the App</h4>
                   </button>
                   <button onClick={handleSharePlatform} className="p-8 bg-gray-50 dark:bg-gray-950 rounded-[3rem] text-center border border-gray-100 dark:border-gray-800 hover:border-emerald-500/30 group">
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
                  <p className="text-gray-600 dark:text-gray-300 font-bold text-lg leading-relaxed px-4 uppercase tracking-tighter">You are about to permanently purge all clinical history from the VaidyaSetu matrix. Your identity will remain, but all biometric records will be liquidated.</p>
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
