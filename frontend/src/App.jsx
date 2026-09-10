import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

// Context
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CaregiverProvider } from './context/CaregiverContext';

// Components
import Sidebar from './components/Sidebar';
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
import Vitals from './pages/Vitals';
import MyMedicines from './pages/MyMedicines';
import KioskIntake from './pages/KioskIntake';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorHome from './pages/doctor/DoctorHome';
import DoctorQueue from './pages/doctor/DoctorQueue';
import DoctorConsultation from './pages/doctor/DoctorConsultation';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorFollowUps from './pages/doctor/DoctorFollowUps';
import DoctorReferrals from './pages/doctor/DoctorReferrals';
import DoctorProfile from './pages/doctor/DoctorProfile';
import AuthGateway from './pages/AuthGateway';
import AccessDenied from './pages/AccessDenied';
import AdminDashboard from './pages/AdminDashboard';
import LabDashboard from './pages/LabDashboard';
import LabProfile from './pages/lab/LabProfile';
import QueueDisplay from './pages/QueueDisplay';
import HelpSupport from './pages/HelpSupport';
import MyConsent from './pages/MyConsent';
import FamilyMembers from './pages/FamilyMembers';
import LiveQueueStatus from './pages/LiveQueueStatus';
import ReferralView from './pages/ReferralView';
import ABHALinkStatus from './pages/ABHALinkStatus';

import { API_URL } from './config/api';

// Phase 51 — Centralized Role Authorization System & Route QA Matrix
const RoleRoute = ({ children, allowedRole, allowedRoles }) => {
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

  // 1. Unauthenticated users must log in unless accessing kiosk
  const rolesList = allowedRoles || (allowedRole ? [allowedRole] : []);
  const isKioskAllowed = rolesList.includes('kiosk');

  if (!isAuthenticated && !isKioskAllowed) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = userRole || 'patient';

  // 2. Route QA Matrix Enforcement (§51):
  // /patient -> Staff (doctor/lab/admin) redirect to their home portal
  // /doctor, /lab, /admin -> Unauthorized roles denied access
  if (rolesList.length > 0 && !rolesList.includes(currentRole)) {
    if (rolesList.includes('patient')) {
      if (currentRole === 'doctor') return <Navigate to="/doctor" replace />;
      if (currentRole === 'lab') return <Navigate to="/lab" replace />;
      if (currentRole === 'admin') return <Navigate to="/admin" replace />;
    }
    return <AccessDenied requiredRole={rolesList.join(' or ')} currentRole={currentRole} />;
  }

  return children;
};

// Centralized Role Wrappers (§34)
const ProtectedRoute = ({ children, allowedRole }) => <RoleRoute allowedRole={allowedRole}>{children}</RoleRoute>;
const DoctorRoute = ({ children }) => <RoleRoute allowedRole="doctor">{children}</RoleRoute>;
const PatientRoute = ({ children }) => <RoleRoute allowedRole="patient">{children}</RoleRoute>;
const AdminRoute = ({ children }) => <RoleRoute allowedRole="admin">{children}</RoleRoute>;
const LabRoute = ({ children }) => <RoleRoute allowedRole="lab">{children}</RoleRoute>;

