import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Plus, Heart, Activity, Scale, Footprints, 
  Moon, Droplets, ArrowUp, ArrowDown, Minus,
  AlertCircle, CheckCircle2, RefreshCw, Calendar,
  ChevronRight, Download, Trash2, Filter, Trash, FileText,
  FlaskConical, Trophy, Zap, Thermometer, Wind, Stethoscope
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { generateVitalsPDF } from '../utils/pdfGenerator';
import { 
  BloodPressureChart, GlucoseChart, WeightBMIChart, StepsChart, SleepPatternChart 
} from '../components/VitalsCharts';
import VitalsModals from '../components/VitalsModals';
import LabResultsModals from '../components/LabResultsModals';
import GoalsModals from '../components/GoalsModals';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const VitalCard = ({ title, value, unit, type, status, trend, timestamp, icon: Icon, onClick }) => {
  const getStatusColors = (s) => {
    switch (s?.toLowerCase()) {
      case 'normal': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'borderline': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'warning':
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20';
    }
  };

  const getTrendIcon = (t) => {
    if (t === 'up') return <ArrowUp className="w-3 h-3 text-red-500" />;
    if (t === 'down') return <ArrowDown className="w-3 h-3 text-emerald-500" />;
    return <Minus className="w-3 h-3 text-gray-600 dark:text-gray-300" />;
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-none dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/10 p-6 rounded-[2.5rem] hover:border-blue-100 dark:hover:border-emerald-500/40 transition-all duration-500 cursor-pointer group shadow-[0_10px_40px_rgba(35,60,111,0.06)] dark:shadow-none hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(35,60,111,0.1)] relative overflow-hidden"
    >
      <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-150" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${getStatusColors(status)} transition-colors`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColors(status)}`}>
          {status || 'No Data'}
        </div>
      </div>
      
      <div className="space-y-1 mb-4">
        <h3 className="text-[10px] text-slate-700 dark:text-gray-300 font-black uppercase tracking-widest">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            {value || '--'}
          </span>
          <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{unit}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-950">
        <div className="flex items-center gap-1">
          {getTrendIcon(trend)}
          <span className="text-[9px] font-bold text-slate-600 dark:text-gray-300 uppercase tracking-tighter">vs Last 7 days</span>
        </div>
        <div className="text-[9px] font-bold text-slate-600 dark:text-gray-300 uppercase tabular-nums">
           {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
        </div>
      </div>
    </div>
  );
};

