import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User, Award, Clock, MapPin, Calendar, CheckCircle2, Stethoscope,
  BarChart3, Edit3, Save, X, Building2, BookOpen, ShieldCheck, AlertCircle,
  ToggleLeft, ToggleRight, Sparkles, Phone, Mail, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

export default function DoctorProfile() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Determine active doctor identity from session
  const activeDocName = currentUser?.doctorName || currentUser?.displayName || currentUser?.fullName || currentUser?.name || 'Dr. Physician';
  const activeDocId = currentUser?.doctorId || currentUser?._id || currentUser?.id || 'DOC-SESSION-001';
  const activeDocDept = currentUser?.department || 'Department of Kayachikitsa';

  // 9 Required Profile State Attributes
  const [profile, setProfile] = useState({
    doctorId: activeDocId,
    fullName: activeDocName,
    qualifications: currentUser?.qualification || 'BAMS, MD (Ayurveda), PhD',
    departmentName: activeDocDept,
    hospitalName: currentUser?.hospitalName || 'All India Institute of Ayurveda (AIIA), New Delhi',
    registrationNumber: currentUser?.registrationNumber || 'AIIA-2024-8891',
    registrationCouncil: 'Delhi Bharatiya Chikitsa Parishad',
    experienceYears: currentUser?.experienceYears || 12,
    specialities: 'Kayachikitsa, Panchakarma, Gastro-Metabolic Health',
    bio: 'Senior Consultant Physician specializing in integrative health.',
    consultationTimings: '09:00 AM - 02:00 PM (Mon - Sat)',
    availableAppointmentSlots: '15 mins / slot • Max 25 patients / day',
    isAvailableToday: true,
    onLeave: false,
    leaveReason: '',
    unavailableUntil: '',
    roomNumber: currentUser?.roomNumber || 'OPD Room 104'
  });

  // Edit Form Scratchpad State
  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/doctor/profile`, {
        params: {
          doctorId: activeDocId,
          doctorName: activeDocName,
          department: activeDocDept
        }
      });
      if (res.data?.data) {
        // Ensure name is not overwritten by empty/dummy default if database record had fallback
        const returnedData = res.data.data;
        if (!returnedData.fullName || returnedData.fullName === 'Dr. Vikramaditya Sharma') {
          returnedData.fullName = activeDocName;
        }
        setProfile(returnedData);
        setFormData(returnedData);
      }
    } catch (err) {
      console.warn('Error fetching doctor profile from Mongo Atlas:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await axios.put(`${API_URL}/doctor/profile`, { doctorId: activeDocId, ...formData });
      if (res.data?.data) {
        const updatedData = res.data.data;
        setProfile(updatedData);
        setFormData(updatedData);
        setSaveSuccess(true);
        setIsEditing(false);

        // Update local session if available so Navbar reflects new Doctor Name & Dept
        try {
          const savedSessionStr = localStorage.getItem('vaidya_auth_session');
          if (savedSessionStr) {
            const session = JSON.parse(savedSessionStr);
            if (session?.user) {
              session.user.doctorName = updatedData.fullName || updatedData.displayName;
              session.user.displayName = updatedData.displayName || updatedData.fullName;
              session.user.department = updatedData.departmentName;
              localStorage.setItem('vaidya_auth_session', JSON.stringify(session));
              window.dispatchEvent(new Event('vaidya:auth-change'));
            }
          }
        } catch (e) {
          console.warn('Session sync note:', e);
        }

        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Failed to save profile to Mongo Atlas:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Failed to update profile. Please try again.';
      setErrorMsg(serverMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Doctor Profile successfully updated and saved to MongoDB Atlas!</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="text-white hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-600 text-white font-bold text-sm shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-white hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-slate-900 border border-emerald-500/30 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 p-1 shadow-2xl shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center font-black text-3xl text-emerald-400 border border-white/10">
                {profile.fullName?.charAt(0) || 'D'}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black uppercase tracking-wider">
                  🩺 {profile.departmentName}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${
                  profile.onLeave 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                }`}>
                  {profile.onLeave ? '🔴 ON LEAVE' : '🟢 AVAILABLE TODAY'}
                </span>
              </div>

              {/* 1. Name */}
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {profile.fullName}
              </h1>

              {/* 2. Qualifications */}
              <p className="text-xs font-mono font-bold text-emerald-300/90">
                {profile.qualifications}
              </p>

              {/* 3. Department & 4. Hospital */}
              <p className="text-xs text-gray-300 font-medium">
                {profile.hospitalName}
              </p>

              {/* 9. Room Number & 6. Timings */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-semibold text-gray-300">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-emerald-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  {profile.roomNumber}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-white/10 text-teal-300">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  {profile.consultationTimings}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => {
              setFormData({ ...profile });
              setIsEditing(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer shrink-0 border border-emerald-400/30"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        </div>
      </div>

      {/* Grid of 9 Attributes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Professional Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-emerald-500/20 shadow-xl space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-3">
            <Award className="w-4 h-4 text-emerald-500" /> Professional Credentials
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Medical Registration</span>
              <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
                <span>Reg No: {profile.registrationNumber}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">VERIFIED</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{profile.registrationCouncil}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Specializations</span>
              <p className="font-bold text-slate-900 dark:text-white">{profile.specialities}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Clinical Experience</span>
              <p className="font-bold text-slate-900 dark:text-white">{profile.experienceYears} Years Active Clinical Practice</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Biography & Clinical Focus</span>
              <p className="text-slate-700 dark:text-gray-300 leading-relaxed font-medium">{profile.bio}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Schedule & Availability */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-emerald-500/20 shadow-xl space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/10 pb-3">
            <Calendar className="w-4 h-4 text-teal-500" /> Schedule, Slots & Availability
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Consultation Timings</span>
              <p className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                {profile.consultationTimings}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Available Appointment Slots</span>
              <p className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {profile.availableAppointmentSlots}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">OPD Room Number</span>
              <p className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                {profile.roomNumber}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase block">Current Availability Status</span>
              <div className="flex items-center justify-between font-bold">
                <span className={profile.onLeave ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                  {profile.onLeave ? `On Leave (${profile.leaveReason || 'Scheduled Away'})` : 'Available for Consultations'}
                </span>
                {profile.unavailableUntil && (
                  <span className="text-[10px] text-gray-400">Until: {profile.unavailableUntil}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:pl-72 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white animate-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white">Edit Doctor Profile</h3>
                  <p className="text-xs text-emerald-200/70 font-medium">Update credentials, room number, timings, and availability in Mongo Atlas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Doctor Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Dr. Vikramaditya Sharma"
                  />
                </div>

                {/* 2. Qualifications */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Qualifications</label>
                  <input
                    type="text"
                    required
                    value={formData.qualifications || ''}
                    onChange={(e) => handleInputChange('qualifications', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. BAMS, MD (Kayachikitsa), PhD"
                  />
                </div>

                {/* 3. Department Select Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Department</label>
                  <select
                    value={formData.departmentName || 'Department of Kayachikitsa'}
                    onChange={(e) => handleInputChange('departmentName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Department of Kayachikitsa">Department of Kayachikitsa (Internal Medicine)</option>
                    <option value="Department of Shalya Tantra">Department of Shalya Tantra (Surgery)</option>
                    <option value="Department of Panchakarma">Department of Panchakarma</option>
                    <option value="Department of Kaumarbhritya">Department of Kaumarbhritya (Pediatrics)</option>
                    <option value="Department of Prasuti & Stree Roga">Department of Prasuti & Stree Roga (Gynecology)</option>
                    <option value="Department of Shalakya Tantra">Department of Shalakya Tantra (ENT/Ophthalmology)</option>
                    <option value="Department of Internal Medicine (Allopathy)">Department of Internal Medicine (Allopathy)</option>
                    <option value="Department of Cardiology">Department of Cardiology</option>
                    <option value="Department of Orthopedics">Department of Orthopedics</option>
                  </select>
                </div>

                {/* 4. Hospital */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Hospital / Institute</label>
                  <input
                    type="text"
                    required
                    value={formData.hospitalName || ''}
                    onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. All India Institute of Ayurveda (AIIA)"
                  />
                </div>

                {/* 9. Room Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Room Number</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber || ''}
                    onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. OPD Room 104, Ground Floor"
                  />
                </div>

                {/* 6. Consultation Timings */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Consultation Timings</label>
                  <input
                    type="text"
                    required
                    value={formData.consultationTimings || ''}
                    onChange={(e) => handleInputChange('consultationTimings', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 09:00 AM - 02:00 PM (Mon - Sat)"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      '09:00 AM - 02:00 PM (Mon - Sat)',
                      '08:00 AM - 01:00 PM (Morning OPD)',
                      '02:00 PM - 07:00 PM (Evening OPD)',
                      '09:00 AM - 05:00 PM (Full Day)'
                    ].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleInputChange('consultationTimings', t)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                      >
                        + {t.split(' (')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Available Appointment Slots */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Available Appointment Slots</label>
                  <input
                    type="text"
                    required
                    value={formData.availableAppointmentSlots || ''}
                    onChange={(e) => handleInputChange('availableAppointmentSlots', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 15 mins / slot • Max 25 patients / day"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      '15 mins / slot • Max 25 patients / day',
                      '10 mins / slot • Max 35 patients / day',
                      '20 mins / slot • Max 20 patients / day',
                      '30 mins / slot • Max 15 patients / day'
                    ].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleInputChange('availableAppointmentSlots', s)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-teal-500/20 hover:text-teal-300 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                      >
                        + {s.split(' • ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Registration Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Registration Number</label>
                  <input
                    type="text"
                    value={formData.registrationNumber || ''}
                    onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. AIIA-2024-8891"
                  />
                </div>

                {/* Registration Council Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Medical Council</label>
                  <select
                    value={formData.registrationCouncil || 'Delhi Bharatiya Chikitsa Parishad'}
                    onChange={(e) => handleInputChange('registrationCouncil', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Delhi Bharatiya Chikitsa Parishad">Delhi Bharatiya Chikitsa Parishad</option>
                    <option value="National Commission for Indian System of Medicine (NCISM)">National Commission for Indian System of Medicine (NCISM)</option>
                    <option value="Central Council of Indian Medicine (CCIM)">Central Council of Indian Medicine (CCIM)</option>
                    <option value="National Medical Commission (NMC)">National Medical Commission (NMC)</option>
                    <option value="State Medical Council">State Medical Council</option>
                  </select>
                </div>

                {/* Experience Years */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Years of Experience</label>
                  <input
                    type="number"
                    value={formData.experienceYears || ''}
                    onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="14"
                  />
                </div>
              </div>

              {/* Specialities */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Specialities (comma separated)</label>
                <input
                  type="text"
                  value={formData.specialities || ''}
                  onChange={(e) => handleInputChange('specialities', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Gastro-Metabolic Care, Musculoskeletal Care"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Biography / Professional Profile</label>
                <textarea
                  rows={3}
                  value={formData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Write a brief professional summary..."
                />
              </div>

              {/* 8. Leave / Availability Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">Leave / Availability Status</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Toggle whether doctor is available today or on leave</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('onLeave', !formData.onLeave)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      formData.onLeave 
                        ? 'bg-rose-600 text-white shadow-md' 
                        : 'bg-emerald-600 text-white shadow-md'
                    }`}
                  >
                    {formData.onLeave ? '🔴 Set Status: On Leave' : '🟢 Set Status: Available'}
                  </button>
                </div>

                {formData.onLeave && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Leave Reason</label>
                      <input
                        type="text"
                        value={formData.leaveReason || ''}
                        onChange={(e) => handleInputChange('leaveReason', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white"
                        placeholder="e.g. Attending Medical Conference"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">Unavailable Until Date</label>
                      <input
                        type="text"
                        value={formData.unavailableUntil || ''}
                        onChange={(e) => handleInputChange('unavailableUntil', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white"
                        placeholder="e.g. 15 Sep 2026"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving to Mongo Atlas...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
