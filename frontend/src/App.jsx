import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, useUser, SignIn, SignUp } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Prescriptions from './pages/Prescriptions';
import Privacy from './pages/Privacy';
import HealthProfile from './pages/HealthProfile';
import ChangeHistory from './pages/ChangeHistory';
import ProfileEditor from './pages/ProfileEditor';
import Settings from './pages/Settings';
import Chatbot from './components/Chatbot';
import { Loader2, Sun, Moon } from 'lucide-react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import DisclaimerBanner from './components/DisclaimerBanner';
import { ThemeProvider, useTheme } from './context/ThemeContext';

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

// Main app shell — checks onboarding status and redirects if needed
const AppLayout = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

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
  }, [isLoaded, user]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030712]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full vs-main-content">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with theme toggle */}
        <div className="flex justify-end items-center px-4 sm:px-8 md:px-12 pt-4 md:pt-6">
          <button
            id="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className={`
              relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold
              border transition-all duration-300 shadow-lg hover:scale-105 active:scale-95
              ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-yellow-300 hover:bg-gray-700 hover:border-emerald-500/50 shadow-gray-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-500 shadow-emerald-100'
              }
            `}
          >
            <span className={`transition-transform duration-300 ${isDark ? 'rotate-0' : 'rotate-180'}`}>
              {isDark ? (
                <Sun className="w-4 h-4 text-yellow-300" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-600" />
              )}
            </span>
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <main className="p-4 sm:p-8 md:p-12 w-full overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<HealthProfile />} />
            <Route path="/profile/edit" element={<ProfileEditor />} />
            <Route path="/history" element={<ChangeHistory />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/vitals" element={<Dashboard />} />
            <Route path="/alerts" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <DisclaimerBanner />
        <Chatbot />
      </div>
    </div>
  );
};

// Auth Page wrapper — centers the Clerk widget on a dark background
const AuthPage = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center bg-[#030712] py-12">
    {children}
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER">
        <BrowserRouter>
          <Routes>
            {/* Redirect /login to /sign-in for backward compat */}
            <Route path="/login" element={<Navigate to="/sign-in" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            {/* Public: Clerk Sign In */}
            <Route
              path="/sign-in/*"
              element={
                <AuthPage>
                  <SignIn routing="path" path="/sign-in" />
                </AuthPage>
              }
            />

            {/* Public: Clerk Sign Up */}
            <Route
              path="/sign-up/*"
              element={
                <AuthPage>
                  <SignUp routing="path" path="/sign-up" />
                </AuthPage>
              }
            />

            {/* Protected: Onboarding */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Protected: Main App */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}

export default App;
