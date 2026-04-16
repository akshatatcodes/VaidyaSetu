import React, { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Loader2, Sun, Moon } from 'lucide-react';
import axios from 'axios';

// Context
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Components
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import DisclaimerBanner from './components/DisclaimerBanner';

// Pages
import Dashboard from './pages/Dashboard';
import HealthProfile from './pages/HealthProfile';
import ProfileEditor from './pages/ProfileEditor';
import ChangeHistory from './pages/ChangeHistory';
import Prescriptions from './pages/Prescriptions';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Alerts from './pages/Alerts';
import Vitals from './pages/Vitals';
import MedicationSchedule from './pages/MedicationSchedule';
import AlertSettings from './pages/AlertSettings';
import MyMedicines from './pages/MyMedicines';

import { API_URL } from './config/api';

// Guard: redirect unauthenticated users to /sign-in
const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
};

// Main app shell
const AppLayout = () => {
  const { user, isLoaded } = useUser();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) {
        if (isLoaded && !user) setChecking(false);
        return;
    }

    // Step 63: Register Push Service Worker Foundation
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
       window.addEventListener('load', () => {
         navigator.serviceWorker.register('/sw.js').then(reg => {
           console.log('[SW] Service Worker Registered:', reg.scope);
         }).catch(err => console.error('[SW] Registration failed:', err));
       });
    }

    axios.get(`${API_URL}/profile/${user.id}`)
      .then((res) => {
        if (res.data?.status === 'success') {
          const profile = res.data.data;
          if (!profile.onboardingComplete) {
            navigate('/onboarding', { replace: true });
          }
        }
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          navigate('/onboarding', { replace: true });
        }
      })
      .finally(() => setChecking(false));
  }, [isLoaded, user, navigate]);

  if (checking || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-gray-400 text-sm">Validating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col md:flex-row h-screen w-full relative transition-colors duration-700 overflow-hidden"
      style={theme === 'dark' ? { background: '#030712' } : {
        background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 40%, #f0fdf4 100%)'
      }}
    >
      {/* Premium Ambient Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full dark:bg-emerald-500/15 blur-[140px] pointer-events-none z-0" style={{background: theme === 'dark' ? '' : 'radial-gradient(ellipse, rgba(59,130,246,0.15) 0%, transparent 70%)'}} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full dark:bg-blue-500/15 blur-[140px] pointer-events-none z-0" style={{background: theme === 'dark' ? '' : 'radial-gradient(ellipse, rgba(16,185,129,0.12) 0%, transparent 70%)'}} />
      
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 md:ml-72 h-full md:h-screen overflow-y-auto scrollbar-hide">
        <main className="flex-1 p-4 sm:p-6 md:p-12 w-full vs-main-content bg-transparent dark:bg-transparent pb-28 md:pb-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<HealthProfile />} />
            <Route path="/profile/edit" element={<ProfileEditor />} />
            <Route path="/history" element={<ChangeHistory />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/vitals" element={<Vitals />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/alerts/settings" element={<AlertSettings />} />
            <Route path="/medications" element={<MedicationSchedule />} />
            <Route path="/medicines" element={<MyMedicines />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        
        <DisclaimerBanner />
        <Chatbot />
      </div>

      {/* Floating Theme Toggle — bottom-left on mobile, top-right on desktop */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-24 left-6 md:bottom-auto md:left-auto md:top-6 md:right-6 z-[100] p-3 bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-2xl text-emerald-500 hover:scale-110 active:scale-95 transition-all shadow-2xl"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
};

const AuthPage = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc] dark:bg-[#030712] py-12 transition-colors duration-500">
    {children}
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER">
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Navigate to="/sign-in" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/sign-in/*" element={<AuthPage><SignIn routing="path" path="/sign-in" /></AuthPage>} />
            <Route path="/sign-up/*" element={<AuthPage><SignUp routing="path" path="/sign-up" /></AuthPage>} />

            {/* Application Routes */}
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
