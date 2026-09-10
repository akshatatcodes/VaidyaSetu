import React, { useEffect, useState } from 'react';
import { ShieldCheck, Volume2, CheckCircle2, Lock, Sparkles, Check, X } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config/api';

const COPY = {
  en: {
    title: 'Patient Consent & Privacy Controls',
    subtitle: 'Select the data sharing scopes you wish to authorize for this consultation. All consent choices are revocable anytime from your dashboard.',
    audio: 'Read consent aloud',
    continue: 'Save Consent & Continue',
    required: 'Clinical Data Capture consent is required to proceed'
  },
  hi: {
    title: 'रोगी सहमति एवं गोपनीयता नियंत्रण',
    subtitle: 'इस परामर्श हेतु अपनी डेटा शेयरिंग अनुमतियाँ चुनें। आप अपनी सभी अनुमतियों को कभी भी अपने डैशबोर्ड से वापस ले (Revoke) सकते हैं।',
    audio: 'सहमति बोलकर सुनें',
    continue: 'सहमति सुरक्षित करें एवं आगे बढ़ें',
    required: 'आगे बढ़ने के लिए क्लिनिकल डेटा कैप्चर की सहमति अनिवार्य है'
  },
  mr: {
    title: 'रुग्ण संमती आणि गोपनीयता नियंत्रणे',
    subtitle: 'या तपासणीसाठी आपल्या डेटा सामायिकरणाच्या अनुमती निवडा. आपण सर्व संमती कधीही डॅशबोर्डवरून रद्द करू शकता.',
    audio: 'संमती ऐका',
    continue: 'संमती जतन करा आणि पुढे चला',
    required: 'पुढे जाण्यासाठी क्लिनिकल डेटा नोंदणीची संमती आवश्यक आहे'
  }
};

const PURPOSES = [
  {
    key: 'clinical_history',
    titleEn: 'Clinical History & Vitals Capture',
    titleHi: 'क्लिनिकल इतिहास एवं वाइटल्स कैप्चर',
    titleMr: 'क्लिनिकल इतिहास आणि वाइटल्स नोंदणी',
    descEn: 'Capture symptoms, vitals & Ayush Pariksha details for this OPD visit',
    descHi: 'इस ओपीडी विज़िट के लिए लक्षण, वाइटल्स व आयुष परीक्षा दर्ज करने की अनुमति',
    descMr: 'या ओपीडी भेटीसाठी लक्षणे, वाइटल्स व आयुष परीक्षा नोंदवण्याची संमती',
    required: true,
    defaultState: true
  },
  {
    key: 'document_scanning',
    titleEn: 'Document Storage & Medical OCR',
    titleHi: 'दस्तावेज़ संग्रह एवं मेडिकल OCR',
    titleMr: 'कागदपत्रे साठवण आणि मेडिकल OCR',
    descEn: 'Store scanned paper prescriptions & lab reports for doctor review',
    descHi: 'डॉक्टर की समीक्षा हेतु पुराने पर्चे एवं रिपोर्ट सुरक्षित संग्रह करने की अनुमति',
    descMr: 'डॉक्टरांच्या तपासणीसाठी जुनी प्रिस्क्रिप्शन व लॅब रिपोर्ट्स साठवण्याची संमती',
    required: false,
    defaultState: true
  },
  {
    key: 'doctor_sharing',
    titleEn: 'Consulting Physician Sharing',
    titleHi: 'परामर्शदाता डॉक्टर के साथ शेयरिंग',
    titleMr: 'सल्लागार डॉक्टरांसोबत शेअरिंग',
    descEn: 'Share AI case summary and history with assigned OPD doctor',
    descHi: 'नियुक्त ओपीडी डॉक्टर के साथ केस सारांश व इतिहास साझा करने की अनुमति',
    descMr: 'नेमलेल्या ओपीडी डॉक्टरांसोबत केस सारांश व इतिहास शेअर करण्याची संमती',
    required: false,
    defaultState: true
  },
  {
    key: 'lab_sharing',
    titleEn: 'Laboratory & Diagnostic Sharing',
    titleHi: 'प्रयोगशाला व नैदानिक शेयरिंग',
    titleMr: 'प्रयोगशाळा व निदान शेअरिंग',
    descEn: 'Transmit test orders & sample statuses to hospital lab workbench',
    descHi: 'अस्पताल लैब टीम के साथ जांच आदेश एवं नमूना स्थिति साझा करने की अनुमति',
    descMr: 'रुग्णालय लॅब टीमसोबत तपासणी आदेश व नमुना स्थिती शेअर करण्याची संमती',
    required: false,
    defaultState: true
  },
  {
    key: 'abdm_exchange',
    titleEn: 'ABDM & Health Locker Exchange',
    titleHi: 'ABDM एवं हेल्थ लॉकर एक्सचेंज',
    titleMr: 'ABDM आणि हेल्थ लॉकर देवाणघेवाण',
    descEn: 'Link consultation records with your ABHA Health ID',
    descHi: 'परामर्श रिकॉर्ड को अपने आभा (ABHA) हेल्थ लॉकर से जोड़ने की अनुमति',
    descMr: 'तपासणी रेकॉर्ड आपल्या आभा (ABHA) हेल्थ लॉकरशी जोडण्याची संमती',
    required: false,
    defaultState: true
  },
  {
    key: 'secondary_use',
    titleEn: 'Optional Anonymous Research Use',
    titleHi: 'अनाम शोध उपयोग (ऐच्छिक)',
    titleMr: 'अनामित संशोधन वापर (पर्यायी)',
    descEn: 'Allow anonymized data aggregation for public health analytics',
    descHi: 'सार्वजनिक स्वास्थ्य अनुसंधान के लिए अनाम डेटा उपयोग की ऐच्छिक अनुमति',
    descMr: 'सार्वजनिक आरोग्य विश्लेषणासाठी निनावी डेटा वापराची संमती',
    required: false,
    defaultState: false
  }
];

