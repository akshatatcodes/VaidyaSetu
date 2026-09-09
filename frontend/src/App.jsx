import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

// Context
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CaregiverProvider } from './context/CaregiverContext';

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
import KioskIntake from './pages/KioskIntake';
import DoctorDashboard from './pages/DoctorDashboard';
import AuthGateway from './pages/AuthGateway';
import AccessDenied from './pages/AccessDenied';
import AdminDashboard from './pages/AdminDashboard';
import LabDashboard from './pages/LabDashboard';
import QueueDisplay from './pages/QueueDisplay';
import HelpSupport from './pages/HelpSupport';

import { API_URL } from './config/api';

// Guard: Strict Authentication and Role Authorization
const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, userRole, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#030712] transition-colors duration-500">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Verifying VaidyaSetu security clearance...</p>
        </div>
      </div>
    );
  }

  // By default, unauthenticated users MUST be redirected to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role authorization guard
  if (allowedRole && userRole !== allowedRole) {
    if (allowedRole === 'doctor') {
      return <AccessDenied requiredRole="doctor" />;
    }
    if (allowedRole === 'patient') {
      return <Navigate to="/doctor" replace />;
    }
  }

  return children;
};

// Sub-route guard for doctor exclusive pages
const DoctorRoute = ({ children }) => {
  const { userRole } = useAuth();
  if (userRole !== 'doctor') {
    return <AccessDenied requiredRole="doctor" />;
  }
  return children;
};

// Sub-route guard for patient exclusive pages
const PatientRoute = ({ children }) => {
  const { userRole } = useAuth();
  if (userRole === 'doctor') {
    return <Navigate to="/doctor" replace />;
  }
  return children;
};

// Sub-route guard for admin pages
const AdminRoute = ({ children }) => {
  const { userRole } = useAuth();
  if (userRole !== 'admin') {
    return <AccessDenied requiredRole="admin" />;
  }
  return children;
};

// Sub-route guard for lab pages
const LabRoute = ({ children }) => {
  const { userRole } = useAuth();
  if (userRole !== 'lab') {
    return <AccessDenied requiredRole="lab" />;
  }
  return children;
};

// Main app shell
const AppLayout = () => {
  const { theme } = useTheme();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Step 63: Register Push Service Worker Foundation
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          console.log('[SW] Service Worker Registered:', reg.scope);
        }).catch(err => console.error('[SW] Registration failed:', err));
      });
    }

    // Only run patient onboarding check for patient accounts
    const patientId = currentUser?._id || currentUser?.id;
    if (userRole === 'patient' && patientId && typeof patientId === 'string' && !patientId.startsWith('demo-')) {
      axios.get(`${API_URL}/profile/${patientId}`)
        .then((res) => {
          if (res.data?.status === 'success') {
            const profile = res.data.data;
            const onboardingDone = Boolean(profile?.onboardingCompleted ?? profile?.onboardingComplete);
            if (!onboardingDone) {
              navigate('/onboarding', { replace: true });
            }
          }
        })
        .catch(() => {
          // Graceful fallback
        });
    }
  }, [currentUser, userRole, navigate]);

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
              {/* Patient Only Route: Root lands on Health Sanctuary for patients */}
              <Route path="/" element={<PatientRoute><Dashboard /></PatientRoute>} />
              
              {/* Doctor Only Route: Clinical Cockpit with AI Pre-Consultation Evidence */}
              <Route path="/doctor" element={<DoctorRoute><DoctorDashboard /></DoctorRoute>} />
              {/* Admin Only: Operations Console (Phase 10) */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              {/* Lab Only: Diagnostic Result Workbench (Phase 10) */}
              <Route path="/lab" element={<LabRoute><LabDashboard /></LabRoute>} />

              {/* Patient Dedicated 5-Tab Architecture Routes */}
              <Route path="/visits" element={<PatientRoute><ChangeHistory /></PatientRoute>} />
              <Route path="/records" element={<PatientRoute><Prescriptions /></PatientRoute>} />
              <Route path="/medications" element={<PatientRoute><MedicationSchedule /></PatientRoute>} />
              <Route path="/medicines" element={<PatientRoute><MyMedicines /></PatientRoute>} />
              <Route path="/help" element={<HelpSupport />} />
              <Route path="/support" element={<HelpSupport />} />

              {/* Shared Role Clinical Routes */}
              <Route path="/kiosk" element={<KioskIntake />} />
              <Route path="/profile" element={<HealthProfile />} />
              <Route path="/profile/edit" element={<ProfileEditor />} />
              <Route path="/history" element={<ChangeHistory />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/vitals" element={<Vitals />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/alerts/settings" element={<AlertSettings />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
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

const AuthWrapper = () => {
  return (
    <Routes>
      {/* ── Separate Role Authentication Gateways ── */}
      <Route path="/login" element={<AuthGateway />} />
      <Route path="/auth" element={<AuthGateway />} />
      <Route path="/auth/patient" element={<AuthGateway initialPortal="patient" />} />
      <Route path="/auth/doctor" element={<AuthGateway initialPortal="doctor" />} />
      <Route path="/auth/lab" element={<AuthGateway initialPortal="lab" />} />
      <Route path="/auth/admin" element={<AuthGateway initialPortal="admin" />} />

      {/* Legacy auth route redirects to unified role gateway */}
      <Route path="/sign-in/*" element={<Navigate to="/login" replace />} />
      <Route path="/sign-up/*" element={<Navigate to="/login" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      {/* Kiosk Hardware Terminal */}
      <Route path="/kiosk-terminal" element={
        <ProtectedRoute>
          <KioskIntake />
        </ProtectedRoute>
      } />
      <Route path="/queue-board" element={<QueueDisplay />} />
      <Route path="/queue-board/:department" element={<QueueDisplay />} />

      {/* Standalone Doctor Station alias */}
      <Route path="/doctor-station" element={
        <ProtectedRoute allowedRole="doctor">
          <DoctorDashboard />
        </ProtectedRoute>
      } />

      {/* Patient Onboarding */}
      <Route path="/onboarding" element={
        <ProtectedRoute allowedRole="patient">
          <Onboarding />
        </ProtectedRoute>
      } />

      {/* Main Authenticated Application Shell */}
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
};

function App() {
  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    import.meta.env.GOOGLE_CLIENT_ID ||
    "YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER";

  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <CaregiverProvider>
            <BrowserRouter>
              <ScrollToTop />
              <AuthWrapper />
            </BrowserRouter>
          </CaregiverProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
