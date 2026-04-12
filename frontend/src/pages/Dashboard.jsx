import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { Activity, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, Cpu, ThumbsUp, ThumbsDown, Download, Scan, Trash2 } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import BodyScan3D from '../components/BodyScan3D';
import { useGoogleLogin } from '@react-oauth/google';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const GaugeChart = ({ score, color, label }) => {
  const { theme } = useTheme();
  const data = [{ name: label, value: score, fill: color }];
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full h-48 relative transition-colors duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" cy="50%" 
          innerRadius="70%" outerRadius="100%" 
          barSize={10} 
          data={data} 
          startAngle={180} endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar minAngle={15} background={{ fill: theme === 'dark' ? '#1f2937' : '#e5e7eb' }} clockWise={false} dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{score}%</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useUser();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [feedbackStatus, setFeedbackStatus] = useState({}); // context -> true/false

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports/${user.id}`);
      if (res.data.status === 'success') {
        setReport(res.data.data);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Error fetching report:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchReport();
  }, [user]);

  const generateReport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/ai/generate-report`, { clerkId: user.id });
      if (res.data.status === 'success') {
        setReport(res.data.data);
      }
    } catch (err) {
      setError("Analysis failed. The AI engine might be busy.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const syncGoogleFit = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setSyncing(true);
      try {
        const res = await axios.post(`${API_URL}/fitness/steps`, { 
          clerkId: user.id, 
          accessToken: tokenResponse.access_token 
        });
        if (res.data.status === 'success') fetchReport();
      } catch (err) {
        console.error("Fitness sync failed:", err);
      } finally {
        setSyncing(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/fitness.activity.read'
  });

  const handleFeedback = async (context, rating, query, response) => {
    setFeedbackStatus(prev => ({...prev, [context]: true}));
    try {
      await axios.post(`${API_URL}/feedback`, { clerkId: user.id, context, rating, query, response });
    } catch (err) {
      console.error("Feedback failed:", err);
    }
  };

  const handleDeleteData = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all your health data? This cannot be undone.")) return;
    try {
      const res = await axios.delete(`${API_URL}/user/${user.id}`);
      if (res.data.status === 'success') {
         window.location.reload();
      }
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(`${API_URL}/feedback/export/${user.id}`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `VaidyaSetu_Health_Export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  }

  // Determine if profile is nested or flat for backward compatibility/defensiveness
  const getProfileVal = (field) => {
    const val = report?.userProfile?.[field];
    if (val && typeof val === 'object' && val.value !== undefined) return val.value;
    return val;
  };

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto animate-fade-in">
         <div className="w-48 h-48 mb-8 opacity-80 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-full border-4 border-emerald-500/10 dark:border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <Cpu className="w-24 h-24 text-emerald-500 animate-pulse" />
         </div>
         <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Profile Synchronization Complete</h1>
         <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
           Your biometric baseline is ready. Proceed to activate the VaidyaSetu AI core and generate your personalized health matrix.
         </p>
         
         <button 
           onClick={generateReport}
           disabled={generating}
           className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center shadow-[0_0_20px_rgba(16,185,129,0.3)]"
         >
           {generating ? (
             <><RefreshCw className="w-5 h-5 mr-3 animate-spin" /> Analyzing Baseline...</>
           ) : (
             <><Activity className="w-5 h-5 mr-3" /> Initiate Predictive Scan</>
           )}
         </button>
         {error && <p className="text-red-500 mt-4 text-sm bg-red-50 dark:bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}
      </div>
    );
  }

  // Helper to determine gauge color
  const getRiskColor = (score) => {
    if (score >= 70) return '#ef4444'; // Red
    if (score >= 40) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  };

  const stepCount = getProfileVal('steps') || 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome, {getProfileVal('name') || user?.fullName || 'User'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Health Ecosystem • Analysis completed on {report?.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-sm font-medium transition-all flex items-center text-gray-600 dark:text-gray-300 shadow-xl active:scale-95"
          >
             <Download className="w-4 h-4 mr-2" /> Export My Health Data
          </button>
          <button 
            onClick={handleDeleteData}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 hover:bg-red-600 hover:text-white rounded-lg text-sm font-medium transition-all flex items-center text-red-600 dark:text-red-500 shadow-xl active:scale-95"
          >
             <Trash2 className="w-4 h-4 mr-2" /> Delete My Data
          </button>
          <button 
            onClick={generateReport}
            disabled={generating}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg text-sm font-medium transition-all flex items-center text-gray-600 dark:text-gray-300 disabled:opacity-50 shadow-xl active:scale-95"
          >
             <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin text-emerald-500' : ''}`} /> 
             {generating ? 'Processing...' : 'Regenerate Analysis Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Core Data */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Executive Summary */}
          <div className="bg-white dark:bg-gray-900/50 border border-emerald-200 dark:border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden transition-colors duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl rounded-full" />
            <h2 className="text-emerald-600 dark:text-emerald-400 font-semibold mb-3 flex items-center uppercase tracking-wide text-xs">
               <Activity className="w-4 h-4 mr-2" /> AI Diagnostic Summary
            </h2>
            <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed relative z-10">{report?.summary || "Summary text is missing from the database."}</p>
          </div>

          {/* Risk Gauges */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4 text-lg">Predictive Risk Vectors</h3>
            <div className="grid grid-cols-3 gap-4">
              <GaugeChart score={report?.risk_scores?.diabetes || 0} color={getRiskColor(report?.risk_scores?.diabetes || 0)} label="Diabetes" />
              <GaugeChart score={report?.risk_scores?.hypertension || 0} color={getRiskColor(report?.risk_scores?.hypertension || 0)} label="Hypertension" />
              <GaugeChart score={report?.risk_scores?.anemia || 0} color={getRiskColor(report?.risk_scores?.anemia || 0)} label="Anemia" />
            </div>
          </div>

          {/* Targeted Advice */}
          <div className="space-y-4">
            <AdviceCard 
              label="Diabetes Insight" text={report?.diabetes_advice} 
              icon={<AlertTriangle className="w-6 h-6 text-fuchsia-500" />} 
              onFeedback={(r) => handleFeedback('Diabetes', r, 'Status', report?.diabetes_advice)}
              done={feedbackStatus['Diabetes']}
            />
            <AdviceCard 
              label="Hypertension Insight" text={report?.hypertension_advice} 
              icon={<Activity className="w-6 h-6 text-amber-500" />} 
              onFeedback={(r) => handleFeedback('Hypertension', r, 'Status', report?.hypertension_advice)}
              done={feedbackStatus['Hypertension']}
            />
            <AdviceCard 
              label="Anemia Insight" text={report?.anemia_advice} 
              icon={<ShieldAlert className="w-6 h-6 text-blue-500" />} 
              onFeedback={(r) => handleFeedback('Anemia', r, 'Status', report?.anemia_advice)}
              done={feedbackStatus['Anemia']}
            />
          </div>

        </div>

        {/* Right Column - Secondary Data */}
        <div className="space-y-6">
           {/* 3D Holographic Bio-Matrix Card */}
           <div className="bg-white dark:bg-[#030712] border border-gray-200 dark:border-gray-800 rounded-[2.5rem] min-h-[520px] relative overflow-hidden group hover:border-emerald-500/20 transition-all shadow-2xl backdrop-blur-3xl">
               {/* Background Grid and Atmosphere */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50 dark:opacity-100" />
               <h3 className="absolute top-6 left-6 text-emerald-600/40 dark:text-emerald-400/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center z-20">
                  <Scan className="w-4 h-4 mr-2" /> Predictive Bio-Matrix
               </h3>
               
               <div className="w-full h-[520px] relative z-10">
                  <BodyScan3D 
                    riskScore={Math.max(
                      report?.risk_scores?.diabetes || 0, 
                      report?.risk_scores?.hypertension || 0, 
                      report?.risk_scores?.anemia || 0
                    )} 
                  />
               </div>
           </div>

           {/* Step Tracker Placeholder */}
           <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl group hover:border-emerald-500/30 transition-all shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-gray-900 dark:text-white font-semibold flex items-center">
                   <Activity className="w-5 h-5 text-emerald-500 mr-2" /> Step Tracker
                </h3>
                <button 
                  onClick={() => syncGoogleFit()} disabled={syncing}
                  className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-3 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest font-bold transition-all disabled:opacity-50"
                >
                   {syncing ? 'Syncing...' : 'Sync Fit'}
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stepCount}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Daily Steps</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-500 font-bold">{Math.round((stepCount / 8000) * 100)}%</div>
                    <div className="text-[10px] text-gray-500 uppercase">Goal: 8,000</div>
                  </div>
                </div>
                
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (stepCount / 8000) * 100)}%` }}
                  />
                </div>
              </div>
           </div>

           {/* General Tips */}
           <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-xl transition-colors">
              <h3 className="text-gray-900 dark:text-white font-semibold mb-4 flex items-center">
                 <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" /> Lifestyle Routine
              </h3>
              <div className="space-y-3 relative">
                 {(Array.isArray(report?.general_tips) ? report?.general_tips : (report?.general_tips || '').split('\n')).filter(t => t && t.trim()).map((tip, i) => (
                    <div key={i} className="flex items-start group">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 shrink-0 group-hover:scale-125 transition-transform" />
                       <span className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{tip.replace(/^-/,'').trim()}</span>
                    </div>
                 ))}                  {!feedbackStatus['Lifestyle'] ? (
                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                       <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mr-2">Helpful?</span>
                       <button onClick={() => handleFeedback('Lifestyle', 'up', 'General Tips', report?.general_tips)} className="p-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-500 hover:text-white dark:hover:text-emerald-400 rounded-lg transition-all active:scale-95"><ThumbsUp className="w-4 h-4" /></button>
                       <button onClick={() => handleFeedback('Lifestyle', 'down', 'General Tips', report?.general_tips)} className="p-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-500 hover:text-white dark:hover:text-red-400 rounded-lg transition-all active:scale-95"><ThumbsDown className="w-4 h-4" /></button>
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800"><CheckCircle className="w-3 h-3" /> Feedback Received</div>
                 )}

              </div>
           </div>

           {/* Medical Disclaimer */}
           <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-xl text-center">
              <p className="text-red-400/80 text-[10px] uppercase tracking-wider leading-relaxed">
                 {report.disclaimer}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

const AdviceCard = ({ label, text, icon, onFeedback, done }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl flex items-start group hover:border-emerald-500/20 transition-all shadow-sm hover:shadow-md">
     <div className="mr-5 shrink-0 mt-1">{icon}</div>
     <div className="flex-1">
        <h4 className="text-gray-900 dark:text-white font-semibold mb-1">{label}</h4>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">{text || "No advice generated."}</p>
        {!done ? (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600 mr-2">Helpful?</span>
             <button onClick={() => onFeedback('up')} className="p-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-400 hover:text-white dark:hover:text-emerald-500 rounded-lg transition-all active:scale-95"><ThumbsUp className="w-4 h-4" /></button>
             <button onClick={() => onFeedback('down')} className="p-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-white dark:hover:text-red-400 rounded-lg transition-all active:scale-95"><ThumbsDown className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 animate-in zoom-in"><CheckCircle className="w-3 h-3" /> Feedback Received</div>
        )}
     </div>
  </div>
);

export default Dashboard;
