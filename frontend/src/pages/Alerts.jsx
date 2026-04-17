import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Bell, AlertTriangle, ShieldAlert, Heart, Activity, 
  Trash2, CheckCircle2, Search, Filter, Clock,
  ChevronRight, RefreshCw, X, AlertOctagon, Info, Settings2, ThumbsUp, ThumbsDown,
  Home, FileText, Settings, LogOut, AlertCircle, UserCircle, Pill
} from 'lucide-react';

import { API_URL } from '../config/api';

const Alerts = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('unread'); // unread, critical, all
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [protocolLoading, setProtocolLoading] = useState(false);
  const [protocolData, setProtocolData] = useState(null);
  const [protocolError, setProtocolError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest
  const protocolRef = useRef(null);

  const fetchAlerts = useCallback(async (silent = false) => {
    if (!user?.id) return;
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API_URL}/alerts/${user.id}`);
      if (res.data.status === 'success') {
        setAlerts(res.data.data);
      }
    } catch (err) {
      console.error("Fetch alerts failed", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) fetchAlerts(false);
  }, [user, fetchAlerts]);

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => fetchAlerts(true), 12000);
    const onRefresh = () => fetchAlerts(true);
    window.addEventListener('vaidya:alerts-refresh', onRefresh);
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchAlerts(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      window.removeEventListener('vaidya:alerts-refresh', onRefresh);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user, fetchAlerts]);

  const markRead = async (id) => {
    try {
      await axios.patch(`${API_URL}/alerts/${id}/read`);
      setAlerts(alerts.map(a => a._id === id ? { ...a, status: 'read' } : a));
    } catch (err) {
      console.error("Mark read failed", err);
    }
  };

  const dismissAlert = async (id) => {
    try {
      await axios.delete(`${API_URL}/alerts/${id}`);
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      setSelectedAlert((cur) => (cur && cur._id === id ? null : cur));
      window.dispatchEvent(new CustomEvent('vaidya:alerts-refresh'));
    } catch (err) {
      console.error('Dismiss failed', err);
      alert('Could not archive this alert. Please try again.');
    }
  };

  const markAllRead = async () => {
    try {
      await axios.patch(`${API_URL}/alerts/${user.id}/read-all`);
      setAlerts(alerts.map(a => ({ ...a, status: 'read' })));
      window.dispatchEvent(new CustomEvent('vaidya:alerts-refresh'));
    } catch (err) {
      console.error("Mark all read failed", err);
    }
  };

  const [feedbackStatus, setFeedbackStatus] = useState({});

  const handleAlertFeedback = async (alertId, rating) => {
    try {
      await axios.post(`${API_URL}/alerts/${alertId}/feedback`, { rating });
      setFeedbackStatus(prev => ({ ...prev, [alertId]: true }));
    } catch (err) {
      console.error('Feedback failed', err);
    }
  };

  const getProtocolRoute = (alert) => {
    const t = (alert.type || '').toLowerCase();
    if (t.includes('interaction') || t === 'interaction_detected') return '/prescriptions';
    if (t.includes('vital') || t === 'vital_out_of_range') return '/vitals';
    if (t.includes('medication') || t === 'medication_reminder') return '/medicines';
    if (t.includes('lab') || t === 'lab_test_due') return '/vitals';
    if (t.includes('profile') || t === 'profile_incomplete') return '/profile';
    return alert.actionUrl || '/';
  };

  const deriveVitalContextFromAlert = (alert) => {
    const text = `${alert?.title || ''} ${alert?.description || ''}`.toLowerCase();
    const raw = `${alert?.title || ''} ${alert?.description || ''}`;

    // BP pattern: "180/120"
    const bpMatch = raw.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    if (bpMatch && (text.includes('bp') || text.includes('blood pressure') || text.includes('hypertensive'))) {
      const systolic = Number(bpMatch[1]);
      const diastolic = Number(bpMatch[2]);
      if (Number.isFinite(systolic) && Number.isFinite(diastolic)) {
        return { vitalType: 'blood_pressure', value: { systolic, diastolic } };
      }
    }

    // Glucose pattern (mg/dL)
    if (text.includes('glucose')) {
      const gMatch = raw.match(/(\d{2,3})\s*(mg\/dl|mg\/dL)?/);
      if (gMatch) {
        const value = Number(gMatch[1]);
        if (Number.isFinite(value)) return { vitalType: 'blood_glucose', value };
      }
    }

    // SpO2 pattern (%)
    if (text.includes('spo2') || text.includes('oxygen')) {
      const sMatch = raw.match(/(\d{2,3})\s*%/);
      if (sMatch) {
        const value = Number(sMatch[1]);
        if (Number.isFinite(value)) return { vitalType: 'oxygen_saturation', value };
      }
    }

    return null;
  };

  const getDoctorSearchQuery = (alert) => {
    const t = (alert?.type || '').toLowerCase();
    const priority = (alert?.priority || '').toLowerCase();
    const ctx = deriveVitalContextFromAlert(alert);

    if (t.includes('interaction')) return 'General Physician';
    if (ctx?.vitalType === 'blood_pressure') return priority === 'critical' ? 'Emergency cardiologist' : 'Cardiologist';
    if (ctx?.vitalType === 'blood_glucose') return 'Endocrinologist';
    if (ctx?.vitalType === 'oxygen_saturation') return 'Pulmonologist';
    if (t.includes('medication')) return 'General Physician';
    return 'General Physician';
  };

  useEffect(() => {
    if (!selectedAlert || !user) return;
    const t = (selectedAlert.type || '').toLowerCase();
    setProtocolData(null);
    setProtocolError(null);

    // Only fetch protocol details for vital alerts right now.
    if (!(t.includes('vital') || t === 'vital_out_of_range')) return;

    const ctx = deriveVitalContextFromAlert(selectedAlert);
    if (!ctx?.vitalType || ctx.value === undefined) return;

    setProtocolLoading(true);
    axios.post(`${API_URL}/vitals/${user.id}/analyze`, {
      vitalType: ctx.vitalType,
      value: ctx.value
    }).then((res) => {
      if (res.data.status === 'success') setProtocolData(res.data.data?.mitigations || null);
      else setProtocolError('Protocol generation failed.');
    }).catch((err) => {
      console.error('[Alerts] Protocol fetch failed:', err.response?.data || err.message);
      setProtocolError('Protocol generation failed.');
    }).finally(() => setProtocolLoading(false));
  }, [selectedAlert, user]);

  const filteredAlerts = alerts
    .filter(a => {
      if (activeTab === 'unread') return a.status === 'unread';
      if (activeTab === 'critical') return a.priority === 'critical' || a.priority === 'high';
      return true;
    })
    .filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full pb-20 space-y-12 animate-pulse">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-900 rounded-[2.5rem]" />)}
      </div>
    );
  }

  const priorityStyles = {
    critical: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: <AlertOctagon className="w-6 h-6 text-red-500" />,
      text: 'text-red-500',
      badge: 'bg-red-500 text-white'
    },
    high: {
      bg: 'bg-orange-500/10 border-orange-500/30',
      icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
      text: 'text-orange-500',
      badge: 'bg-orange-500 text-white'
    },
    medium: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: <Activity className="w-6 h-6 text-amber-500" />,
      text: 'text-amber-500',
      badge: 'bg-amber-500 text-white'
    },
    low: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: <Info className="w-6 h-6 text-blue-500" />,
      text: 'text-blue-500',
      badge: 'bg-blue-500 text-white'
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 space-y-10 animate-in fade-in duration-1000">
      
      {/* Header (Step 50) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
            Safety Center 
            {alerts.filter(a => a.status === 'unread').length > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-[10px] rounded-full animate-bounce">
                {alerts.filter(a => a.status === 'unread').length} NEW
              </span>
            )}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 font-medium mt-2">Personalized safety intelligence and vital sign monitoring</p>
        </div>
        <div className="flex gap-4">
           <button 
              onClick={markAllRead}
              className="px-6 py-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-emerald-500/50 transition-all shadow-xl"
           >
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Fully Resolved
           </button>
        </div>
      </div>

      {/* Search & Sort (Step 55) */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
         <div className="relative flex-1 group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
            <input 
               type="text" 
               placeholder="Search protocol history..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl py-5 pl-16 pr-8 text-sm outline-none shadow-xl focus:border-emerald-500/50 transition-all font-medium"
            />
         </div>
         <div className="flex gap-4 p-1.5 bg-gray-100 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800 rounded-2xl shrink-0">
            <button 
              onClick={() => setSortOrder('newest')}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortOrder === 'newest' ? 'bg-white dark:bg-gray-800 text-emerald-500' : 'text-gray-600 dark:text-gray-300'}`}
            >
               Latest
            </button>
            <button 
              onClick={() => setSortOrder('oldest')}
              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortOrder === 'oldest' ? 'bg-white dark:bg-gray-800 text-emerald-500' : 'text-gray-600 dark:text-gray-300'}`}
            >
               Oldest first
            </button>
         </div>
         <button 
           onClick={() => window.location.href='/alerts/settings'}
           className="p-5 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl text-gray-600 dark:text-gray-300 hover:text-emerald-500 transition-all shadow-xl"
         >
            <Settings2 className="w-6 h-6" />
         </button>
      </div>

      {/* Triage Tabs (Step 55) */}
      <div className="flex gap-4 p-1.5 bg-gray-100 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-[2rem] w-full overflow-x-auto scrollbar-hide">
         {[
           { id: 'unread', label: 'Unresolved', count: alerts.filter(a => a.status === 'unread').length },
           { id: 'critical', label: 'Major Alerts', count: alerts.filter(a => a.priority === 'critical' || a.priority === 'high').length },
           { id: 'all', label: 'History Hub', count: alerts.length }
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setSelectedAlert(null) || setActiveTab(tab.id)}
             className={`px-6 md:px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shrink-0 ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-md' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
           >
             {tab.label}
             {tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-lg text-[8px] bg-gray-100 dark:bg-gray-900 ${activeTab === tab.id ? 'text-emerald-500' : 'text-gray-600 dark:text-gray-300'}`}>{tab.count}</span>}
           </button>
         ))}
      </div>

      {/* Alerts Feed (Step 51-54) */}
      <div className="space-y-6">
        {filteredAlerts.length > 0 ? filteredAlerts.map((alert) => {
          const style = priorityStyles[alert.priority] || priorityStyles.low;
          return (
            <div 
              key={alert._id}
              onClick={() => {
                setSelectedAlert(alert);
                if (alert.status === 'unread') markRead(alert._id);
              }}
              className={`${style.bg} border p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.01] shadow-xl hover:shadow-${alert.priority === 'critical' ? 'red' : 'emerald'}-500/10`}
            >
              {/* Priority Accent */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${style.bg} blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 opacity-30`} />
              
              <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                 <div className="p-4 bg-white dark:bg-gray-950 rounded-[1.5rem] shadow-xl">
                    {style.icon}
                 </div>
                 
                 <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                       <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${style.badge}`}>
                          {alert.priority}
                       </span>
                       <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                          {new Date(alert.createdAt).toLocaleString()}
                       </span>
                    </div>
                    <h3 className={`text-xl font-black tracking-tight ${alert.status === 'unread' ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                       {alert.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-2xl">
                       {alert.description}
                    </p>
                 </div>

                 <div className="flex gap-3 mt-4 md:mt-0">
                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         dismissAlert(alert._id);
                       }}
                       className="p-4 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                       <Trash2 className="w-5 h-5" />
                    </button>
                    <button 
                       className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${alert.status === 'unread' ? 'bg-emerald-600 text-white shadow-lg lg:group-hover:translate-x-1' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
                    >
                       Full Protocol <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
          );
        }) : (
          <div className="py-24 text-center bg-gray-50 dark:bg-gray-950/20 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-gray-800 animate-in zoom-in duration-700">
             <div className="p-10 bg-white dark:bg-gray-950 rounded-full w-max mx-auto mb-8 shadow-2xl">
                <ShieldAlert className="w-20 h-20 text-emerald-500/10" />
             </div>
             <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Safety Matrix Baseline</h3>
             <p className="text-gray-700 dark:text-gray-300 max-w-sm mx-auto mt-3 font-medium text-lg leading-relaxed">System monitoring active. No security or biological deviations detected in current state.</p>
          </div>
        )}
      </div>

      {/* Detail Modal (Step 56) */}
      {selectedAlert && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 pt-20 md:pt-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 md:pl-72">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[3rem] w-full max-w-2xl max-h-[90vh] shadow-3xl overflow-y-auto animate-in zoom-in slide-in-from-bottom-12 duration-500">
               <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-emerald-500/10 rounded-2xl">
                        <Bell className="w-6 h-6 text-emerald-500" />
                     </div>
                     <div>
                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Security Analysis</h4>
                        <p className="text-[10px] text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest leading-none">Diagnostic Ref-ID: {selectedAlert._id.slice(-8)}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                     <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </button>
               </div>

               <div className="p-10 space-y-8">
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${priorityStyles[selectedAlert.priority].badge}`}>
                           {selectedAlert.priority}
                        </span>
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{new Date(selectedAlert.createdAt).toLocaleDateString()} at {new Date(selectedAlert.createdAt).toLocaleTimeString()}</span>
                     </div>
                     <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-tight">
                        {selectedAlert.title}
                     </h2>
                     <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                        {selectedAlert.description}
                     </p>
                  </div>

                  <div ref={protocolRef} className="space-y-6 scroll-mt-28">
                  <div className="p-6 bg-gray-50 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800 rounded-3xl space-y-4">
                     <h5 className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-[0.3em]">AI Protocol Recommendations</h5>
                     <ul className="space-y-3">
                        {selectedAlert.priority === 'critical' ? (
                          <>
                            <li className="flex items-start gap-3 text-sm font-bold text-red-500">
                               <AlertOctagon className="w-5 h-5 shrink-0" /> Immediate physician follow-up required. Do not adjust medications without consulting your doctor.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-500">
                               <Heart className="w-5 h-5 shrink-0 text-red-400" /> Monitor vitals closely every 2 hours until stabilized.
                            </li>
                          </>
                        ) : selectedAlert.priority === 'high' ? (
                          <>
                            <li className="flex items-start gap-3 text-sm font-bold text-orange-500">
                               <AlertTriangle className="w-5 h-5 shrink-0" /> Schedule a physician consultation within 24-48 hours.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-500">
                               <Activity className="w-5 h-5 shrink-0 text-orange-400" /> Log vitals more frequently to track trends.
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start gap-3 text-sm font-bold text-emerald-500">
                               <CheckCircle2 className="w-5 h-5 shrink-0" /> Routine monitoring active. Follow log interval guidance.
                            </li>
                            <li className="flex items-start gap-3 text-sm text-gray-500">
                               <Info className="w-5 h-5 shrink-0 text-blue-400" /> Keep logging vitals at regular intervals for better AI predictions.
                            </li>
                          </>
                        )}
                        <li className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                           <RefreshCw className="w-5 h-5 shrink-0" /> System will auto-reevaluate on next biometric log.
                        </li>
                     </ul>
                  </div>

                  {/* Full Protocol (Mitigations + Precautions) */}
                  {(protocolLoading || protocolData || protocolError) && (
                    <div className="p-6 bg-white dark:bg-gray-950/40 border border-gray-100 dark:border-gray-800 rounded-3xl space-y-4">
                      <h5 className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-[0.3em]">Full Protocol</h5>
                      {protocolLoading && (
                        <div className="text-xs font-bold text-gray-500 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" /> Loading protocol steps...
                        </div>
                      )}
                      {protocolError && (
                        <div className="text-xs font-bold text-red-500 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> {protocolError}
                        </div>
                      )}
                      {protocolData && (
                        <div className="space-y-5">
                          {Array.isArray(protocolData.immediateActions) && protocolData.immediateActions.length > 0 && (
                            <div>
                              <div className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2">Immediate actions</div>
                              <ul className="space-y-2">
                                {protocolData.immediateActions.slice(0, 6).map((s, i) => (
                                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(protocolData.precautions) && protocolData.precautions.length > 0 && (
                            <div>
                              <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-2">Precautions</div>
                              <ul className="space-y-2">
                                {protocolData.precautions.slice(0, 6).map((s, i) => (
                                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {protocolData.whenToSeeDoctor && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-sm text-amber-700 dark:text-amber-300 font-bold">
                              {protocolData.whenToSeeDoctor}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                  <div className="flex gap-4 items-center">
                      <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">Relevance Feedback</span>
                      <button className="p-2 bg-gray-50 dark:bg-gray-950 rounded-lg hover:text-emerald-500 transition-colors"><ThumbsUp className="w-4 h-4" /></button>
                      <button className="p-2 bg-gray-50 dark:bg-gray-950 rounded-lg hover:text-red-500 transition-colors"><ThumbsDown className="w-4 h-4" /></button>
                  </div>
               </div>

               <div className="p-10 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(getProtocolRoute(selectedAlert));
                      setSelectedAlert(null);
                    }}
                    className="flex-1 min-w-[140px] py-5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-black rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all uppercase tracking-widest text-xs"
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const query = getDoctorSearchQuery(selectedAlert);
                      const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${query} near me`)}`;
                      window.open(mapUrl, '_blank');
                    }}
                    className="px-8 py-5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-200 font-black rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500/40 hover:text-emerald-500 transition-all uppercase tracking-widest text-xs"
                  >
                    Contact Doctor
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      dismissAlert(selectedAlert._id);
                    }}
                    className="px-10 py-5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black rounded-2xl border border-gray-100 dark:border-gray-700 hover:text-red-500 transition-all uppercase tracking-widest text-xs"
                  >
                    Archive
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default Alerts;


