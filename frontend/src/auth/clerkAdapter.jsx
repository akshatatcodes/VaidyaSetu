import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Check, Sparkles, UserPlus, Shield, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config/api';

const DEFAULT_DEMO_USER = {
  id: 'demo_user_123',
  fullName: 'Rajesh Sharma',
  firstName: 'Rajesh',
  lastName: 'Sharma',
  primaryEmailAddress: { emailAddress: 'rajesh.sharma@example.com' },
  primaryPhoneNumber: { phoneNumber: '+91 9876543210' },
  imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  username: 'rajesh_sharma'
};

const AuthContext = createContext(null);

export const resolveClerkUser = () => {
  // 1. Direct clerk user
  const direct = localStorage.getItem('vaidya_auth_user');
  if (direct) {
    try { return JSON.parse(direct); } catch (e) {}
  }
  // 2. Modern vaidya_auth_session
  const sessionStr = localStorage.getItem('vaidya_auth_session');
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (session && session.user) {
        const u = session.user;
        const effectiveId = u.patientId || u.id || u.mobile || u.registrationNumber || u._id;
        return {
          id: effectiveId,
          patientId: u.patientId || u.id,
          abhaId: u.abhaId,
          fullName: u.patientName || u.doctorName || u.name || 'Ayush User',
          firstName: (u.patientName || u.doctorName || u.name || 'Ayush').split(' ')[0],
          lastName: (u.patientName || u.doctorName || u.name || '').split(' ').slice(1).join(' '),
          primaryEmailAddress: { emailAddress: u.email || `${u.mobile || 'user'}@vaidyasetu.gov.in` },
          primaryPhoneNumber: { phoneNumber: u.mobile || '' },
          imageUrl: u.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          username: u.abhaId || u.registrationNumber || u.mobile || 'user',
          role: session.role
        };
      }
    } catch (e) {}
  }
  return null;
};

