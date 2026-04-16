import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, FileText, Activity, ShieldAlert, Settings, LogOut, AlertCircle, UserCircle, Pill } from 'lucide-react';
import { UserButton, useClerk, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const Sidebar = () => {
  const { signOut } = useClerk();
  const { theme } = useTheme();
  const { user } = useUser();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (user) {
      const fetchCount = async () => {
        try {
          const res = await axios.get(`${API_URL}/alerts/${user.id}/count`);
          if (res.data.status === 'success') setUnreadCount(res.data.data.count);
        } catch (err) {
          console.error('Sidebar count fetch failed', err);
        }
      };
      fetchCount();
      const interval = setInterval(fetchCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navItems = [
    { to: '/', icon: Home, label: t('sidebar.dashboard') },
    { to: '/prescriptions', icon: ShieldAlert, label: t('sidebar.prescriptions') },
    { to: '/vitals', icon: Activity, label: t('sidebar.vitals') },
    { to: '/medicines', icon: Pill, label: t('sidebar.medicines') },
    { to: '/alerts', icon: AlertCircle, label: t('sidebar.alerts') },
    { to: '/profile', icon: UserCircle, label: t('sidebar.profile') },
    { to: '/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  /* ──────────────────────────────────────────────
     DESKTOP SIDEBAR (hidden on mobile)
  ────────────────────────────────────────────── */
  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <div
        className="vs-sidebar hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 bottom-0 px-5 py-10 backdrop-blur-3xl border-r text-slate-700 dark:text-gray-300 shrink-0 z-50 transition-all duration-500"
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
        {/* Logo */}
        <div className="flex items-center justify-center mb-12">
          <h2 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            Vaidya<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Setu</span>
          </h2>
        </div>

        {/* Nav */}
        <div className="flex flex-col flex-1 justify-between overflow-hidden">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => (
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
            <SignedIn>
              <div className="flex items-center justify-between px-4 py-3 bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 backdrop-blur-md hover:border-emerald-500/30 transition-all">
                <UserButton
                  showName
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-8 h-8',
                      userButtonBox: 'flex-row-reverse',
                      userButtonOuterIdentifier: 'text-slate-900 dark:!text-white font-bold'
                    }
                  }}
                />
                <Link to="/profile" className="text-slate-600 dark:text-gray-400 hover:text-emerald-600 transition-colors" title="My Health Profile">
                  <UserCircle className="w-5 h-5" />
                </Link>
              </div>
            </SignedIn>
            <SignedOut>
              <div className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors cursor-pointer text-center">
                <SignInButton mode="modal">{t('sidebar.signin')}</SignInButton>
              </div>
            </SignedOut>
          </div>
        </div>
      </div>

      {/* ── MOBILE TOP HEADER ── */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 border-b z-50 sticky top-0"
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
        <h2 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
          Vaidya<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Setu</span>
        </h2>
        <SignedIn>
          <div className="flex items-center gap-3">
            <Link to="/profile" className="text-slate-600 dark:text-gray-400 hover:text-emerald-600 transition-colors">
              <UserCircle className="w-5 h-5" />
            </Link>
            <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="bg-emerald-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium cursor-pointer">
            <SignInButton mode="modal">{t('sidebar.signin')}</SignInButton>
          </div>
        </SignedOut>
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
        {navItems.map((item) => (
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
                  {item.label.length > 6 ? item.label.slice(0, 6) : item.label}
                </span>
                {item.to === '/alerts' && unreadCount > 0 && (
                  <span className="absolute top-1.5 right-[calc(50%-18px)] w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