// Main app shell
const AppLayout = () => {
  const { theme } = useTheme();
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Register Push Service Worker Foundation
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          console.log('[SW] Service Worker Registered:', reg.scope);
        }).catch(err => console.error('[SW] Registration failed:', err));
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
              <Route path="/patient" element={<PatientRoute><Dashboard /></PatientRoute>} />
              <Route path="/patient/opd" element={<KioskIntake />} />
              <Route path="/patient/visits" element={<PatientRoute><ChangeHistory /></PatientRoute>} />
              <Route path="/patient/followups" element={<PatientRoute><LiveQueueStatus /></PatientRoute>} />
              <Route path="/patient/referrals" element={<PatientRoute><ReferralView /></PatientRoute>} />
              <Route path="/patient/medicines" element={<PatientRoute><MyMedicines /></PatientRoute>} />
              <Route path="/patient/labs" element={<PatientRoute><Prescriptions /></PatientRoute>} />
              <Route path="/patient/documents" element={<PatientRoute><Prescriptions /></PatientRoute>} />
              <Route path="/patient/vitals" element={<PatientRoute><Vitals /></PatientRoute>} />
              <Route path="/patient/queue" element={<PatientRoute><LiveQueueStatus /></PatientRoute>} />
              <Route path="/patient/appointments" element={<PatientRoute><LiveQueueStatus /></PatientRoute>} />
              <Route path="/patient/family" element={<PatientRoute><FamilyMembers /></PatientRoute>} />
              <Route path="/patient/profile" element={<PatientRoute><HealthProfile /></PatientRoute>} />
              <Route path="/patient/abha" element={<PatientRoute><ABHALinkStatus /></PatientRoute>} />
              <Route path="/patient/consent" element={<PatientRoute><MyConsent /></PatientRoute>} />
              <Route path="/patient/settings" element={<PatientRoute><Settings /></PatientRoute>} />
              <Route path="/patient/help" element={<PatientRoute><HelpSupport /></PatientRoute>} />
              
              {/* Doctor Only Routes: Modular Page Components per Phase 36 */}
              <Route path="/doctor" element={<DoctorRoute><DoctorHome /></DoctorRoute>} />
              <Route path="/doctor/queue" element={<DoctorRoute><DoctorQueue /></DoctorRoute>} />
              <Route path="/doctor/queue/:encounterId" element={<DoctorRoute><DoctorQueue /></DoctorRoute>} />
              <Route path="/doctor/consultation/:encounterId" element={<DoctorRoute><DoctorConsultation /></DoctorRoute>} />
              <Route path="/doctor/patients" element={<DoctorRoute><DoctorPatients /></DoctorRoute>} />
              <Route path="/doctor/patients/:patientId" element={<DoctorRoute><DoctorPatients /></DoctorRoute>} />
              <Route path="/doctor/followups" element={<DoctorRoute><DoctorFollowUps /></DoctorRoute>} />
              <Route path="/doctor/followups/:id" element={<DoctorRoute><DoctorFollowUps /></DoctorRoute>} />
              <Route path="/doctor/referrals" element={<DoctorRoute><DoctorReferrals /></DoctorRoute>} />
              <Route path="/doctor/profile" element={<DoctorRoute><DoctorProfile /></DoctorRoute>} />
              <Route path="/doctor/settings" element={<DoctorRoute><Settings /></DoctorRoute>} />
              {/* Admin Only: Operations Console & Sub-pages per Phase 30 */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard initialTab="overview" /></AdminRoute>} />
              <Route path="/admin/hospitals" element={<AdminRoute><AdminDashboard initialTab="hospitals" /></AdminRoute>} />
              <Route path="/admin/departments" element={<AdminRoute><AdminDashboard initialTab="departments" /></AdminRoute>} />
              <Route path="/admin/labs" element={<AdminRoute><AdminDashboard initialTab="labs" /></AdminRoute>} />
              <Route path="/admin/doctors" element={<AdminRoute><AdminDashboard initialTab="doctors" /></AdminRoute>} />
              <Route path="/admin/kiosks" element={<AdminRoute><AdminDashboard initialTab="kiosks" /></AdminRoute>} />
              <Route path="/admin/queues" element={<AdminRoute><AdminDashboard initialTab="queues" /></AdminRoute>} />
              <Route path="/admin/schedules" element={<AdminRoute><AdminDashboard initialTab="schedules" /></AdminRoute>} />
              <Route path="/admin/followup-capacity" element={<AdminRoute><AdminDashboard initialTab="followup-capacity" /></AdminRoute>} />
              <Route path="/admin/audit" element={<AdminRoute><AdminDashboard initialTab="audit" /></AdminRoute>} />
              <Route path="/admin/system-logs" element={<AdminRoute><AdminDashboard initialTab="system-logs" /></AdminRoute>} />
              <Route path="/admin/profile" element={<AdminRoute><AdminDashboard initialTab="profile" /></AdminRoute>} />
              <Route path="/admin/settings" element={<AdminRoute><AdminDashboard initialTab="settings" /></AdminRoute>} />
              {/* Lab Only: Diagnostic Result Workbench & Sub-pages */}
              <Route path="/lab" element={<LabRoute><LabDashboard initialTab="todays_samples" /></LabRoute>} />
              <Route path="/lab/queue" element={<LabRoute><LabDashboard initialTab="pending" /></LabRoute>} />
              <Route path="/lab/orders" element={<LabRoute><LabDashboard initialTab="in_progress" /></LabRoute>} />
              <Route path="/lab/orders/:orderId" element={<LabRoute><LabDashboard initialTab="pending" /></LabRoute>} />
              <Route path="/lab/results" element={<LabRoute><LabDashboard initialTab="completed" /></LabRoute>} />
              <Route path="/lab/verified" element={<LabRoute><LabDashboard initialTab="verified" /></LabRoute>} />
              <Route path="/lab/results/:resultId" element={<LabRoute><LabDashboard initialTab="verified" /></LabRoute>} />
              <Route path="/lab/critical" element={<LabRoute><LabDashboard initialTab="critical" /></LabRoute>} />
              <Route path="/lab/followups" element={<LabRoute><LabDashboard initialTab="followup" /></LabRoute>} />
              <Route path="/lab/profile" element={<LabRoute><LabProfile /></LabRoute>} />
              <Route path="/lab/settings" element={<LabRoute><Settings /></LabRoute>} />

              {/* Patient Dedicated Routes (/patient/*) */}
              <Route path="/patient/timeline" element={<PatientRoute><ChangeHistory /></PatientRoute>} />
              <Route path="/patient/visits" element={<PatientRoute><ChangeHistory /></PatientRoute>} />
              <Route path="/patient/records" element={<PatientRoute><Prescriptions /></PatientRoute>} />
              <Route path="/patient/medicines" element={<PatientRoute><MyMedicines /></PatientRoute>} />
              <Route path="/patient/vitals" element={<PatientRoute><Vitals /></PatientRoute>} />
              <Route path="/patient/queue" element={<PatientRoute><LiveQueueStatus /></PatientRoute>} />
              <Route path="/patient/appointments" element={<PatientRoute><LiveQueueStatus /></PatientRoute>} />
              <Route path="/patient/family" element={<PatientRoute><FamilyMembers /></PatientRoute>} />
              <Route path="/patient/profile" element={<PatientRoute><HealthProfile /></PatientRoute>} />
              <Route path="/patient/profile/edit" element={<PatientRoute><ProfileEditor /></PatientRoute>} />
              <Route path="/patient/history" element={<PatientRoute><ChangeHistory /></PatientRoute>} />
              <Route path="/patient/prescriptions" element={<PatientRoute><Prescriptions /></PatientRoute>} />
              <Route path="/patient/referrals" element={<PatientRoute><ReferralView /></PatientRoute>} />
              <Route path="/patient/consent" element={<PatientRoute><MyConsent /></PatientRoute>} />
              <Route path="/patient/abha" element={<PatientRoute><ABHALinkStatus /></PatientRoute>} />
              <Route path="/patient/settings" element={<PatientRoute><Settings /></PatientRoute>} />
              <Route path="/patient/help" element={<HelpSupport />} />

              {/* Kiosk Dedicated Routes (/kiosk/*) */}
              <Route path="/kiosk" element={<KioskIntake />} />
              <Route path="/kiosk/intake" element={<KioskIntake />} />
              <Route path="/kiosk/opd" element={<KioskIntake />} />

              {/* Public Routes (/public/*) */}
              <Route path="/public/help" element={<HelpSupport />} />
              <Route path="/public/privacy" element={<Privacy />} />
              <Route path="/public/terms" element={<Terms />} />
              <Route path="/help" element={<HelpSupport />} />
              <Route path="/support" element={<HelpSupport />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Legacy un-namespaced clinical routes redirect to role-owned routes */}
              <Route path="/profile" element={<Navigate to="/patient/profile" replace />} />
              <Route path="/profile/edit" element={<Navigate to="/patient/profile/edit" replace />} />
              <Route path="/history" element={<Navigate to="/patient/history" replace />} />
              <Route path="/timeline" element={<Navigate to="/patient/timeline" replace />} />
              <Route path="/visits" element={<Navigate to="/patient/visits" replace />} />
              <Route path="/records" element={<Navigate to="/patient/records" replace />} />
              <Route path="/medicines" element={<Navigate to="/patient/medicines" replace />} />
              <Route path="/prescriptions" element={<Navigate to="/patient/prescriptions" replace />} />
              <Route path="/vitals" element={<Navigate to="/patient/vitals" replace />} />
              <Route path="/consent/my" element={<Navigate to="/patient/consent" replace />} />
              <Route path="/consent" element={<Navigate to="/patient/consent" replace />} />
              <Route path="/family" element={<Navigate to="/patient/family" replace />} />
              <Route path="/queue" element={<Navigate to="/patient/queue" replace />} />
              <Route path="/appointments" element={<Navigate to="/patient/queue" replace />} />
              <Route path="/referrals" element={<Navigate to="/patient/referrals" replace />} />
              <Route path="/abha" element={<Navigate to="/patient/abha" replace />} />
              <Route path="/settings" element={<Navigate to="/patient/settings" replace />} />
            </Routes>
          </ErrorBoundary>
          
          <DisclaimerBanner />
        </main>
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
  return (
    <ThemeProvider>
      <AuthProvider>
        <CaregiverProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AuthWrapper />
          </BrowserRouter>
        </CaregiverProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
