import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  Stethoscope, Pill, FlaskConical, FileText, Activity, CalendarClock,
  Users, ShieldCheck, ChevronRight, Loader2, Clock, Plus, UserPlus, X
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

const Tile = ({ icon: Icon, label, hint, onClick, accent = 'teal', pending = false }) => {
  const accents = {
    teal: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
    mango: 'text-orange-600 dark:text-orange-400 bg-orange-500/10'
  };

  return (
    <button
      type="button"
      onClick={pending ? undefined : onClick}
      disabled={pending}
      className={`group bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/10
        rounded-2xl p-5 text-left w-full transition-all duration-300
        ${pending
          ? 'opacity-55 cursor-not-allowed'
          : 'hover:-translate-y-0.5 hover:border-teal-500/40 cursor-pointer'}`}
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 w-11 h-11 rounded-xl grid place-items-center ${accents[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white truncate">{label}</h3>
            {!pending && (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {pending ? 'Not yet available' : hint}
          </p>
        </div>
      </div>
    </button>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [medications, setMedications] = useState([]);
  const [latestVitals, setLatestVitals] = useState([]);

  // Family Members (§2) state
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showFamilyModal, setShowFamilyModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(currentUser?.patientId || currentUser?.id);
  const [newFamilyForm, setNewFamilyForm] = useState({ fullName: '', relation: 'father', age: '', gender: 'Male' });

  const effectiveUserId = currentUser?.id || currentUser?.userId || currentUser?.mobile;

  // Fetch family members
  const fetchFamilyMembers = async () => {
    if (!effectiveUserId) return;
    try {
      const res = await axios.get(`${API_URL}/patients/family-members/${effectiveUserId}`);
      if (res.data.status === 'success') {
        setFamilyMembers(res.data.data || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, [effectiveUserId]);

  const activePatientId = selectedPatientId || currentUser?.patientId || currentUser?.id;

  useEffect(() => {
    if (!activePatientId) return;
    let cancelled = false;

    const load = async () => {
      const safeGet = async (url) => {
        try {
          const res = await axios.get(url);
          return res.data?.status === 'success' ? res.data.data : null;
        } catch {
          return null;
        }
      };

      const [p, meds, vitals] = await Promise.all([
        safeGet(`${API_URL}/patients/${activePatientId}`),
        safeGet(`${API_URL}/medications/patient/${activePatientId}`),
        safeGet(`${API_URL}/vitals/latest/${activePatientId}`)
      ]);

      if (cancelled) return;
      setProfile(p);
      setMedications(Array.isArray(meds) ? meds : []);
      setLatestVitals(Array.isArray(vitals) ? vitals : []);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [activePatientId]);

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/patients/family-member`, {
        userId: effectiveUserId,
        fullName: newFamilyForm.fullName,
        relation: newFamilyForm.relation,
        age: Number(newFamilyForm.age),
        gender: newFamilyForm.gender
      });
      setNewFamilyForm({ fullName: '', relation: 'father', age: '', gender: 'Male' });
      fetchFamilyMembers();
    } catch (err) {
      alert('Failed to add family member');
    }
  };

  const displayName =
    profile?.basicInfo?.fullName || profile?.fullName?.value ||
    currentUser?.patientName || currentUser?.name || currentUser?.firstName || 'there';

  const activeMeds = medications.filter(m => m.active !== false).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 animate-in fade-in duration-500">

      {/* Family Member Switcher Bar (§3) */}
      {familyMembers.length > 0 && (
        <div className="mb-6 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 flex items-center gap-1.5 shrink-0">
            <Users size={14} className="text-teal-400" /> Beneficiary:
          </span>
          <button
            onClick={() => setSelectedPatientId(currentUser?.patientId || currentUser?.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activePatientId === (currentUser?.patientId || currentUser?.id)
                ? 'bg-teal-500 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Self ({currentUser?.patientName || 'Primary'})
          </button>
          {familyMembers.map(fm => (
            <button
              key={fm.familyMemberId}
              onClick={() => setSelectedPatientId(fm.patient?._id || fm.patientId)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activePatientId === (fm.patient?._id || fm.patientId)
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {fm.patient?.basicInfo?.fullName || 'Family Member'} ({fm.relation})
            </button>
          ))}
          <button
            onClick={() => setShowFamilyModal(true)}
            className="ml-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <UserPlus size={14} /> Add Member
          </button>
        </div>
      )}

      {/* Greeting */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
            {t('dashboard.greeting', 'Welcome back')}
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {displayName}
          </h1>
        </div>
        {familyMembers.length === 0 && (
          <button
            onClick={() => setShowFamilyModal(true)}
            className="px-4 py-2 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-teal-500/20"
          >
            <UserPlus size={14} /> Add Family Beneficiary (§2)
          </button>
        )}
      </header>

      {/* Primary action — start a visit (§3, §68) */}
      <button
        type="button"
        onClick={() => navigate('/kiosk')}
        className="w-full text-left rounded-3xl p-6 md:p-8 mb-8 transition-transform duration-300 hover:-translate-y-0.5
                   bg-gradient-to-br from-teal-600 to-teal-700 dark:from-teal-600 dark:to-teal-800
                   shadow-lg shadow-teal-900/20"
      >
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/15 grid place-items-center shrink-0">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              See a Doctor
            </h2>
            <p className="text-teal-50/90 text-sm mt-1">
              Start OPD registration — we&apos;ll reuse what we already know about {displayName}.
            </p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/80 shrink-0" />
        </div>
      </button>

      {/* At-a-glance */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/10 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Current medicines</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeMeds}</p>
        </div>
        <div className="bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/10 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Vitals on record</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{latestVitals.length}</p>
        </div>
        <div className="bg-white dark:bg-white/[0.04] border border-black/5 dark:border-white/10 rounded-2xl p-4 col-span-2 md:col-span-1">
          <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Next follow-up</p>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" /> None scheduled
          </p>
        </div>
      </div>

      {/* §3 tiles */}
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-4">
        Your health record
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <Tile icon={Pill} label="My Medicines" hint="Current, previous, stopped and pending"
              onClick={() => navigate('/medicines')} />
        <Tile icon={FlaskConical} label="My Lab Reports" hint="Results and verified reports"
              accent="mango" onClick={() => navigate('/records')} />
        <Tile icon={FileText} label="My Documents" hint="Scans, prescriptions and uploads"
              onClick={() => navigate('/records')} />
        <Tile icon={Activity} label="My Vitals" hint="Readings from home and kiosk"
              accent="mango" onClick={() => navigate('/vitals')} />
        <Tile icon={CalendarClock} label="My Visits" hint="Your consultation timeline"
              onClick={() => navigate('/visits')} />
        <Tile icon={ShieldCheck} label="Consent & Privacy" hint="See and revoke what you've shared"
              onClick={() => navigate('/privacy')} />
        <Tile icon={Clock} label="My Queue & Appointments" hint="" pending />
        <Tile icon={Users} label="Family Members" hint="Manage family account beneficiaries"
              onClick={() => setShowFamilyModal(true)} />
      </div>

      {/* Family Members Modal (§2) */}
      {showFamilyModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowFamilyModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="text-teal-400" /> Family Beneficiaries (§2)
              </h3>
              <button onClick={() => setShowFamilyModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* List existing family members */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <div className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Self ({currentUser?.patientName || 'Primary'})</p>
                  <p className="text-xs text-slate-400">Head of Account</p>
                </div>
                <button
                  onClick={() => { setSelectedPatientId(currentUser?.patientId || currentUser?.id); setShowFamilyModal(false); }}
                  className="px-3 py-1 bg-teal-500 text-slate-950 font-bold text-xs rounded-lg"
                >
                  Select
                </button>
              </div>
              {familyMembers.map(fm => (
                <div key={fm.familyMemberId} className="p-3 bg-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{fm.patient?.basicInfo?.fullName || 'Family Member'}</p>
                    <p className="text-xs text-slate-400">Relation: {fm.relation} &bull; Age: {fm.patient?.basicInfo?.age}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedPatientId(fm.patient?._id || fm.patientId); setShowFamilyModal(false); }}
                    className="px-3 py-1 bg-teal-500 text-slate-950 font-bold text-xs rounded-lg"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>

            {/* Form to add beneficiary */}
            <form onSubmit={handleAddFamilyMember} className="border-t border-slate-800 pt-4 space-y-3">
              <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Add New Family Beneficiary</p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={newFamilyForm.fullName}
                  onChange={e => setNewFamilyForm({ ...newFamilyForm, fullName: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
                <select
                  value={newFamilyForm.relation}
                  onChange={e => setNewFamilyForm({ ...newFamilyForm, relation: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Age"
                  required
                  value={newFamilyForm.age}
                  onChange={e => setNewFamilyForm({ ...newFamilyForm, age: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
                <select
                  value={newFamilyForm.gender}
                  onChange={e => setNewFamilyForm({ ...newFamilyForm, gender: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Add Beneficiary
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