const Vitals = () => {
  const { user } = useUser();
  const [demoUser] = useState({ id: 'demo_user_123', fullName: 'Demo Patient' });
  const activeUser = user || demoUser;
  const [vitals, setVitals] = useState({});
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [goals, setGoals] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [modal, setModal] = useState({ open: false, type: '' });
  const [labModalOpen, setLabModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const fetchVitals = async () => {
    try {
      const [latestRes, historyRes, reportRes, labRes, goalRes] = await Promise.all([
        axios.get(`${API_URL}/vitals/latest/${activeUser.id}`),
        axios.get(`${API_URL}/vitals/${activeUser.id}`),
        axios.get(`${API_URL}/reports/${activeUser.id}`).catch(() => ({ data: { status: 'error' } })),
        axios.get(`${API_URL}/lab-results/${activeUser.id}`),
        axios.get(`${API_URL}/goals/${activeUser.id}`)
      ]);
      
      if (latestRes.data.status === 'success') {
        const mapped = {};
        latestRes.data.data.forEach(v => mapped[v.type] = v);
        setVitals(mapped);
      }
      if (historyRes.data.status === 'success') setHistory(historyRes.data.data);
      if (reportRes.data.status === 'success') setReport(reportRes.data.data);
      if (labRes.data.status === 'success') setLabResults(labRes.data.data);
      if (goalRes.data.status === 'success') setGoals(goalRes.data.data);

    } catch (err) {
      console.error("Vitals fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeUser) fetchVitals();
  }, [activeUser]);

  const handleSaveVital = async (data) => {
    console.log("[Vitals] Save clicked with payload:", data);
    setSaving(true);
    try {
      let finalValue = data.value;
      let finalType = modal.type;
      if (modal.type === 'bp') finalType = 'blood_pressure';
      else if (modal.type === 'glucose') finalType = 'blood_glucose';
      else if (modal.type === 'sleep') finalType = 'sleep_duration';
      else if (modal.type === 'water') finalType = 'water_intake';
      else finalType = modal.type;
      
      if (modal.type === 'bp') {
         if (!data.systolic || !data.diastolic) {
             throw new Error("Systolic and Diastolic values are required.");
         }
         finalValue = { systolic: parseInt(data.systolic), diastolic: parseInt(data.diastolic) };
      }

      console.log("[Vitals] Derived Type:", finalType, "Derived Value:", finalValue);

      const requestPayload = {
        clerkId: activeUser.id,
        type: finalType,
        value: finalValue,
        unit: getUnit(modal.type),
        notes: data.notes || '',
        mealContext: data.context === 'bedtime' ? 'none' : data.context || 'none',
        source: 'manual'
      };

      console.log("[Vitals] Sending Axios POST to:", `${API_URL}/vitals`, "Body:", requestPayload);

      const res = await axios.post(`${API_URL}/vitals`, requestPayload);
      console.log("[Vitals] Save response:", res.data);

      if (res.data.status === 'success') {
        fetchVitals();
        setModal({ open: false, type: '' });
      }
    } catch (err) {
      console.error("Vital save failed", err);
      alert("Failed to save: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVital = async (id) => {
    if (!window.confirm("Delete this reading?")) return;
    try {
        await axios.delete(`${API_URL}/vitals/${id}`);
        fetchVitals();
    } catch (err) {
        console.error("Delete failed", err);
    }
  }

  const getUnit = (type) => {
    switch (type) {
      case 'bp': return 'mmHg';
      case 'glucose': return 'mg/dL';
      case 'weight': return 'kg';
      case 'water': return 'ml';
      case 'steps': return 'steps';
      case 'sleep': return 'hours';
      case 'heart_rate': return 'BPM';
      case 'body_temperature': return '°F';
      case 'oxygen_saturation': return '%';
      default: return '';
    }
  };

  const getStatus = (type, val) => {
    if (val === undefined || val === null) return 'No Data';
    if (type === 'blood_pressure') {
      if (val.systolic > 140 || val.diastolic > 90) return 'High';
      if (val.systolic > 120 || val.diastolic > 80) return 'Borderline';
      return 'Normal';
    }
    if (type === 'blood_glucose') {
      if (val > 140) return 'High';
      if (val > 100) return 'Borderline';
      return 'Normal';
    }
    if (type === 'sleep_duration') {
      if (val < 6) return 'Warning';
      if (val > 10) return 'Borderline';
      return 'Normal';
    }
    if (type === 'steps') {
      if (val > 8000) return 'Normal';
      if (val > 4000) return 'Borderline';
      return 'Warning';
    }
    if (type === 'heart_rate') {
      if (val > 100 || val < 60) return 'Warning';
      return 'Normal';
    }
    if (type === 'body_temperature') {
      if (val > 100.4) return 'High';
      if (val < 97) return 'Warning';
      return 'Normal';
    }
    if (type === 'oxygen_saturation') {
      if (val < 92) return 'Warning';
      if (val < 95) return 'Borderline';
      return 'Normal';
    }
    if (type === 'water_intake') {
      if (val >= 2500) return 'Normal';
      if (val >= 1500) return 'Borderline';
      return 'Warning';
    }
    return 'Normal';
  };

  const formatValue = (type, val) => {
    if (!val) return '--';
    if (type === 'blood_pressure') return `${val.systolic}/${val.diastolic}`;
    return val;
  }

  const handleExportJSON = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile/export/${user.id}`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `VaidyaSetu_Vitals_Export_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleExportPDF = () => {
    if (!history || history.length === 0) {
       alert("No vitals data available to export.");
       return;
    }
    generateVitalsPDF(
      activeUser?.fullName || 'Valued User',
      history,
      labResults,
      formatValue,
      getStatus
    );
  };

  const calculateHbA1c = () => {
    const glucoseLogs = history.filter(h => h.type === 'blood_glucose');
    if (glucoseLogs.length < 5) return null;
    const avg = glucoseLogs.reduce((acc, curr) => acc + curr.value, 0) / glucoseLogs.length;
    return ((avg + 46.7) / 28.7).toFixed(1);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-12 animate-pulse p-4">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-4 w-96 bg-gray-100 dark:bg-gray-900 rounded-lg" />
          </div>
          <div className="flex gap-4">
            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="h-12 w-32 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-8">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-900 rounded-[2.5rem]" />)}
        </div>
        <div className="h-96 bg-gray-100 dark:bg-gray-900 rounded-[2.5rem]" />
      </div>
    );
  }

  const calculateGoalProgress = (goal) => {
    const typeMapping = {
       weight_goal: 'weight',
       daily_steps: 'steps',
       bp_target: 'blood_pressure',
       glucose_control: 'blood_glucose',
       daily_water: 'water'
    };
    const vitalKey = typeMapping[goal.goalType] || goal.goalType;
    const latestValue = vitals[vitalKey]?.value;
    if (!latestValue) return 0;
    
    // For weight/glucose/pressure, we usually want to LOWER the value 
    // For steps/water we want to INCREASE it.
    if (['daily_steps', 'daily_water'].includes(goal.goalType)) {
       return Math.min(100, (latestValue / goal.targetValue) * 100);
    } else {
       // Calculation for "descending" goals (weight/BP)
       const valueToCompare = typeof latestValue === 'object' ? latestValue.systolic : latestValue;
       const diff = Math.abs(valueToCompare - goal.targetValue);
       return Math.max(0, 100 - (diff / goal.targetValue) * 100);
    }
  };
  const hba1c = calculateHbA1c();

  const filteredHistory = activeTab === 'all' 
    ? history 
    : history.filter(h => h.type === activeTab);

  const risks = report?.risk_scores || { diabetes: 0, hypertension: 0, anemia: 0 };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
      
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Health Timeline</h1>
          <p className="text-slate-600 dark:text-gray-300 font-medium text-lg">Monitoring biological constants and metabolic trends</p>
        </div>
        <div className="flex gap-4">
           <button 
              onClick={handleExportJSON}
              className="px-6 py-3 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:border-emerald-500/50 transition-all shadow-xl text-gray-600 dark:text-gray-300 hover:text-emerald-500"
           >
              <Download className="w-5 h-5" /> Export JSON
           </button>
           <button 
              onClick={handleExportPDF}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl"
           >
              <FileText className="w-5 h-5" /> Download PDF Report
           </button>
        </div>
      </div>

      {/* HbA1c Insight (Step 28 Extra) */}
      {hba1c && (
        <div className="bg-emerald-500 p-8 rounded-[2.5rem] flex items-center justify-between text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
           <div className="relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Glycemic Stability Engine</h4>
              <p className="text-3xl font-black tracking-tighter">Your estimated HbA1c is <span className="underline decoration-4 decoration-white/30 underline-offset-8">{hba1c}%</span></p>
              <p className="text-xs font-bold mt-4 opacity-70 italic max-w-md">Estimated based on your recent 90-day glucose trends. Always consult a lab-verified A1c test for clinical diagnosis.</p>
           </div>
           <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 hidden md:block">
              <Zap className="w-10 h-10 animate-pulse" />
           </div>
        </div>
      )}

      {/* Condition-Specific Tracker Cards (Step 30) */}
      {(risks.diabetes > 60 || risks.hypertension > 60) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-6 duration-700">
           {risks.diabetes > 60 && (
             <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-3xl rounded-full" />
                <div className="flex items-center gap-4 mb-4 relative z-10">
                   <div className="p-3 bg-fuchsia-500/20 rounded-2xl">
                      <Activity className="w-6 h-6 text-fuchsia-500" />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-white">Diabetes Risk Protocol</h4>
                      <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-widest leading-relaxed">Regular Glucose Monitoring Advised</p>
                   </div>
                </div>
                <button 
                  onClick={() => setModal({open: true, type: 'glucose'})}
                  className="w-full py-4 bg-fuchsia-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-fuchsia-500/20 active:scale-95 transition-all"
                >
                  Log Glucose Now
                </button>
             </div>
           )}
           {risks.hypertension > 60 && (
             <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                <div className="flex items-center gap-4 mb-4 relative z-10">
                   <div className="p-3 bg-amber-500/20 rounded-2xl">
                      <Heart className="w-6 h-6 text-amber-500" />
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-white">Hypertension Guard</h4>
                      <p className="text-xs text-amber-400 font-bold uppercase tracking-widest leading-relaxed">BP Stability Monitoring Active</p>
                   </div>
                </div>
                <button 
                  onClick={() => setModal({open: true, type: 'bp'})}
                  className="w-full py-4 bg-amber-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Log Blood Pressure
                </button>
             </div>
           )}
        </div>
      )}

      {/* Quick Entry Bar (Step 16) */}
      <div className="p-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 min-w-max pb-4">
          {[
            { id: 'bp', icon: Heart, label: 'Blood Pressure', color: 'text-rose-500' },
            { id: 'glucose', icon: Activity, label: 'Glucose Level', color: 'text-amber-500' },
            { id: 'heart_rate', icon: Stethoscope, label: 'Heart Rate', color: 'text-pink-500' },
            { id: 'weight', icon: Scale, label: 'Current Weight', color: 'text-blue-500' },
            { id: 'steps', icon: Footprints, label: 'Daily Steps', color: 'text-emerald-500' },
            { id: 'sleep', icon: Moon, label: 'Sleep Tracker', color: 'text-indigo-500' },
            { id: 'water', icon: Droplets, label: 'Water Log', color: 'text-cyan-500' },
            { id: 'body_temperature', icon: Thermometer, label: 'Body Temp', color: 'text-orange-500' },
            { id: 'oxygen_saturation', icon: Wind, label: 'SpO2 Level', color: 'text-teal-500' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setModal({ open: true, type: item.id })}
              className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-none dark:bg-gray-950/40 backdrop-blur-3xl border border-slate-100 dark:border-gray-800 rounded-3xl hover:border-blue-100 dark:hover:border-emerald-500/40 transition-all duration-500 hover:-translate-y-1 shadow-[0_8px_30px_rgba(35,60,111,0.05)] hover:shadow-[0_15px_40px_rgba(35,60,111,0.08)] dark:shadow-none group"
            >
              <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
              <span className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Log {item.label}</span>
              <Plus className="w-4 h-4 text-emerald-500 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="space-y-12">
        <div className="flex border-b border-gray-100 dark:border-gray-800">
           {['overview', 'trends', 'labs'].map(t => (
             <button
               key={t}
               onClick={() => setActiveTab(t)}
               className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === t ? 'text-emerald-500' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
             >
               {t}
               {activeTab === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-full" />}
             </button>
           ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500">
             {/* Summary Grid (Step 23) */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <VitalCard 
                  title="Blood Pressure" 
                  value={formatValue('blood_pressure', vitals.blood_pressure?.value)}
                  unit="mmHg"
                  icon={Heart} 
                  status={getStatus('blood_pressure', vitals.blood_pressure?.value)}
                  timestamp={vitals.blood_pressure?.timestamp}
                  onClick={() => setModal({ open: true, type: 'bp' })}
                />
                <VitalCard 
                  title="Blood Glucose" 
                  value={vitals.blood_glucose?.value}
                  unit="mg/dL"
                  icon={Activity} 
                  status={getStatus('blood_glucose', vitals.blood_glucose?.value)}
                  timestamp={vitals.blood_glucose?.timestamp}
                  onClick={() => setModal({ open: true, type: 'glucose' })}
                />
                <VitalCard 
                  title="Heart Rate" 
                  value={vitals.heart_rate?.value}
                  unit="BPM"
                  icon={Stethoscope} 
                  status={getStatus('heart_rate', vitals.heart_rate?.value)}
                  timestamp={vitals.heart_rate?.timestamp}
                  onClick={() => setModal({ open: true, type: 'heart_rate' })}
                />
                <VitalCard 
                  title="Oxygen Saturation" 
                  value={vitals.oxygen_saturation?.value}
                  unit="%"
                  icon={Wind} 
                  status={getStatus('oxygen_saturation', vitals.oxygen_saturation?.value)}
                  timestamp={vitals.oxygen_saturation?.timestamp}
                  onClick={() => setModal({ open: true, type: 'oxygen_saturation' })}
                />
                <VitalCard 
                  title="Sleep Quality" 
                  value={vitals.sleep_duration?.value}
                  unit="Hours"
                  icon={Moon} 
                  status={getStatus('sleep_duration', vitals.sleep_duration?.value)}
                  timestamp={vitals.sleep_duration?.timestamp}
                  onClick={() => setModal({ open: true, type: 'sleep' })}
                />
                <VitalCard 
                  title="Daily Steps" 
                  value={vitals.steps?.value}
                  unit="Steps"
                  icon={Footprints} 
                  status={getStatus('steps', vitals.steps?.value)}
                  timestamp={vitals.steps?.timestamp}
                  onClick={() => setModal({ open: true, type: 'steps' })}
                />
                <VitalCard 
                  title="Water Intake" 
                  value={vitals.water_intake?.value}
                  unit="ml"
                  icon={Droplets} 
                  status={getStatus('water_intake', vitals.water_intake?.value)}
                  timestamp={vitals.water_intake?.timestamp}
                  onClick={() => setModal({ open: true, type: 'water' })}
                />
                <VitalCard 
                  title="Body Temperature" 
                  value={vitals.body_temperature?.value}
                  unit="°F"
                  icon={Thermometer} 
                  status={getStatus('body_temperature', vitals.body_temperature?.value)}
                  timestamp={vitals.body_temperature?.timestamp}
                  onClick={() => setModal({ open: true, type: 'body_temperature' })}
                />
             </div>

             {/* Steps 45, 47: Goals & Devices (Overview) */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Active Goals Section (Step 45) */}
                <div className="space-y-6">
                   <div className="flex justify-between items-center px-4">
                      <h3 className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-widest flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-emerald-500" /> Active Milestones
                      </h3>
                      <button onClick={() => setGoalModalOpen(true)} className="text-[10px] font-black text-emerald-500 uppercase hover:underline">Customize Goals</button>
                   </div>
                    <div className="bg-white dark:bg-none dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/10 p-8 rounded-[2.5rem] shadow-[0_10px_40px_rgba(35,60,111,0.06)] hover:shadow-[0_20px_50px_rgba(35,60,111,0.1)] transition-all duration-500 dark:shadow-none space-y-6">
                      {goals.length > 0 ? goals.map(g => (
                        <div key={g._id} className="space-y-3">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
                              <span>{(g.goalType || 'Goal').replace('_', ' ')} Target</span>
                              <span className="text-emerald-500">{g.targetValue} {g.unit}</span>
                           </div>
                           <div className="w-full h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${calculateGoalProgress(g)}%` }} />
                           </div>
                           <div className="text-[8px] font-bold text-gray-600 dark:text-gray-300 text-right uppercase tracking-widest">{calculateGoalProgress(g).toFixed(0)}% Complete</div>
                        </div>
                      )) : (
                        <div className="text-center py-4">
                           <p className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest">No active goals configured.</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Connected Devices (Step 47) */}
                <div className="space-y-6">
                   <h3 className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-widest px-4 flex items-center gap-2">
                     <RefreshCw className="w-4 h-4 text-emerald-500" /> Sync Intelligence
                   </h3>
                   <div className="bg-white dark:bg-none dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/10 p-8 rounded-[2.5rem] shadow-[0_10px_40px_rgba(35,60,111,0.06)] hover:shadow-[0_20px_50px_rgba(35,60,111,0.1)] transition-all duration-500 dark:shadow-none">
                      <div className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-white/5">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-white dark:bg-gray-950 rounded-xl shadow-sm">
                               <RefreshCw className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                               <div className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">Google Fit Hub</div>
                               <div className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> 
                                  Operational • Connected
                               </div>
                            </div>
                         </div>
                         <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-emerald-500 transition-colors">Resync</button>
                      </div>
                      <div className="mt-4 flex items-center justify-between p-4 opacity-40 grayscale pointer-events-none">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                               <Zap className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <div className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-tighter">Apple Health (Disabled)</div>
                         </div>
                         <span className="text-[8px] font-bold text-gray-600 dark:text-gray-300 uppercase">Beta Testing</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Precision Logs Table */}
             <div className="space-y-8">
                <div className="bg-white dark:bg-none dark:bg-gray-950/40 backdrop-blur-2xl border border-slate-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_10px_40px_rgba(35,60,111,0.05)] dark:shadow-none relative">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">Biological Metric</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">Precision Value</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest text-center">Reference Unit</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">Trace Timestamp</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest text-right">Ops</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
                      {history.slice(0, 8).map((h) => {
                        const st = getStatus(h.type, typeof h.value === 'object' ? h.value.systolic : h.value);
                        const statusColor = st === 'Normal' ? 'text-emerald-500' : st === 'Borderline' ? 'text-amber-500' : st === 'High' || st === 'Warning' ? 'text-red-500' : 'text-gray-400';
                        return (
                        <tr key={h._id} className="group hover:bg-emerald-500/[0.04]">
                          <td className="px-8 py-6 text-sm font-bold text-slate-900 dark:text-white capitalize">{h.type.replace('_', ' ')}</td>
                          <td className="px-8 py-6 text-lg font-black text-emerald-600 dark:text-emerald-500">{formatValue(h.type, h.value)}</td>
                          <td className="px-8 py-6 text-center text-xs font-black text-slate-600 dark:text-gray-300">{h.unit}</td>
                          <td className="px-8 py-6 text-xs font-bold text-slate-700 dark:text-gray-300">{new Date(h.timestamp).toLocaleString()}</td>
                          <td className="px-8 py-6 text-right">
                            <button onClick={() => handleDeleteVital(h._id)} className="text-slate-600 dark:text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                  {history.length > 5 && (
                    <div className="p-4 text-center border-t border-gray-100 dark:border-gray-800">
                       <button onClick={() => setActiveTab('trends')} className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:underline">View Full Timeline</button>
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* BP TREND */}
                <TrendAnalysisCard 
                  title="Hemodynamic Stability" 
                  subtitle="Blood Pressure Variance"
                  icon={Heart}
                  color="rose"
                  data={history.filter(h => h.type === 'blood_pressure').reverse()}
                  Chart={BloodPressureChart}
                />
                {/* GLUCOSE TREND */}
                <TrendAnalysisCard 
                  title="Glycemic Control" 
                  subtitle="Metabolic Glucose Response"
                  icon={Activity}
                  color="amber"
                  data={history.filter(h => h.type === 'blood_glucose').reverse()}
                  Chart={GlucoseChart}
                  extra={`HbA1c Estimate: ${hba1c}%`}
                />
                {/* WEIGHT TREND */}
                <TrendAnalysisCard 
                  title="Body Morphology" 
                  subtitle="Weight & BMI Trajectory"
                  icon={Scale}
                  color="blue"
                  data={history.filter(h => h.type === 'weight').map(h => ({
                    ...h, 
                    bmi: (h.value / (( (report?.userProfile?.height?.value || 170) /100)**2)).toFixed(1) 
                  })).reverse()}
                  Chart={WeightBMIChart}
                />
                {/* STEPS TREND */}
                <TrendAnalysisCard 
                  title="Kinetic Activity" 
                  subtitle="Daily Movement & Goal Delta"
                  icon={Footprints}
                  color="emerald"
                  data={history.filter(h => h.type === 'steps').reverse()}
                  Chart={StepsChart}
                />
                {/* SLEEP TREND (Step 38) */}
                <TrendAnalysisCard 
                  title="Circadian Rest" 
                  subtitle="Sleep Duration & Quality"
                  icon={Moon}
                  color="indigo"
                  data={history.filter(h => h.type === 'sleep_duration').map(h => ({
                    ...h,
                    quality: h.notes ? parseInt(h.notes) : 0 // Fallback to notes if we store quality there
                  })).reverse()}
                  Chart={SleepPatternChart}
                />
             </div>
          </div>
        )}

        {activeTab === 'labs' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
                <div className="space-y-1">
                   <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Diagnostic Repository</h2>
                   <p className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest">Comparative Analysis of Laboratory Metrics</p>
                </div>
                <button 
                  onClick={() => setLabModalOpen(true)}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-3"
                >
                   <Plus className="w-5 h-5" /> Append New Report
                </button>
             </div>

             {labResults.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {labResults.map(lab => {
                    const isInRange = (() => {
                      if (!lab.referenceRange || typeof lab.resultValue !== 'number') return null;
                      const range = lab.referenceRange.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
                      if (range) return lab.resultValue >= parseFloat(range[1]) && lab.resultValue <= parseFloat(range[2]);
                      const lt = lab.referenceRange.match(/<\s*([\d.]+)/);
                      if (lt) return lab.resultValue < parseFloat(lt[1]);
                      const gt = lab.referenceRange.match(/>\s*([\d.]+)/);
                      if (gt) return lab.resultValue > parseFloat(gt[1]);
                      return null;
                    })();
                    const rangeColor = isInRange === true ? 'border-emerald-500/30 bg-emerald-500/5' : isInRange === false ? 'border-red-500/30 bg-red-500/5' : 'border-gray-100 dark:border-gray-800';
                    const valueTxt = isInRange === true ? 'text-emerald-500' : isInRange === false ? 'text-red-500' : 'text-emerald-500';
                    const rangeLabel = isInRange === true ? 'In Range' : isInRange === false ? 'Out of Range' : 'N/A';
                    const rangeLabelColor = isInRange === true ? 'text-emerald-500 bg-emerald-500/10' : isInRange === false ? 'text-red-500 bg-red-500/10' : 'text-gray-400 bg-gray-100 dark:bg-gray-800';
                    return (
                    <div key={lab._id} className={`bg-white dark:bg-gray-950 border ${rangeColor} p-8 rounded-[3rem] shadow-2xl space-y-6 group hover:border-emerald-500/20 transition-all`}>
                       <div className="flex justify-between items-start">
                          <div className="p-4 bg-emerald-500/10 rounded-2xl">
                             <FlaskConical className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${rangeLabelColor}`}>{rangeLabel}</span>
                             {lab.reportRef && <FileText className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />}
                          </div>
                       </div>
                       <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{lab.testName}</h4>
                          <div className="flex items-baseline gap-2 mt-2">
                             <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500">{lab.resultValue}</span>
                             <span className="text-[10px] font-bold text-slate-700 dark:text-gray-300 uppercase">{lab.unit}</span>
                          </div>
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-white/5">
                             <div className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Reference Range</div>
                             <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300">{lab.referenceRange || 'Not specified'} {lab.referenceRange ? lab.unit : ''}</div>
                             <div className="text-[8px] font-black text-slate-600 dark:text-gray-300 uppercase tracking-[0.2em] mb-1">Reference Alignment</div>
                             <div className="text-[11px] font-bold text-slate-600 dark:text-gray-300">{lab.referenceRange} {lab.unit}</div>
                          </div>
                          <div className="mt-6 flex items-center justify-between">
                             <span className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">{new Date(lab.sampleDate).toLocaleDateString()}</span>
                             <button className="text-[9px] font-black text-emerald-500 uppercase hover:underline flex items-center gap-1">History <ChevronRight className="w-3 h-3" /></button>
                          </div>
                       </div>
                    </div>
                  )})}
               </div>
             ) : (
               <div className="py-24 text-center bg-gray-50 dark:bg-gray-950/20 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                  <div className="p-8 bg-white dark:bg-gray-950 rounded-full w-max mx-auto mb-6 shadow-2xl">
                     <FileText className="w-16 h-16 text-emerald-500/20" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Biometric Intelligence Gap</h3>
                  <p className="text-gray-700 dark:text-gray-300 max-w-sm mx-auto mt-2 font-medium leading-relaxed">System awaiting clinical report input for precision mapping.</p>
               </div>
             )}
          </div>
        )}
      </div>

      <VitalsModals 
        modalType={modal.type} 
        isOpen={modal.open} 
        onClose={() => setModal({ open: false, type: '' })}
        onSave={handleSaveVital}
        saving={saving}
      />

      <LabResultsModals 
        isOpen={labModalOpen}
        onClose={() => setLabModalOpen(false)}
        onSave={fetchVitals}
        clerkId={user.id}
      />

      <GoalsModals 
         isOpen={goalModalOpen}
         onClose={() => setGoalModalOpen(false)}
         onSave={fetchVitals}
         clerkId={user.id}
      />

    </div>
  );
};

const TrendAnalysisCard = ({ title, subtitle, icon: Icon, color, data, Chart, extra }) => (
  <div className={`bg-white dark:bg-none dark:bg-white/5 backdrop-blur-3xl border border-slate-100 dark:border-white/10 p-8 rounded-[3rem] shadow-[0_10px_40px_rgba(35,60,111,0.06)] dark:shadow-none space-y-8 group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(35,60,111,0.1)] hover:border-${color}-100 dark:hover:border-${color}-500/30 relative overflow-hidden`}>
    <div className={`absolute top-[-20%] right-[-10%] w-64 h-64 bg-${color}-500/5 dark:bg-${color}-500/5 blur-[80px] rounded-full group-hover:bg-${color}-500/10 transition-colors duration-700 pointer-events-none`} />
    <div className="flex justify-between items-start relative z-10">
      <div className="flex items-center gap-4">
        <div className={`p-4 bg-${color}-500/10 rounded-3xl`}>
          <Icon className={`w-8 h-8 text-${color}-600 dark:text-${color}-500`} />
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <p className="text-[10px] text-slate-600 dark:text-gray-300 font-bold uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
      {extra && <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/10 animate-pulse">{extra}</div>}
    </div>
    
    <Chart data={data} />

    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-50 dark:border-gray-900">
       <div className="text-center">
          <div className="text-[9px] text-gray-700 dark:text-gray-300 uppercase font-black tracking-widest mb-1">Average</div>
          <div className="text-sm font-black text-gray-900 dark:text-white">
            {data.length ? (data.reduce((a, b) => a + (typeof b.value === 'object' ? b.value.systolic : b.value), 0) / data.length).toFixed(1) : '--'}
          </div>
       </div>
       <div className="text-center">
          <div className="text-[9px] text-gray-700 dark:text-gray-300 uppercase font-black tracking-widest mb-1">Max</div>
          <div className="text-sm font-black text-gray-900 dark:text-white">
            {data.length ? Math.max(...data.map(b => typeof b.value === 'object' ? b.value.systolic : b.value)) : '--'}
          </div>
       </div>
       <div className="text-center">
          <div className="text-[9px] text-gray-700 dark:text-gray-300 uppercase font-black tracking-widest mb-1">Readings</div>
          <div className="text-sm font-black text-emerald-500">{data.length}</div>
       </div>
    </div>
  </div>
);

export default Vitals;
