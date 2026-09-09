import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Home, FileText, Activity, ShieldAlert, Settings, LogOut, AlertCircle, UserCircle, Pill, Sun, Moon, Stethoscope, ClipboardCheck, HelpCircle } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

import { API_URL } from '../config/api';

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useUser();
  const { userRole, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = React.useState(0);

  const activeRole = userRole || localStorage.getItem('vaidya_active_role') || 'patient';

  // Role display metadata shared by desktop + mobile identity headers
  const roleMeta = {
    doctor: { badge: '🩺 DOCTOR', chip: 'DOC', short: 'MD', station: 'AIIA CLINICIAN STATION', name: 'Dr. Vaidya', sub: 'AIIA Physician', signOut: 'Doctor' },
    admin: { badge: '⚙️ ADMIN', chip: 'ADM', short: 'AD', station: 'AIIA ADMIN CONSOLE', name: 'Admin', sub: 'AIIA Administrator', signOut: 'Admin' },
    lab: { badge: '🧪 LAB', chip: 'LAB', short: 'LB', station: 'AIIA LAB WORKBENCH', name: 'Lab Tech', sub: 'AIIA Technician', signOut: 'Lab Tech' },
    patient: { badge: '🌿 PATIENT', chip: 'PAT', short: 'PT', station: 'PATIENT SANCTUARY', name: 'Patient', sub: 'Ayush Health ID', signOut: 'Patient' }
  };
  const rm = roleMeta[activeRole] || roleMeta.patient;
  const isDoctor = activeRole === 'doctor';

  React.useEffect(() => {
    const userId = currentUser?._id || currentUser?.id || user?.id;
    if (userId) {
      const fetchCount = async () => {
        try {
          const res = await axios.get(`${API_URL}/alerts/${userId}/count`);
          if (res.data.status === 'success') setUnreadCount(res.data.data.count);
        } catch (err) {
          // Silent fallback for demo mode
        }
      };
      fetchCount();
      const interval = setInterval(fetchCount, 30000);
      const onRefresh = () => fetchCount();
      window.addEventListener('vaidya:alerts-refresh', onRefresh);
      return () => {
        clearInterval(interval);
        window.removeEventListener('vaidya:alerts-refresh', onRefresh);
      };
    }
  }, [currentUser, user]);

  // Dedicated 5-Tab Patient Sanctuary Information Architecture (Home, Visits, Records, Medicines, Help)
  const patientNavItems = [
    { to: '/', icon: Home, label: t('sidebar.dashboard', 'Home') },
    { to: '/visits', icon: ClipboardCheck, label: t('sidebar.visits', 'Visits') },
    { to: '/records', icon: FileText, label: t('sidebar.records', 'Records') },
    { to: '/medicines', icon: Pill, label: t('sidebar.medicines', 'Medicines') },
    { to: '/help', icon: HelpCircle, label: t('sidebar.help', 'Help & Guide') },
    { to: '/kiosk', icon: Stethoscope, label: t('sidebar.kiosk', 'OPD MediKiosk') },
    { to: '/vitals', icon: Activity, label: t('sidebar.vitals', 'My Vitals') },
    { to: '/profile', icon: UserCircle, label: t('sidebar.profile', 'Health Profile') }
  ];

  // Dedicated AIIA Doctor Cockpit navigation items (Consumer dashboard excluded)
  const doctorNavItems = [
    { to: '/doctor', icon: ClipboardCheck, label: t('sidebar.doctor', 'Doctor Cockpit') },
    { to: '/kiosk', icon: Stethoscope, label: t('sidebar.kioskQueue', 'Kiosk Terminal') },
    { to: '/prescriptions', icon: ShieldAlert, label: t('sidebar.prescriptions', 'Clinical Records') },
    { to: '/vitals', icon: Activity, label: t('sidebar.vitals', 'Triage Telemetry') },
    { to: '/alerts', icon: AlertCircle, label: t('sidebar.alerts', 'Safety & HDI Guard') },
    { to: '/profile', icon: UserCircle, label: t('sidebar.profile', 'Physician Profile') },
    { to: '/settings', icon: Settings, label: t('sidebar.settings', 'Settings') }
  ];

  // Dedicated AIIA Admin Console navigation (RBAC: admin role)
  const adminNavItems = [
    { to: '/admin', icon: ClipboardCheck, label: t('sidebar.admin', 'Admin Console') },
    { to: '/kiosk', icon: Stethoscope, label: t('sidebar.kioskQueue', 'Kiosk Terminal') },
    { to: '/prescriptions', icon: ShieldAlert, label: t('sidebar.prescriptions', 'Clinical Records') },
    { to: '/vitals', icon: Activity, label: t('sidebar.vitals', 'Triage Telemetry') },
    { to: '/profile', icon: UserCircle, label: t('sidebar.profile', 'Admin Profile') },
    { to: '/settings', icon: Settings, label: t('sidebar.settings', 'Settings') }
  ];

  // Dedicated AIIA Lab Workbench navigation (RBAC: lab role)
  const labNavItems = [
    { to: '/lab', icon: ClipboardCheck, label: t('sidebar.lab', 'Lab Workbench') },
    { to: '/kiosk', icon: Stethoscope, label: t('sidebar.kioskQueue', 'Kiosk Terminal') },
    { to: '/prescriptions', icon: ShieldAlert, label: t('sidebar.prescriptions', 'Clinical Records') },
    { to: '/vitals', icon: Activity, label: t('sidebar.vitals', 'Diagnostics') },
    { to: '/settings', icon: Settings, label: t('sidebar.settings', 'Settings') }
  ];

  const desktopNavItems = activeRole === 'doctor' ? doctorNavItems : activeRole === 'admin' ? adminNavItems : activeRole === 'lab' ? labNavItems : patientNavItems;

  // Strict 5-Tab Mobile Bottom Nav Architecture
  const mobilePatientNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/visits', icon: ClipboardCheck, label: 'Visits' },
    { to: '/records', icon: FileText, label: 'Records' },
    { to: '/medicines', icon: Pill, label: 'Medicines' },
    { to: '/help', icon: HelpCircle, label: 'Help' }
  ];

  const mobileDoctorNavItems = [
    { to: '/doctor', icon: ClipboardCheck, label: t('sidebar.doctor', 'Cockpit') },
    { to: '/kiosk', icon: Stethoscope, label: t('sidebar.kiosk', 'Kiosk') },
    { to: '/prescriptions', icon: ShieldAlert, label: t('sidebar.prescriptions', 'Records') },
    { to: '/vitals', icon: Activity, label: t('sidebar.vitals', 'Vitals') },
    { to: '/profile', icon: UserCircle, label: t('sidebar.profile', 'Profile') }
  ];

  const mobileAdminNavItems = [
    { to: '/admin', icon: ClipboardCheck, label: 'Console' },
    { to: '/kiosk', icon: Stethoscope, label: 'Kiosk' },
    { to: '/prescriptions', icon: ShieldAlert, label: 'Records' },
    { to: '/vitals', icon: Activity, label: 'Vitals' },
    { to: '/profile', icon: UserCircle, label: 'Profile' }
  ];

  const mobileLabNavItems = [
    { to: '/lab', icon: ClipboardCheck, label: 'Lab' },
    { to: '/kiosk', icon: Stethoscope, label: 'Kiosk' },
    { to: '/prescriptions', icon: ShieldAlert, label: 'Records' },
    { to: '/vitals', icon: Activity, label: 'Tests' },
    { to: '/settings', icon: Settings, label: 'Settings' }
  ];

  const mobileBottomNavItems = activeRole === 'doctor' ? mobileDoctorNavItems : activeRole === 'admin' ? mobileAdminNavItems : activeRole === 'lab' ? mobileLabNavItems : mobilePatientNavItems;

  /* ──────────────────────────────────────────────
     DESKTOP SIDEBAR (hidden on mobile)
  ────────────────────────────────────────────── */
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
                <span className="text-base">{item.label}</span>
                {item.to === '/alerts' && unreadCount > 0 && (
                  <span className="absolute right-4 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                    {unreadCount}
                  </span>
                )}
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
        className="md:hidden flex items-center justify-between px-4 h-16 border-b z-50 sticky top-0"
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
        <div className="flex items-center pt-1 gap-2">
          <h2 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            Vaidya<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Setu</span>
          </h2>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
            isDoctor ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
          }`}>
            {rm.chip}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-slate-600 dark:text-gray-400 p-1 hover:text-emerald-500 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {/* Alerts icon */}
          <Link to="/alerts" className="relative text-slate-600 dark:text-gray-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          
          {currentUser ? (
            <button
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
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

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[60] flex items-stretch border-t"
        style={theme === 'dark' ? {
          background: 'rgba(5, 11, 20, 0.97)',
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)'
        } : {
          background: 'rgba(255,255,255,0.97)',
          borderColor: 'rgba(16,185,129,0.15)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 -8px 32px rgba(16,185,129,0.08)'
        }}
      >
        {mobileBottomNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 relative transition-all duration-200 ${
                isActive
                  ? 'text-emerald-500'
                  : 'text-slate-400 dark:text-gray-500 hover:text-emerald-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
                )}
                <item.icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                  {item.label.length > 8 ? item.label.slice(0, 8) : item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