export default function ConsentScreen({ lang = 'hi', value, onChange, onContinue, speakText, patientId }) {
  const t = COPY[lang] || COPY.en;
  
  // Consent state map for the 6 purposes
  const [consentStates, setConsentStates] = useState(() => {
    const initial = {};
    PURPOSES.forEach(p => {
      initial[p.key] = p.defaultState;
    });
    return initial;
  });

  const [saving, setSaving] = useState(false);

  const togglePurpose = async (purposeKey, currentVal, required) => {
    if (required) return; // Cannot uncheck required purpose
    const newVal = !currentVal;
    
    setConsentStates(prev => ({ ...prev, [purposeKey]: newVal }));

    // Inform parent component state
    if (onChange) {
      onChange({
        dataCapture: purposeKey === 'clinical_history' ? newVal : (consentStates.clinical_history ?? true),
        documentStorage: purposeKey === 'document_scanning' ? newVal : (consentStates.document_scanning ?? true),
        doctorSharing: purposeKey === 'doctor_sharing' ? newVal : (consentStates.doctor_sharing ?? true),
        audioNarrated: Boolean(value?.audioNarrated)
      });
    }

    // Call backend API if patientId is provided
    const targetPatientId = patientId || localStorage.getItem('vaidya_patient_id') || '60d0fe4f5311236168a109ca';
    try {
      if (newVal) {
        await axios.post(`${API_URL}/consent/grant`, {
          patientId: targetPatientId,
          purpose: purposeKey,
          dataScope: 'opd_encounter_data',
          recipient: 'assigned_clinical_team',
          method: 'kiosk_ui',
          language: lang
        });
      } else {
        await axios.post(`${API_URL}/consent/revoke`, {
          patientId: targetPatientId,
          purpose: purposeKey
        });
      }
    } catch (err) {
      console.warn(`[ConsentScreen] API call failed for ${purposeKey}:`, err.message);
    }
  };

  const handleSaveAndContinue = async () => {
    setSaving(true);
    const targetPatientId = patientId || localStorage.getItem('vaidya_patient_id') || '60d0fe4f5311236168a109ca';
    
    try {
      // Sync all granted consents
      for (const p of PURPOSES) {
        const isGranted = consentStates[p.key];
        if (isGranted) {
          await axios.post(`${API_URL}/consent/grant`, {
            patientId: targetPatientId,
            purpose: p.key,
            dataScope: 'opd_encounter_data',
            recipient: 'assigned_clinical_team',
            method: 'kiosk_ui',
            language: lang
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[ConsentScreen] Bulk save warning:', err.message);
    } finally {
      setSaving(false);
      if (onContinue) onContinue();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-teal-500/30 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
        <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">{t.title}</h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{t.subtitle}</p>
        </div>
      </div>

      {/* 6 Granular Scopes List */}
      <div className="space-y-3.5">
        {PURPOSES.map(p => {
          const isChecked = Boolean(consentStates[p.key]);
          return (
            <div
              key={p.key}
              onClick={() => togglePurpose(p.key, isChecked, p.required)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 ${
                isChecked
                  ? 'bg-slate-800/70 border-teal-500/40 text-white shadow-lg shadow-teal-500/5'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-100">
                    {lang === 'hi' ? p.titleHi : lang === 'mr' ? p.titleMr : p.titleEn}
                  </span>
                  {p.required ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      REQUIRED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                      REVOCABLE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-normal">
                  {lang === 'hi' ? p.descHi : lang === 'mr' ? p.descMr : p.descEn}
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative flex items-center p-0.5 shrink-0 ${
                isChecked ? 'bg-teal-500' : 'bg-slate-700'
              }`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isChecked ? 'translate-x-6' : 'translate-x-0'
                }`}>
                  {isChecked ? <Check className="w-3 h-3 text-teal-600" /> : <X className="w-3 h-3 text-slate-500" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Voice Read-Aloud Button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          className="flex items-center gap-2 text-teal-400 text-xs font-semibold hover:text-teal-300 transition-colors"
          onClick={() => {
            if (onChange) onChange({ ...value, audioNarrated: true });
            if (speakText) speakText(`${t.title}. ${t.subtitle}`);
          }}
        >
          <Volume2 className="w-4 h-4" /> {t.audio}
        </button>
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Encrypted & Audited (§47)
        </span>
      </div>

      {/* Primary Submit Button */}
      <button
        type="button"
        disabled={!consentStates.clinical_history || saving}
        onClick={handleSaveAndContinue}
        className="w-full py-4 rounded-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:opacity-95 disabled:opacity-40 transition-all duration-300 shadow-xl shadow-teal-500/20 text-sm flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {consentStates.clinical_history ? t.continue : t.required}
      </button>
    </div>
  );
}
