import React from 'react';
import ComprehensiveMedicalHistory from '../components/ComprehensiveMedicalHistory';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MedicalHistoryPage() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] p-4 sm:p-8 space-y-6 max-w-7xl mx-auto transition-colors duration-500">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(userRole === 'doctor' ? '/doctor' : '/')}
          className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-gray-300 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {userRole === 'doctor' ? 'Doctor Cockpit' : 'Dashboard'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> ABDM / ABHA Certified Clinical Record
          </span>
        </div>
      </div>

      {/* Render Full Comprehensive Medical History Dossier */}
      <ComprehensiveMedicalHistory
        patientData={{
          patientName: currentUser?.name || currentUser?.fullName || 'Roshan Batgale',
          abhaId: currentUser?.abhaId || '14-8921-3401-9921',
          age: currentUser?.age || 28,
          gender: currentUser?.gender || 'Male'
        }}
        isModal={false}
        readOnly={false}
      />
    </div>
  );
}
