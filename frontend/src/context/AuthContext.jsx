import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'patient' | 'doctor' | 'admin' | 'lab' | null
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session from localStorage on boot (or initialize default demo patient)
  useEffect(() => {
    try {
      const savedSessionStr = localStorage.getItem('vaidya_auth_session');
      if (savedSessionStr) {
        const session = JSON.parse(savedSessionStr);
        if (session && session.token && session.role) {
          setIsAuthenticated(true);
          setUserRole(session.role);
          setCurrentUser(session.user);
          return;
        }
      }

      // No active session — require authentication
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentUser(null);
    } catch (e) {
      console.warn('Session restore error:', e);
      localStorage.removeItem('vaidya_auth_session');
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Login as Doctor
  const loginDoctor = async ({ identifier, mobile, email, password, department }) => {
    try {
      const res = await axios.post(`${API_URL}/auth/doctor/login`, {
        identifier: identifier || mobile || email,
        mobile,
        email,
        password,
        department
      });

      if (res.data.status === 'success') {
        const { role, token, doctor } = res.data.data;
        const session = {
          role,
          token,
          user: doctor
        };
        localStorage.setItem('vaidya_auth_session', JSON.stringify(session));
        localStorage.setItem('vaidya_active_role', 'doctor');
        setIsAuthenticated(true);
        setUserRole('doctor');
        setCurrentUser(doctor);
        window.dispatchEvent(new Event('vaidya:auth-change'));
        return { success: true, role: 'doctor', user: doctor };
      }
      return { success: false, message: res.data.message || 'Authentication failed' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message || 'Connection failed' 
      };
    }
  };

  // Register as Doctor
  const registerDoctor = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/doctor/register`, formData);
      if (res.data.status === 'success') {
        const { role, token, doctor } = res.data.data;
        const session = {
          role,
          token,
          user: doctor
        };
        localStorage.setItem('vaidya_auth_session', JSON.stringify(session));
        localStorage.setItem('vaidya_active_role', 'doctor');
        setIsAuthenticated(true);
        setUserRole('doctor');
        setCurrentUser(doctor);
        window.dispatchEvent(new Event('vaidya:auth-change'));
        return { success: true, role: 'doctor', user: doctor };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message || 'Registration failed' 
      };
    }
  };

  // Login as Patient
  const loginPatient = async ({ identifier, password }) => {
    try {
      const res = await axios.post(`${API_URL}/auth/patient/login`, {
        identifier,
        password
      });

      if (res.data.status === 'success') {
        const { role, token, patient } = res.data.data;
        const session = {
          role,
          token,
          user: patient
        };
        localStorage.setItem('vaidya_auth_session', JSON.stringify(session));
        localStorage.setItem('vaidya_active_role', 'patient');
        setIsAuthenticated(true);
        setUserRole('patient');
        setCurrentUser(patient);
        window.dispatchEvent(new Event('vaidya:auth-change'));
        return { success: true, role: 'patient', user: patient };
      }
      return { success: false, message: res.data.message || 'Authentication failed' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message || 'Connection failed' 
      };
    }
  };

  // Register as Patient
  const registerPatient = async (formData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/patient/register`, formData);
      if (res.data.status === 'success') {
        const { role, token, patient } = res.data.data;
        const session = {
          role,
          token,
          user: patient
        };
        localStorage.setItem('vaidya_auth_session', JSON.stringify(session));
        localStorage.setItem('vaidya_active_role', 'patient');
        setIsAuthenticated(true);
        setUserRole('patient');
        setCurrentUser(patient);
        window.dispatchEvent(new Event('vaidya:auth-change'));
        return { success: true, role: 'patient', user: patient };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || err.message || 'Registration failed' 
      };
    }
  };

  // Login as Lab Technician
  const loginLab = async ({ identifier, mobile, email, section }) => {
    try {
      const res = await axios.post(`${API_URL}/auth/lab/login`, {
        identifier: identifier || mobile || email,
        mobile,
        email,
        section
      });

      if (res.data.status === 'success') {
        const { role, token, technician } = res.data.data;
        const session = { role, token, user: technician };
        localStorage.setItem('vaidya_auth_session', JSON.stringify(session));
        localStorage.setItem('vaidya_active_role', 'lab');
        setIsAuthenticated(true);
        setUserRole('lab');
        setCurrentUser(technician);
        window.dispatchEvent(new Event('vaidya:auth-change'));
        return { success: true, role: 'lab', user: technician };
      }
      return { success: false, message: res.data.message || 'Authentication failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Connection failed'
      };
    }
  };

  // Login as Administrator
  const loginAdmin = async ({ identifier, adminPassword }) => {
    try {
      const res = await axios.post(`${API_URL}/auth/admin/login`, {
        identifier,
        adminPassword
      });

      if (res.data.status === 'success') {
        const { role, token, admin } = res.data.data;
        const session = { role, token, user: admin };
        localStorage.setItem('vaidya_auth_session', JSON.stringify(session));
        localStorage.setItem('vaidya_active_role', 'admin');
        setIsAuthenticated(true);
        setUserRole('admin');
        setCurrentUser(admin);
        window.dispatchEvent(new Event('vaidya:auth-change'));
        return { success: true, role: 'admin', user: admin };
      }
      return { success: false, message: res.data.message || 'Authentication failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Connection failed'
      };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('vaidya_auth_session');
    localStorage.removeItem('vaidya_active_role');
    localStorage.removeItem('vaidya_auth_user');
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    window.dispatchEvent(new Event('vaidya:auth-change'));
  };

  // Login as Patient with existing session/profile object (OTP & Family selection)
  const loginPatientSession = (patientUser, token = 'demo_patient_token') => {
    const session = {
      role: 'patient',
      token,
      user: patientUser
    };
    localStorage.setItem('vaidya_auth_session', JSON.stringify(session));
    localStorage.setItem('vaidya_active_role', 'patient');
    if (patientUser?.patientId || patientUser?._id) {
      localStorage.setItem('vaidya_patient_id', patientUser.patientId || patientUser._id);
    }
    setIsAuthenticated(true);
    setUserRole('patient');
    setCurrentUser(patientUser);
    window.dispatchEvent(new Event('vaidya:auth-change'));
    return { success: true, role: 'patient', user: patientUser };
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userRole,
        currentUser,
        authLoading,
        loginDoctor,
        registerDoctor,
        loginPatient,
        loginPatientSession,
        registerPatient,
        loginLab,
        loginAdmin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
