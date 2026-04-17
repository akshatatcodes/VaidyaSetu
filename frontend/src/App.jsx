import React, { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
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
import ThemeToggle from './components/ThemeToggle';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

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
          const onboardingDone = Boolean(profile?.onboardingCompleted ?? profile?.onboardingComplete);
          if (!onboardingDone) {
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
      {/* md:ml-72 offsets fixed sidebar (w-72); min-w-0 prevents flex overflow under sidebar */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300 md:ml-72 h-full md:h-screen overflow-y-auto overflow-x-hidden scrollbar-hide">
        <main className="flex-1 p-4 pt-20 sm:p-6 md:pt-6 md:p-12 w-full max-w-[100vw] min-w-0 vs-main-content bg-transparent dark:bg-transparent pb-24 md:pb-12 text-slate-900 dark:text-white">
          <ErrorBoundary>
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
          </ErrorBoundary>
          
          <DisclaimerBanner />
        </main>
        
        <Chatbot />
      </div>

      <ThemeToggle />
    </div>
  );
};

const AuthPage = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden transition-colors duration-500 bg-slate-50 dark:bg-[#030712] p-4 sm:p-8">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full dark:bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full dark:bg-blue-500/10 blur-[120px] pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row w-full max-w-6xl mx-auto items-center justify-center gap-12 lg:gap-20 z-10">
        {/* Left Side: Branding (Visible on lg+) */}
        <div className="hidden lg:flex flex-col flex-1 min-w-0 space-y-8 text-left animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 p-3 bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20">
              <Loader2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white truncate">
              VaidyaSetu
            </h2>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 leading-[1.1]">
              Your AI-Powered <br /> Health Sanctuary.
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
              Experience the future of personal healthcare with intelligent tracking, predictive analysis, and medical record management.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {['Secure Data', 'AI Diagnostics', 'Real-time Alerts'].map((feature) => (
              <span key={feature} className="px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold backdrop-blur-md">
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side: Auth Form (No extra box wrapper) */}
        <div className="w-full lg:w-auto flex-shrink-0 transition-all duration-500 flex justify-center">
            {children}
        </div>
      </div>
      
      <div className="absolute top-8 right-8 z-[100]">
        <ThemeToggle />
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER"}>
        <BrowserRouter>
          <ScrollToTop />
          <AuthWrapper />
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

const AuthWrapper = () => {
  const { theme } = useTheme();
  const clerkAppearance = {
    baseTheme: theme === 'dark' ? dark : undefined,
    variables: {
      colorPrimary: '#10b981',
    },
    elements: {
      card: {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderRadius: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      },
      navbar: {
        display: 'none',
      },
    }
  };

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Navigate to="/sign-in" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/sign-in/*" element={<AuthPage><SignIn routing="path" path="/sign-in" appearance={clerkAppearance} /></AuthPage>} />
      <Route path="/sign-up/*" element={<AuthPage><SignUp routing="path" path="/sign-up" appearance={clerkAppearance} /></AuthPage>} />

      {/* Application Routes */}
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
