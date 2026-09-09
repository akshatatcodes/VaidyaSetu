import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Stethoscope, User, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AccessDenied = ({ requiredRole = 'doctor' }) => {
  const navigate = useNavigate();
  const { userRole, logout } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-rose-500/30 shadow-2xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/30 animate-pulse">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider">
            Clinical Security Boundary
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            Access Restricted
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            {requiredRole === 'doctor' ? (
              <>
                This terminal is strictly restricted to authenticated <strong>AIIA Ayush Medical Officers & Clinicians</strong>. Your current active account role is <strong>Patient</strong>.
              </>
            ) : (
              <>
                This section is configured for <strong>Patient Health Sanctuary</strong> access. Your current active account role is <strong>Physician</strong>.
              </>
            )}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate(userRole === 'doctor' ? '/doctor' : '/')}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to My Allowed Portal
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" /> Switch Account / Sign In with Different Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
