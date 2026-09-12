import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, FileText, Activity, ShieldCheck, Settings, LogOut, UserCircle,
  Pill, Sun, Moon, Stethoscope, ClipboardCheck, HelpCircle, Users,
  Clock, Building2, ArrowRightLeft, Layers, Monitor, FlaskConical, Shield,
  MoreHorizontal, X, ChevronRight, Sparkles, LayoutGrid, Volume2, VolumeX, Languages
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

import { getNavigationForRole, getMobileNavigationForRole } from '../navigation';

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { userRole, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Close more drawer automatically when navigating
  useEffect(() => {
    setShowMoreDrawer(false);
  }, [location.pathname]);

  const [mobileVoice, setMobileVoice] = useState(() => {
    return localStorage.getItem('vaidya_voice_enabled') !== 'false';
  });

  const toggleMobileVoice = () => {
    setMobileVoice(prev => {
      const next = !prev;
      localStorage.setItem('vaidya_voice_enabled', String(next));
      window.dispatchEvent(new CustomEvent('vaidya_voice_toggled', { detail: next }));
      return next;
    });
  };

  const toggleMobileLang = () => {
    const nextLang = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('vaidya_lang', nextLang);
    window.dispatchEvent(new CustomEvent('vaidya_lang_changed', { detail: nextLang }));
  };

  if (isFullscreen) {
    return null;
  }

  const activeRole = userRole || localStorage.getItem('vaidya_active_role') || 'patient';

  // Role display metadata
  const roleMeta = {
    doctor: { badge: '🩺 DOCTOR', chip: 'DOC', short: 'MD', station: 'AIIA CLINICIAN STATION', name: 'Dr. Vaidya', sub: 'AIIA Physician', signOut: 'Doctor' },
    admin: { badge: '⚙️ ADMIN', chip: 'ADM', short: 'AD', station: 'AIIA ADMIN CONSOLE', name: 'Admin', sub: 'AIIA Administrator', signOut: 'Admin' },
    lab: { badge: '🧪 LAB', chip: 'LAB', short: 'LB', station: 'AIIA LAB WORKBENCH', name: 'Lab Tech', sub: 'AIIA Technician', signOut: 'Lab Tech' },
    patient: { badge: '🌿 PATIENT', chip: 'PAT', short: 'PT', station: 'PATIENT SANCTUARY', name: 'Patient', sub: 'Ayush Health ID', signOut: 'Patient' }
  };
  const rm = roleMeta[activeRole] || roleMeta.patient;
  const isDoctor = activeRole === 'doctor';

  // Navigation configuration
  const desktopNavItems = getNavigationForRole(activeRole);
  
  // Mobile: Exactly 4 Primary Tabs + 1 "More" (अधिक) Tab
  const primaryTabs = desktopNavItems.slice(0, 4);
  const moreTabs = desktopNavItems.slice(4);

  // Check if current route is inside moreTabs
  const isMoreActive = moreTabs.some(item =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  // Mobile clean short labels — kept consistently in English as requested
  const getShortLabel = (item) => {
    const label = item.defaultLabel || item.label || '';
    if (label.includes('Dashboard')) return 'Home';
    if (label.includes('Check-In') || label.includes('Intake') || label.includes('OPD')) return 'OPD';
    if (label.includes('Records')) return 'Records';
    if (label.includes('Medicines')) return 'Meds';
    if (label.includes('History')) return 'History';
    if (label.includes('Vitals')) return 'Vitals';
    if (label.includes('Queue')) return 'Queue';
    if (label.includes('Timeline') || label.includes('Visits')) return 'Visits';
    if (label.includes('Profile')) return 'Profile';
    if (label.includes('Help')) return 'Help';
    if (label.includes('Cockpit')) return 'Cockpit';
    if (label.includes('Patients')) return 'Patients';
    if (label.includes('Labs') || label.includes('Orders')) return 'Labs';
    if (label.includes('Hospitals')) return 'Hospitals';
    if (label.includes('Departments')) return 'Depts';
    if (label.includes('Doctors')) return 'Doctors';
    return label.slice(0, 8);
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <div
        className="vs-sidebar hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 bottom-0 px-5 py-8 backdrop-blur-3xl border-r text-slate-700 dark:text-gray-300 shrink-0 z-50 transition-all duration-500"
        style={theme === 'dark' ? {
          background: 'rgba(5, 11, 20, 0.4)',
          borderColor: 'rgba(255,255,255,0.05)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.2)'
        } : {
          background: 'linear-gradient(170deg, #ffffff 0%, #f0f9ff 55%, #f0fdf4 100%)',
          borderColor: 'rgba(16, 185, 129, 0.18)',
          boxShadow: '4px 0 40px rgba(16,185,129,0.1), 2px 0 12px rgba(59,130,246,0.06)'
        }}
      >
        {/* Logo & Role Identity Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200/60 dark:border-white/10">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              Vaidya<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Setu</span>
            </h2>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold block">
              {rm.station}
            </span>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isDoctor ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'}`}>
            {rm.badge}
          </span>
        </div>

        {/* Nav */}
        <div className="flex flex-col flex-1 justify-between overflow-y-auto">
          <nav className="flex flex-col space-y-1.5">
            {desktopNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_4px_12px_rgba(16,185,129,0.08)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-emerald-100 dark:border-emerald-500/20 font-bold'
                      : 'text-slate-700 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-white/5 border border-transparent font-medium'
                  }`
                }
              >
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                <span className="text-base">{item.defaultLabel || item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Desktop user profile */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-white/5">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2.5 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/10 backdrop-blur-md">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isDoctor
                      ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  }`}>
                    {rm.short}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {currentUser?.doctorName || currentUser?.adminName || currentUser?.techName || currentUser?.patientName || currentUser?.name || currentUser?.fullName || rm.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate font-mono">
                      {isDoctor
                        ? (currentUser?.department || currentUser?.registrationNumber || rm.sub)
                        : (currentUser?.abhaId || currentUser?.email || rm.sub)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-500 hover:text-white hover:bg-rose-500/90 transition-all border border-rose-500/20 hover:border-transparent cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out ({rm.signOut})</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer text-center shadow-md shadow-emerald-600/20"
              >
                Sign In to VaidyaSetu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE TOP HEADER ── */}
      <div
        className="md:hidden flex items-center justify-between px-4 h-14 border-b z-50 fixed top-0 left-0 right-0 select-none"
        style={theme === 'dark' ? {
          background: 'rgba(5, 11, 20, 0.95)',
          borderColor: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)'
        } : {
          background: 'rgba(255,255,255,0.95)',
          borderColor: 'rgba(16,185,129,0.15)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            Vaidya<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Setu</span>
          </h2>
          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
            isDoctor ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
          }`}>
            {rm.chip}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="text-slate-600 dark:text-gray-400 p-1.5 rounded-lg hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          
          {currentUser ? (
            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="bg-emerald-600 text-white rounded-lg px-3 py-1 text-xs font-bold"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR: 4 TABS + "MORE" WITH SELECTION BASE CAPSULE UI/UX ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[60] border-t select-none transition-all duration-300"
        style={theme === 'dark' ? {
          background: 'rgba(5, 11, 20, 0.96)',
          borderColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(28px)',
          boxShadow: '0 -4px 25px rgba(0,0,0,0.5)',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))'
        } : {
          background: 'rgba(255,255,255,0.96)',
          borderColor: 'rgba(16,185,129,0.18)',
          backdropFilter: 'blur(28px)',
          boxShadow: '0 -4px 25px rgba(16,185,129,0.08)',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className="grid grid-cols-5 gap-1 items-center px-2 pt-1.5 max-w-md mx-auto">
          {/* 4 Primary Tabs */}
          {primaryTabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-500/35 shadow-xs scale-[1.02]'
                    : 'text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100/70 dark:hover:bg-white/5 border border-transparent font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.4] text-emerald-600 dark:text-emerald-400' : 'stroke-[1.8]'}`} />
                  <span className={`text-[10px] tracking-tight leading-none truncate max-w-full ${isActive ? 'font-black' : 'font-semibold'}`}>
                    {getShortLabel(item)}
                  </span>
                  {isActive ? (
                    <span className="w-3.5 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1 shadow-xs shadow-emerald-500/50 animate-in zoom-in-50 duration-200" />
                  ) : (
                    <span className="w-3.5 h-1 mt-1 opacity-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* 5th Tab: "More" (अधिक) Drawer Toggle with Selection Highlight */}
          <button
            type="button"
            onClick={() => setShowMoreDrawer(prev => !prev)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer ${
              showMoreDrawer || isMoreActive
                ? 'bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-500/35 shadow-xs scale-[1.02]'
                : 'text-slate-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100/70 dark:hover:bg-white/5 border border-transparent font-medium'
            }`}
            aria-label="Toggle more services menu"
          >
            <MoreHorizontal className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${showMoreDrawer || isMoreActive ? 'scale-110 stroke-[2.4] text-emerald-600 dark:text-emerald-400' : 'stroke-[1.8]'}`} />
            <span className={`text-[10px] tracking-tight leading-none truncate max-w-full ${showMoreDrawer || isMoreActive ? 'font-black' : 'font-semibold'}`}>
              More
            </span>
            {(showMoreDrawer || isMoreActive) ? (
              <span className="w-3.5 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1 shadow-xs shadow-emerald-500/50 animate-in zoom-in-50 duration-200" />
            ) : (
              <span className="w-3.5 h-1 mt-1 opacity-0" />
            )}
          </button>
        </div>
      </nav>

      {/* ── MOBILE "MORE" BOTTOM DRAWER SHEET ── */}
      {showMoreDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-[70] bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 select-none"
            onClick={() => setShowMoreDrawer(false)}
          />

          {/* Slide-Up Bottom Sheet */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-white dark:bg-slate-900 rounded-t-3xl border-t-2 border-emerald-500/40 p-4 sm:p-5 shadow-2xl max-h-[82vh] overflow-y-auto space-y-3.5 animate-in slide-in-from-bottom duration-250 select-none pb-12"
          >
            {/* Top Pull Bar */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <LayoutGrid className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    More Services & Features
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-gray-400">
                    {rm.station}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info Capsule */}
            {currentUser && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {rm.short}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {currentUser?.doctorName || currentUser?.patientName || currentUser?.name || rm.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-gray-400 truncate">
                      {currentUser?.abhaId || rm.sub}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {rm.chip}
                </span>
              </div>
            )}

            {/* Grid of Remaining Services */}
            <div className="grid grid-cols-2 gap-2">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMoreDrawer(false)}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left ${
                      isActive
                        ? 'bg-emerald-500/15 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-gray-300'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold leading-tight truncate">
                        {item.defaultLabel || item.label || ''}
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>

            {/* Quick Actions: Theme & Sign Out */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