export const ClerkProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => resolveClerkUser());
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    const handleSync = () => {
      setCurrentUser(resolveClerkUser());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('vaidya:auth-change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('vaidya:auth-change', handleSync);
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('vaidya_auth_user');
    localStorage.removeItem('vaidya_auth_session');
    localStorage.removeItem('vaidya_active_role');
    setCurrentUser(null);
    window.dispatchEvent(new Event('vaidya:auth-change'));
  };

  const signIn = async (user) => {
    localStorage.setItem('vaidya_auth_user', JSON.stringify(user));
    setCurrentUser(user);
    window.dispatchEvent(new Event('vaidya:auth-change'));
  };

  return (
    <AuthContext.Provider value={{
      user: currentUser,
      isLoaded,
      isSignedIn: Boolean(currentUser),
      signOut,
      signIn
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return { user: null, isLoaded: true, isSignedIn: false };
  }
  return {
    user: ctx.user,
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn
  };
};

export const useClerk = () => {
  const ctx = useContext(AuthContext);
  return {
    signOut: ctx ? ctx.signOut : () => {},
    openSignIn: () => {},
    openSignUp: () => {}
  };
};

export const SignedIn = ({ children }) => {
  const { isSignedIn } = useUser();
  return isSignedIn ? <>{children}</> : null;
};

export const SignedOut = ({ children }) => {
  const { isSignedIn } = useUser();
  return !isSignedIn ? <>{children}</> : null;
};

export const SignInButton = ({ children, mode }) => {
  const navigate = useNavigate();
  return (
    <span onClick={() => navigate('/sign-in')} className="cursor-pointer">
      {children || 'Sign In'}
    </span>
  );
};

export const UserButton = ({ appearance }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full ring-2 ring-emerald-500/30 flex items-center justify-center font-bold text-xs bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-md hover:scale-105 transition-all cursor-pointer overflow-hidden"
        title={user.fullName || 'User Profile'}
      >
        {user.imageUrl ? (
          <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span>{user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}</span>
        )}
      </button>

      {open && (
        <div 
          className="absolute right-0 bottom-full mb-2 md:bottom-auto md:top-full md:mt-2 w-64 rounded-2xl bg-white dark:bg-[#0b1320] border border-gray-200 dark:border-white/10 shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
          onClick={() => setOpen(false)}
        >
          <div className="px-3 py-2 border-b border-gray-100 dark:border-white/5">
            <p className="text-xs font-bold truncate">{user.fullName}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user.primaryEmailAddress?.emailAddress}</p>
            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              <Sparkles className="w-2.5 h-2.5" /> Active Session
            </span>
          </div>

          <div className="py-1">
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-emerald-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-emerald-500" />
              Health Profile
            </button>
            <button
              onClick={() => {
                signOut();
                navigate('/sign-in');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SignIn = () => {
  const { signIn } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [email, setEmail] = useState('rajesh.sharma@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check if user exists in local storage
    const allUsers = JSON.parse(localStorage.getItem('vaidya_all_users') || '[]');
    const matchedUser = allUsers.find(u => u.primaryEmailAddress?.emailAddress?.toLowerCase() === email.toLowerCase());

    setTimeout(() => {
      if (matchedUser) {
        if (signIn) signIn(matchedUser);
        navigate('/');
      } else if (email.toLowerCase().includes('rajesh') || email.toLowerCase().includes('demo')) {
        if (signIn) signIn(DEFAULT_DEMO_USER);
        navigate('/');
      } else {
        // Fallback: create or log in
        const userObj = {
          id: 'user_' + btoa(email).slice(0, 10),
          fullName: email.split('@')[0],
          firstName: email.split('@')[0],
          lastName: '',
          primaryEmailAddress: { emailAddress: email },
          primaryPhoneNumber: { phoneNumber: '+91 9000000000' }
        };
        if (signIn) signIn(userObj);
        navigate('/');
      }
    }, 400);
  };

  return (
    <div className="w-full max-w-md bg-white/95 dark:bg-[#070e1b]/95 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-8 text-slate-800 dark:text-white space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Welcome Back</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">Sign in to access your clinical bio-ledger & records</p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            required
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            required
            placeholder="Enter password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-400 transition-all cursor-pointer"
        >
          {loading ? 'Authenticating...' : 'Sign In to Account'}
        </button>
      </form>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-gray-200 dark:border-white/10 w-full" />
        <span className="bg-white dark:bg-[#070e1b] px-3 text-[10px] uppercase font-bold text-gray-400 absolute">Or Continue With</span>
      </div>

      <button
        onClick={() => {
          if (signIn) signIn(DEFAULT_DEMO_USER);
          navigate('/');
        }}
        type="button"
        className="w-full py-3 px-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-emerald-500" />
        One-Click Demo Login (Rajesh Sharma)
      </button>

      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">
          Don't have an account?{' '}
          <Link to="/sign-up" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export const SignUp = () => {
  const { signIn } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    gender: 'Male'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const clerkId = 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newUser = {
        id: clerkId,
        fullName: formData.name,
        firstName: formData.name.split(' ')[0] || formData.name,
        lastName: formData.name.split(' ').slice(1).join(' ') || '',
        primaryEmailAddress: { emailAddress: formData.email },
        primaryPhoneNumber: { phoneNumber: formData.phone }
      };

      // Create initial backend profile
      await axios.post(`${API_URL}/user/profile`, {
        clerkId: clerkId,
        name: formData.name,
        phone: formData.phone,
        age: Number(formData.age) || 30,
        gender: formData.gender,
        height: 170,
        weight: 68,
        activityLevel: 'Moderate',
        sleepHours: 7,
        stressLevel: 'Low',
        dietType: 'Vegetarian',
        sugarIntake: 'Low',
        saltIntake: 'Normal',
        eatsLeafyGreens: true,
        eatsFruits: true,
        junkFoodFrequency: 'Rarely',
        allergies: [],
        medicalHistory: []
      }).catch(err => {
        console.warn('Backend profile creation note:', err.message);
      });

      // Save to local accounts registry
      const allUsers = JSON.parse(localStorage.getItem('vaidya_all_users') || '[]');
      allUsers.push(newUser);
      localStorage.setItem('vaidya_all_users', JSON.stringify(allUsers));

      // Sign user in
      if (signIn) signIn(newUser);
      navigate('/');
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Registration failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white/95 dark:bg-[#070e1b]/95 backdrop-blur-2xl rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] p-8 text-slate-800 dark:text-white space-y-5">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Create Account</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">Register to initialize your personalized clinical profile</p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            required
            placeholder="e.g. Aditi Roy"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
              placeholder="e.g. 28"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Email Address</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            required
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            required
            placeholder="+91 9876543210"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 mb-1">Password</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            required
            placeholder="Create password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-400 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>
      </form>

      <div className="text-center pt-1">
        <p className="text-xs text-gray-500">
          Already registered?{' '}
          <Link to="/sign-in" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};
