import React, { useState, useEffect } from 'react';
import { useUser } from '../clerkMock.jsx';
import axios from 'axios';
import { 
  User, Calendar, Scale, Activity, Droplets, Utensils, AlertTriangle, 
  History, Download, Edit3, ArrowRight, CheckCircle2, Info, Clock, 
  ChevronRight, Heart, Wind, Coffee, Moon, Flame, X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const HealthProfile = () => {
  const { user } = useUser();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(location.state?.toast || null);

  useEffect(() => {
    if (toastMessage) {
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (user) {
      axios.get(`${API_URL}/profile/${user.id}`)
        .then(res => {
          if (res.data.status === 'success') {
            setProfile(res.data.data);
            setDataQuality(res.data.dataQuality || null);
          } else {
            setError("Failed to load profile data.");
          }
        })
        .catch(err => {
          console.error('Error fetching profile:', err);
          setError("Connection error to server.");
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-white mb-4">{error}</h2>
      <button onClick={() => window.location.reload()} className="bg-emerald-600 px-6 py-2 rounded-lg text-white font-medium hover:bg-emerald-500 transition-colors">
        Retry
      </button>
    </div>
  );

  if (!profile) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold text-white mb-4">No Profile Found</h2>
      <Link to="/onboarding" className="bg-emerald-600 px-6 py-2 rounded-lg text-white font-medium hover:bg-emerald-500 transition-colors">
        Complete Onboarding
      </Link>
    </div>
  );

  const getRelativeTime = (date) => {
    if (!date) return 'Never';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Never';
      const diff = new Date() - d;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return 'Yesterday';
      return `${days} days ago`;
    } catch (e) {
      return 'Never';
    }
  };

  const SummarySection = ({ icon: Icon, title, children, lastUpdated }) => (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-700/50 rounded-lg group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
            <Icon size={20} />
          </div>
          <h3 className="font-semibold text-gray-200">{title}</h3>
        </div>
        {lastUpdated && (
          <div className="flex items-center text-[10px] text-gray-500 font-medium bg-gray-900/50 px-2 py-1 rounded-full uppercase tracking-wider">
            <Clock size={10} className="mr-1" /> {getRelativeTime(lastUpdated)}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );

  const DataItem = ({ label, value, unit = '' }) => (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">
        {value !== null && value !== undefined ? `${value} ${unit}` : '—'}
      </span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className="bg-emerald-900/95 border border-emerald-500/50 backdrop-blur-md px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(16,185,129,0.3)] flex items-center space-x-3">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-white font-medium text-sm">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="ml-4 text-emerald-400 hover:text-white transition-colors"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            My <span className="text-emerald-500">Health Profile</span>
          </h1>
          <p className="text-gray-400 mt-2 flex items-center">
            <Info size={16} className="mr-2 text-emerald-500" />
            Last detailed update: {getRelativeTime(profile.createdAt)}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link to="/history" className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-200 text-sm font-medium transition-all group">
            <History size={16} className="mr-2 group-hover:rotate-[-45deg] transition-transform" />
            View History
          </Link>
          <button className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-gray-200 text-sm font-medium transition-all">
            <Download size={16} className="mr-2" />
            Export Data
          </button>
          <Link to="/profile/edit" className="flex items-center px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all scale-100 hover:scale-[1.02] active:scale-95">
            <Edit3 size={16} className="mr-2" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Data Quality Indicator Card */}
      {dataQuality && (
        <div className="bg-gradient-to-r from-gray-800/80 to-gray-900 border border-emerald-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
            <div className="relative w-24 h-24 shrink-0">
               <svg className="w-full h-full transform -rotate-90">
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700" />
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                   strokeDasharray={2 * Math.PI * 40}
                   strokeDashoffset={2 * Math.PI * 40 * (1 - (dataQuality?.score || 0) / 100)}
                   className="text-emerald-500 transition-all duration-1000 ease-out" 
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-white">
                 {dataQuality?.score || 0}%
               </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  dataQuality?.label === 'Excellent' ? 'bg-emerald-500/20 text-emerald-400' : 
                  dataQuality?.label === 'Good' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {dataQuality?.label || 'Basic'} Profile
                </span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Data Quality Score</h2>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed">
                {dataQuality?.message || 'Update your profile to improve insights.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Biometrics */}
        <SummarySection icon={Scale} title="Basic Biometrics" lastUpdated={profile.weight?.lastUpdated}>
          <DataItem label="Age" value={profile.age?.value} unit="years" />
          <DataItem label="Gender" value={profile.gender?.value} />
          <DataItem label="Height" value={profile.height?.value} unit="cm" />
          <DataItem label="Weight" value={profile.weight?.value} unit="kg" />
          <div className="pt-2 border-t border-gray-700/50 mt-2">
             <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Calculated BMI</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  profile.bmi?.value && profile.bmi.value > 0 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-gray-700 text-gray-500'
                }`}>
                  {profile.bmi?.value ? Number(profile.bmi.value).toFixed(1) : '—'} ({profile.bmiCategory?.value || 'N/A'})
                </span>
             </div>
          </div>
        </SummarySection>

        {/* Lifestyle */}
        <SummarySection icon={Activity} title="Lifestyle & Habits" lastUpdated={profile.activityLevel?.lastUpdated}>
          <DataItem label="Activity Level" value={profile.activityLevel?.value} />
          <DataItem label="Sleep Quality" value={profile.sleepHours?.value} unit="hours" />
          <DataItem label="Stress Level" value={profile.stressLevel?.value} />
          <DataItem label="Smoking" value={profile.isSmoker?.value ? 'Active' : 'Non-smoker'} />
          <DataItem label="Alcohol" value={profile.alcoholConsumption?.value} />
        </SummarySection>

        {/* Diet */}
        <SummarySection icon={Utensils} title="Diet & Nutrition" lastUpdated={profile.dietType?.lastUpdated}>
          <DataItem label="Diet Type" value={profile.dietType?.value} />
          <DataItem label="Sugar Intake" value={profile.sugarIntake?.value} />
          <DataItem label="Salt Intake" value={profile.saltIntake?.value} />
          <DataItem label="Junk Food" value={profile.junkFoodFrequency?.value} />
          <div className="flex gap-2 mt-2">
             {profile.eatsLeafyGreens?.value && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Leafy Greens</span>}
             {profile.eatsFruits?.value && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">Daily Fruits</span>}
          </div>
        </SummarySection>

        {/* Allergies & Current Conditions */}
        <SummarySection icon={AlertTriangle} title="Allergies & Medical" lastUpdated={profile.allergies?.lastUpdated}>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Allergies</p>
              <div className="flex flex-wrap gap-2">
                {profile.allergies?.value?.length > 0 ? profile.allergies.value.map(a => (
                  <span key={a} className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-lg border border-red-500/20">{a}</span>
                )) : <span className="text-gray-500 text-sm italic">None declared</span>}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Conditions</p>
              <div className="flex flex-wrap gap-2">
                {profile.medicalHistory?.value?.length > 0 ? profile.medicalHistory.value.map(c => (
                  <span key={c} className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded-lg border border-blue-500/20">{c}</span>
                )) : <span className="text-gray-500 text-sm italic">No history provided</span>}
              </div>
            </div>
            {profile.otherConditions?.value && (
              <div className="pt-2 border-t border-gray-700/50">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Contextual Observations</p>
                <p className="text-sm text-gray-300 italic">"{profile.otherConditions.value}"</p>
              </div>
            )}
          </div>
        </SummarySection>

        {/* Action Card */}
        <div className="bg-emerald-600 rounded-2xl p-6 flex flex-col justify-between text-white relative overflow-hidden group">
           <div className="absolute bottom-0 right-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={160} />
           </div>
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-2">Need a check-up?</h3>
             <p className="text-emerald-100 text-sm mb-6">
               Your latest AI report was generated {getRelativeTime(profile.createdAt)}. Update your stats for fresh tips.
             </p>
           </div>
           <Link to="/" className="relative z-10 w-full bg-white text-emerald-600 font-bold py-3 rounded-xl flex items-center justify-center hover:bg-emerald-50 transition-colors">
             Go to Dashboard <ArrowRight size={18} className="ml-2" />
           </Link>
        </div>
      </div>
    </div>
  );
};

export default HealthProfile;
