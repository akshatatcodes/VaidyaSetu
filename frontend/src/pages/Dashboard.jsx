import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { Activity, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const GaugeChart = ({ score, color, label }) => {
  const data = [{ name: label, value: score, fill: color }];
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-800 rounded-2xl w-full h-48 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" cy="50%" 
          innerRadius="70%" outerRadius="100%" 
          barSize={10} 
          data={data} 
          startAngle={180} endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar minAngle={15} background={{ fill: '#1f2937' }} clockWise={false} dataKey="value" cornerRadius={10} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
        <span className="text-2xl font-bold text-white">{score}%</span>
        <span className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{label}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useUser();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-2xl mx-auto animate-fade-in">
         <div className="w-48 h-48 mb-8 opacity-80 flex items-center justify-center bg-gray-900/50 rounded-full border-4 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <Cpu className="w-24 h-24 text-emerald-500 animate-pulse" />
         </div>
         <h1 className="text-4xl font-bold text-white mb-4">Profile Synchronization Complete</h1>
         <p className="text-gray-400 mb-8 text-lg">
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
         {error && <p className="text-red-400 mt-4 text-sm bg-red-500/10 px-4 py-2 rounded-lg">{error}</p>}
      </div>
    );
  }

  // Helper to determine gauge color
  const getRiskColor = (score) => {
    if (score >= 70) return '#ef4444'; // Red
    if (score >= 40) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Health Ecosystem</h1>
          <p className="text-gray-400">Analysis completed on {new Date(report.createdAt).toLocaleDateString()}</p>
        </div>
        <button 
          onClick={generateReport}
          disabled={generating}
          className="px-4 py-2 bg-gray-900 border border-gray-800 hover:border-emerald-500 hover:text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center text-gray-300 disabled:opacity-50"
        >
           <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin text-emerald-500' : ''}`} /> 
           {generating ? 'Processing...' : 'Regenerate Analysis Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Core Data */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Executive Summary */}
          <div className="bg-gray-900/50 border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
            <h2 className="text-emerald-400 font-semibold mb-3 flex items-center uppercase tracking-wide text-xs">
               <Activity className="w-4 h-4 mr-2" /> AI Diagnostic Summary
            </h2>
            <p className="text-gray-200 text-lg leading-relaxed relative z-10">{report?.summary || "Summary text is missing from the database."}</p>
          </div>

          {/* Risk Gauges */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Predictive Risk Vectors</h3>
            <div className="grid grid-cols-3 gap-4">
              <GaugeChart score={report?.risk_scores?.diabetes || 0} color={getRiskColor(report?.risk_scores?.diabetes || 0)} label="Diabetes" />
              <GaugeChart score={report?.risk_scores?.hypertension || 0} color={getRiskColor(report?.risk_scores?.hypertension || 0)} label="Hypertension" />
              <GaugeChart score={report?.risk_scores?.anemia || 0} color={getRiskColor(report?.risk_scores?.anemia || 0)} label="Anemia" />
            </div>
          </div>

          {/* Targeted Advice */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-start">
               <AlertTriangle className="w-6 h-6 text-fuchsia-500 mr-4 shrink-0 mt-1" />
               <div>
                  <h4 className="text-white font-medium mb-1">Diabetes Insight</h4>
                  <p className="text-gray-400 text-sm">{report?.diabetes_advice || "No advice generated."}</p>
               </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-start">
               <Activity className="w-6 h-6 text-amber-500 mr-4 shrink-0 mt-1" />
               <div>
                  <h4 className="text-white font-medium mb-1">Hypertension Insight</h4>
                  <p className="text-gray-400 text-sm">{report?.hypertension_advice || "No advice generated."}</p>
               </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-start">
               <ShieldAlert className="w-6 h-6 text-blue-500 mr-4 shrink-0 mt-1" />
               <div>
                  <h4 className="text-white font-medium mb-1">Anemia Insight</h4>
                  <p className="text-gray-400 text-sm">{report?.anemia_advice || "No advice generated."}</p>
               </div>
            </div>
          </div>

        </div>

        {/* Right Column - Secondary Data */}
        <div className="space-y-6">
           {/* Visualizer Simulation (Body Scan Placeholder) */}
           <div className="bg-[#0b1221] border border-gray-800 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group hover:border-emerald-500/20 transition-all">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
               <h3 className="absolute top-6 left-6 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center">
                  <Cpu className="w-4 h-4 mr-2" /> Predictive Body Scan
               </h3>
               <div className="w-48 h-48 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-emerald-500/5 rounded-full animate-ping delay-100" />
                  <div className="absolute inset-4 bg-emerald-500/10 rounded-full animate-ping delay-300" />
                  <Activity className="w-20 h-20 text-emerald-400/50 relative z-10" />
               </div>
               <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest mt-4">
                  Scanner Standby
               </div>
           </div>

           {/* Step Tracker Placeholder */}
           <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl group hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-semibold flex items-center">
                   <Activity className="w-5 h-5 text-emerald-500 mr-2" /> Step Tracker
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">Connected</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-3xl font-bold text-white tracking-tight">4,821</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Daily Steps</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-500 font-bold">60%</div>
                    <div className="text-[10px] text-gray-500 uppercase">Goal: 8,000</div>
                  </div>
                </div>
                
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[60%] shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000" />
                </div>
              </div>
           </div>

           {/* General Tips */}
           <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                 <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" /> Lifestyle Routine
              </h3>
              <div className="space-y-3">
                 {(Array.isArray(report?.general_tips) ? report?.general_tips : (report?.general_tips || '').split('\n')).filter(t => t && t.trim()).map((tip, i) => (
                    <div key={i} className="flex items-start group">
                       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 mr-3 shrink-0 group-hover:scale-125 transition-transform" />
                       <span className="text-gray-400 text-sm leading-relaxed">{tip.replace(/^-/,'').trim()}</span>
                    </div>
                 ))}
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

export default Dashboard;
