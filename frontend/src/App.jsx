import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Prescriptions from './pages/Prescriptions';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { GoogleOAuthProvider } from '@react-oauth/google';
import DisclaimerBanner from './components/DisclaimerBanner';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

// Main app shell — checks onboarding status and redirects if needed
const AppLayout = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;

    // Check if this user has completed onboarding
    axios.get(`${API_URL}/user/${user.id}`)
      .then((res) => {
        if (res.data?.status === 'success') {
          const profile = res.data.data;
          if (!profile.onboardingComplete) {
            navigate('/onboarding', { replace: true });
          }
        } else {
          // No profile found — send to onboarding
          navigate('/onboarding', { replace: true });
        }
      })
      .catch(() => {
        // On error (e.g. 404 no profile) — send to onboarding
        navigate('/onboarding', { replace: true });
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="p-4 sm:p-8 md:p-12 w-full overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/vitals" element={<Dashboard />} />
            <Route path="/alerts" element={<Dashboard />} />
          </Routes>
        </main>
        <DisclaimerBanner />
      </div>
    </div>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID_PLACEHOLDER">
      <BrowserRouter>
        <Routes>
          {/* Clerk default redirect alias */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Protected: Onboarding */}
          <Route
            path="/onboarding"
            element={
              <>
                <SignedIn>
                  <Onboarding />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Protected: Main App */}
          <Route
            path="/*"
            element={
              <>
                <SignedIn>
                  <AppLayout />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
