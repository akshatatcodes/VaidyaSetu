import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users, UserPlus, CheckCircle2, ArrowLeft, Shield, Clock,
  HeartPulse, RefreshCw, UserCheck, Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const FamilyMembers = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(currentUser?.patientId || currentUser?.id);
  const [form, setForm] = useState({ fullName: '', relation: 'father', age: '', gender: 'Male', bloodGroup: 'Unknown', contactNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const effectiveUserId = currentUser?.id || currentUser?.userId || currentUser?.mobile;

  const fetchFamilyMembers = async () => {
    if (!effectiveUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/patients/family-members/${effectiveUserId}`);
      if (res.data.status === 'success') {
        setFamilyMembers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching family members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, [effectiveUserId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await axios.post(`${API_URL}/patients/family-member`, {
        userId: effectiveUserId,
        fullName: form.fullName,
        relation: form.relation,
        age: Number(form.age),
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        contactNumber: form.contactNumber
      });
      if (res.data.status === 'success') {
        setMessage('Family member added cleanly!');
        setForm({ fullName: '', relation: 'father', age: '', gender: 'Male', bloodGroup: 'Unknown', contactNumber: '' });
        fetchFamilyMembers();
      }
    } catch (err) {
      alert('Failed to register family member');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <RefreshCw className="w-10 h-10 text-teal-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto w-full pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-bold mb-2">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="text-teal-500" /> Family Beneficiary Accounts (§2, §3)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage beneficiary profiles linked to your mobile account head of household.
          </p>
        </div>
      </div>

      {message && (
        <div className="mb-6 bg-teal-500/10 border border-teal-500/30 p-4 rounded-2xl flex items-center gap-3 text-teal-300 text-sm font-bold">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Members List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-teal-500">Registered Beneficiaries</h2>
          
          {/* Self Primary Card */}
          <div className={`p-6 rounded-3xl border transition-all ${
            selectedPatientId === (currentUser?.patientId || currentUser?.id)
              ? 'bg-teal-500/10 border-teal-500/40 shadow-lg'
              : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 font-black">
                  SELF
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg">{currentUser?.patientName || currentUser?.name || 'Primary User'}</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Head of Household
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Mobile Account Head &bull; Primary Patient</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatientId(currentUser?.patientId || currentUser?.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedPatientId === (currentUser?.patientId || currentUser?.id)
                    ? 'bg-teal-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {selectedPatientId === (currentUser?.patientId || currentUser?.id) ? 'Active Profile' : 'Select'}
              </button>
            </div>
          </div>

          {/* Linked Family Members */}
          {familyMembers.map((fm) => {
            const isSelected = selectedPatientId === (fm.patient?._id || fm.patientId);
            return (
              <div key={fm.familyMemberId} className={`p-6 rounded-3xl border transition-all ${
                isSelected ? 'bg-teal-500/10 border-teal-500/40 shadow-lg' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 font-black uppercase">
                      {(fm.patient?.basicInfo?.fullName || 'F').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-lg">{fm.patient?.basicInfo?.fullName || 'Family Member'}</h3>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {fm.relation}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Age: {fm.patient?.basicInfo?.age} &bull; Gender: {fm.patient?.basicInfo?.gender} &bull; Blood: {fm.patient?.basicInfo?.bloodGroup || 'Unknown'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPatientId(fm.patient?._id || fm.patientId)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected ? 'bg-teal-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Active Profile' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Add Member Form */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl h-fit space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
            <UserPlus size={16} /> Add Beneficiary (§2)
          </h2>
          <p className="text-xs text-slate-400">Register a new family member under this phone number head-of-account.</p>

          <form onSubmit={handleAddMember} className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">Full Name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Relation</label>
                <select
                  value={form.relation}
                  onChange={e => setForm({ ...form, relation: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs"
                >
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="spouse">Spouse</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Age</label>
                <input
                  type="number"
                  required
                  value={form.age}
                  onChange={e => setForm({ ...form, age: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-teal-400 transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <Plus size={14} /> {submitting ? 'Registering...' : 'Add Beneficiary'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default FamilyMembers;
