import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const CaregiverContext = createContext();

export const CaregiverProvider = ({ children }) => {
  const [isCaregiverMode, setIsCaregiverMode] = useState(false);
  const [caregiverInfo, setCaregiverInfo] = useState({
    caregiverName: '',
    caregiverMobile: '',
    relation: 'Family Member'
  });
  const [currentlyManaging, setCurrentlyManaging] = useState(null); // { patientName, abhaId, age, gender, relation }
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [consentVerified, setConsentVerified] = useState(false);

  // Restore caregiver state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vaidya_caregiver_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isCaregiverMode) {
          setIsCaregiverMode(true);
          setCaregiverInfo(parsed.caregiverInfo || {});
          setCurrentlyManaging(parsed.currentlyManaging || null);
          setConsentVerified(Boolean(parsed.consentVerified));
        }
      }
    } catch (e) {
      console.warn('[CaregiverContext] Failed to restore caregiver state:', e);
    }
  }, []);

  const saveCaregiverState = (stateObj) => {
    try {
      localStorage.setItem('vaidya_caregiver_session', JSON.stringify(stateObj));
    } catch (e) {
      console.warn('[CaregiverContext] Failed to save state:', e);
    }
  };

  const enableCaregiverMode = ({ caregiverName, caregiverMobile, relation = 'Family Member', patientName, abhaId, age, gender }) => {
    const info = { caregiverName, caregiverMobile, relation };
    const managing = patientName ? { patientName, abhaId, age, gender, relation } : null;
    
    setIsCaregiverMode(true);
    setCaregiverInfo(info);
    setCurrentlyManaging(managing);
    setConsentVerified(false);

    saveCaregiverState({
      isCaregiverMode: true,
      caregiverInfo: info,
      currentlyManaging: managing,
      consentVerified: false
    });
  };

  const switchPatient = (patient) => {
    setCurrentlyManaging(patient);
    setConsentVerified(false);
    saveCaregiverState({
      isCaregiverMode: true,
      caregiverInfo,
      currentlyManaging: patient,
      consentVerified: false
    });
  };

  const verifyCaregiverConsent = async (otpCode) => {
    // Demo verification logic: accept any 4+ digit OTP or default demo OTP '1234'
    if (otpCode && String(otpCode).trim().length >= 4) {
      setConsentVerified(true);
      saveCaregiverState({
        isCaregiverMode: true,
        caregiverInfo,
        currentlyManaging,
        consentVerified: true
      });
      return { success: true, message: 'Caregiver consent verified successfully.' };
    }
    return { success: false, message: 'Invalid OTP code. Please enter 4 to 6 digits.' };
  };

  const fetchCaregiverPatients = async (mobile, token) => {
    if (!mobile) return [];
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/kiosk/caregiver/${mobile}/patients`, { headers });
      if (res.data.status === 'success') {
        const patients = res.data.data || [];
        setLinkedPatients(patients);
        return patients;
      }
    } catch (err) {
      console.warn('[CaregiverContext] Fetch patients failed:', err.message);
    }
    return [];
  };

  const exitCaregiverMode = () => {
    setIsCaregiverMode(false);
    setCaregiverInfo({ caregiverName: '', caregiverMobile: '', relation: 'Family Member' });
    setCurrentlyManaging(null);
    setConsentVerified(false);
    localStorage.removeItem('vaidya_caregiver_session');
  };

  return (
    <CaregiverContext.Provider
      value={{
        isCaregiverMode,
        caregiverInfo,
        currentlyManaging,
        linkedPatients,
        consentVerified,
        enableCaregiverMode,
        switchPatient,
        verifyCaregiverConsent,
        fetchCaregiverPatients,
        exitCaregiverMode
      }}
    >
      {children}
    </CaregiverContext.Provider>
  );
};

export const useCaregiver = () => {
  const context = useContext(CaregiverContext);
  if (!context) {
    throw new Error('useCaregiver must be used within a CaregiverProvider');
  }
  return context;
};
