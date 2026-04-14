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

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

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
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
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
    <div className="flex flex-col md:flex-row min-h-screen w-full relative bg-[#f7f9fc] dark:bg-[#030712] transition-colors duration-700 overflow-hidden">
      {/* Premium Ambient Background Glows - Medical Aesthetic */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 dark:bg-emerald-500/15 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-50/50 dark:bg-blue-500/15 blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-[30%] left-[50%] w-[40%] h-[40%] rounded-full bg-indigo-50/40 dark:bg-purple-500/10 blur-[120px] pointer-events-none z-0" />
      {/* Floating Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-[100] p-3 bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-2xl text-emerald-500 hover:scale-110 active:scale-95 transition-all shadow-2xl group"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
        )}
      </button>

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300">
        <main className="p-4 sm:p-8 md:p-12 w-full overflow-auto vs-main-content bg-transparent dark:bg-transparent">
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
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <DisclaimerBanner />
        <Chatbot />
      </div>
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
