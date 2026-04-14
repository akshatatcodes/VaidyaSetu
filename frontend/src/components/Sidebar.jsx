import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, FileText, Activity, ShieldAlert, Settings, LogOut, AlertCircle, UserCircle, Pill } from 'lucide-react';
import { UserButton, useClerk, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

/**
 * Sidebar component replicated from VaidyaSetu1
 * Features:
 * - Responsive layout (mobile top, desktop side)
 * - Emerald/Gray-900 color scheme
 * - Lucide icons
 * - Clerk integration
 */
const Sidebar = () => {
  const { signOut } = useClerk();
  const { theme } = useTheme();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (user) {
      const fetchCount = async () => {
        try {
          const res = await axios.get(`${API_URL}/alerts/${user.id}/count`);
          if (res.data.status === 'success') {
            setUnreadCount(res.data.data.count);
          }
        } catch (err) {
          console.error("Sidebar count fetch failed", err);
        }
      };
      fetchCount();
      const interval = setInterval(fetchCount, 60000); // Polling every 1 min
      return () => clearInterval(interval);
    }
  }, [user]);

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/prescriptions', icon: ShieldAlert, label: 'Safety Bridge' },
    { to: '/vitals', icon: Activity, label: 'My Vitals' },
    { to: '/medicines', icon: Pill, label: 'My Medicines' },
    { to: '/alerts', icon: AlertCircle, label: 'Alerts' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="vs-sidebar flex flex-col w-full md:w-72 h-auto md:h-screen sticky top-0 px-5 py-6 md:py-10 bg-white dark:bg-none dark:bg-[#050b14]/40 backdrop-blur-3xl border-b md:border-r border-slate-100 dark:border-white/5 text-slate-700 dark:text-gray-300 shrink-0 z-50 transition-all duration-500 shadow-[8px_0_40px_rgba(35,60,111,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] relative before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:dark:from-white/5 before:pointer-events-none">

      <div className="flex items-center justify-between md:justify-center mb-6 md:mb-12 relative z-10">
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 drop-shadow-sm">
          Vaidya<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Setu</span>
        </h2>
        
        {/* Mobile Header Auth Controls */}
        <div className="block md:hidden">
            <SignedIn>
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="text-slate-600 dark:text-gray-400 hover:text-emerald-600 transition-colors" title="My Health Profile">
                    <UserCircle className="w-5 h-5" />
                  </Link>
                  <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
                </div>
            </SignedIn>
            <SignedOut>
                <div className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer text-center">
                   <SignInButton mode="modal">Sign In</SignInButton>
                </div>
            </SignedOut>
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1 overflow-hidden">
        {/* Navigation Layer */}
        <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 space-y-0 md:space-y-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex whitespace-nowrap items-center px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'text-blue-700 dark:text-emerald-300 bg-blue-50/80 dark:bg-emerald-500/10 active-link shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_4px_12px_rgba(35,60,111,0.08)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-blue-100 dark:border-emerald-500/20 font-bold'
                    : 'text-slate-700 dark:text-gray-400 hover:text-blue-600 dark:hover:text-emerald-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-100 dark:hover:border-white/5 border border-transparent font-medium hover:shadow-[0_2px_10px_rgba(35,60,111,0.04)]'
                }`
              }
            >
              <item.icon className="w-4 md:w-5 h-4 md:h-5 mr-2 md:mr-3" />
              <span className="font-medium text-sm md:text-base">{item.label}</span>
              {item.to === '/alerts' && unreadCount > 0 && (
                 <span className="absolute right-2 md:right-4 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                    {unreadCount}
                 </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Footer Auth Controls */}
        <div className="hidden md:block space-y-4 pt-6 mt-auto border-t border-gray-200/50 dark:border-white/5 relative z-10">
          <SignedIn>
            <div className="space-y-2 group">
              <div className="flex items-center justify-between px-4 py-3 bg-white/40 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:border-emerald-500/30">
                <UserButton 
                  showName 
                  appearance={{ 
                    elements: { 
                      userButtonAvatarBox: "w-8 h-8", 
                      userButtonBox: "flex-row-reverse",
                      userButtonOuterIdentifier: "text-slate-800 dark:text-gray-300 font-bold" 
                    } 
                  }} 
                />
                <Link to="/profile" className="text-slate-600 dark:text-gray-400 hover:text-emerald-600 transition-colors" title="My Health Profile">
                  <UserCircle className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </SignedIn>
          <SignedOut>
             <div className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors cursor-pointer text-center">
                <SignInButton mode="modal">Sign In</SignInButton>
             </div>
          </SignedOut>
        </div>
      </div>
    </div>
  );
};


export default Sidebar;
