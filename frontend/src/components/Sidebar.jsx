import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, FileText, Activity, ShieldAlert, Settings, LogOut, AlertCircle, UserCircle } from 'lucide-react';
import { UserButton, useClerk, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';


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

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/profile', icon: UserCircle, label: 'My Health Profile' },
    { to: '/prescriptions', icon: ShieldAlert, label: 'Safety Bridge' },
    { to: '/vitals', icon: Activity, label: 'My Vitals' },
    { to: '/alerts', icon: AlertCircle, label: 'Alerts' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="vs-sidebar flex flex-col w-full md:w-64 h-auto md:h-screen sticky top-0 px-4 py-4 md:py-8 bg-gray-900 border-b md:border-r border-gray-800 text-gray-300 shrink-0 z-50">

      <div className="flex items-center justify-between md:justify-center mb-4 md:mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Vaidya<span className="text-emerald-500">Setu</span>
        </h2>
        
        {/* Mobile Header Auth Controls */}
        <div className="block md:hidden">
            <SignedIn>
                <div className="flex items-center space-x-4">
                  <Link to="/profile" className="text-gray-400 hover:text-emerald-500 transition-colors" title="My Health Profile">
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
                `flex whitespace-nowrap items-center px-4 py-2 md:py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-400 bg-gray-800/50'
                    : 'text-gray-400 hover:text-emerald-400 hover:bg-gray-800/30'
                }`
              }
            >
              <item.icon className="w-4 md:w-5 h-4 md:h-5 mr-2 md:mr-3" />
              <span className="font-medium text-sm md:text-base">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Desktop Footer Auth Controls */}
        <div className="hidden md:block space-y-4 pt-6 mt-auto">
          <SignedIn>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800/30 rounded-xl border border-gray-700/50">
                <UserButton 
                  showName 
                  appearance={{ 
                    elements: { 
                      userButtonAvatarBox: "w-8 h-8", 
                      userButtonBox: "flex-row-reverse",
                      userButtonOuterIdentifier: "text-gray-300 font-medium" 
                    } 
                  }} 
                />
                <Link to="/profile" className="text-gray-400 hover:text-emerald-500 transition-colors" title="My Health Profile">
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
