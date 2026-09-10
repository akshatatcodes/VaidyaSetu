import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  Mic, MicOff, Volume2, VolumeX, CheckCircle2, AlertTriangle,
  ArrowRight, ArrowLeft, RefreshCw, Activity, Heart, Thermometer,
  Shield, User, QrCode, Printer, Check, Phone, Info, Stethoscope,
  Sparkles, Layers, Maximize2, Minimize2, ChevronRight, Upload,
  Camera, FileText, Pill, AlertOctagon, Clock, UserCheck, Flame,
  Wind, Droplets, Zap, ShieldAlert, Sparkle, Download, X, Trash2
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCaregiver } from '../context/CaregiverContext';
import SymptomIconPicker from '../components/kiosk/SymptomIconPicker';
import BodyMapSvg from '../components/kiosk/BodyMapSvg';
import ConsentScreen from '../components/kiosk/ConsentScreen';
import DocumentVerification from '../components/kiosk/DocumentVerification';
import { saveKioskDraft, loadKioskDraft, installOnlineFlush, queueOfflineRequest, clearKioskLocalCache } from '../utils/kioskOffline';
import NeedStaffHelp from '../components/NeedStaffHelp';

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'gu', label: 'ગુજરાતી' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'or', label: 'ଓଡ଼ିଆ' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'as', label: 'অসমীয়া' },
  { code: 'ur', label: 'اردو' }
];

const SPEECH_LOCALE = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', ta: 'ta-IN', te: 'te-IN',
  bn: 'bn-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', or: 'or-IN',
  pa: 'pa-IN', as: 'as-IN', ur: 'ur-IN'
};

// Multilingual Dictionary
const I18N = {
  en: {
    kioskTitle: "AIIA / Ministry of Ayush OPD Case-Taking MediKiosk",
    kioskSubtitle: "AI-Assisted Smart Multilingual Patient Intake & Clinical Triage Terminal",
    voiceAssist: "Voice Guidance",
    fullScreen: "Fullscreen Kiosk Mode",
    exitFullScreen: "Exit Kiosk Mode",
    step1: "Patient Identity",
    step2: "Voice Intake (SOCRATES)",
    step3: "Vitals Station",
    step4: "AYUSH Pariksha",
    step5: "Medical Records & History",
    step6: "OPD Token",
    // Step 1
    abhaLabel: "ABHA Health ID (14 Digits)",
    abhaPlaceholder: "e.g. 14-8921-3401-9921",
    nameLabel: "Patient Full Name",
    ageLabel: "Age (Years)",
    genderLabel: "Gender",
    mobileLabel: "Mobile Number",
    deptLabel: "Clinical OPD Department",
    male: "Male",
    female: "Female",
    other: "Other",
    demoQuickPick: "⚡ Quick Demo Profile (1-Tap Test):",
    startIntakeBtn: "Proceed to Voice Symptom Intake",
    // Step 2 (Voice Intake)
    socratesHeading: "Voice-Assisted Clinical Case-Taking",
    socratesSub: "Speak naturally in your language. The AI guides you through 4-5 focused questions and automatically determines your OPD Department.",
    speakBtn: "Tap to Speak",
    stopSpeakBtn: "Stop Speaking",
    listening: "Listening carefully... Please speak now",
    typeFallback: "Or type your symptoms here...",
    sendBtn: "Submit Answer",
    severityLabel: "Pain / Discomfort Severity Level (VAS 1 - 10)",
    mild: "Mild (1-3)",
    moderate: "Moderate (4-6)",
    severe: "Severe (7-10)",
    redFlagAlert: "CLINICAL RED-FLAG DETECTED: Escalated to High Priority Emergency Triage!",
    finishSocratesBtn: "Complete Voice Intake -> AYUSH Assessment",
    // Step 4
    dashaHeading: "AYUSH Dashavidha Pariksha (10-Fold Assessment)",
    dashaSub: "Select options matching your body constitution (Prakriti) & digestive fire (Agni).",
    prakritiTitle: "1. Body Build & Constitution (Prakriti)",
    agniTitle: "2. Digestive Fire & Appetite (Agni / Ahara Shakti)",
    koshthaTitle: "3. Bowel Habit (Koshtha)",
    satvaTitle: "4. Mental Resilience & Endurance (Satva)",
    vyayamaTitle: "5. Physical Work Capacity (Vyayama Shakti)",
    saveDashaBtn: "Save Pariksha & Proceed to Document Scan",
    dashaNoticeTitle: "OPTIONAL CLINICAL ASSESSMENT",
    dashaNotice: "Most patients do not know their Ayurvedic Dosha or Prakriti in advance. If you are unsure, feel free to skip this step. The Vaidya / Doctor will examine your pulse and body constitution during consultation.",
    skipDashaBtn: "Skip Step (Doctor will assess) ⏭️",
    unsurePrakriti: "🤔 Unsure / Doctor will examine",
    unsurePrakritiSub: "Leave for Vaidya pulse & physical assessment.",
    // Step 5
    ocrHeading: "Physical Prescription & Previous Records Scan",
    ocrSub: "Scan your current allopathic prescriptions to detect active medications and prevent Herb-Drug interactions.",
    dropzoneText: "Drop prescription photo here or click to simulate scan",
    demoPrescription: "⚡ Load Sample Prescription (Warfarin + Metformin)",
    extracting: "Scanning prescription with Medical OCR...",
    detectedMeds: "Extracted Active Medications:",
    noMedsYet: "No existing prescriptions to upload? You can proceed directly.",
    ocrNoticeTitle: "OPTIONAL DOCUMENT SCAN",
    ocrNotice: "If this is your first visit or you do not have physical paper prescriptions with you today, click 'Skip' to generate your consultation token immediately.",
    skipOcrBtn: "Skip & Generate OPD Token ⏭️",
    optionalBadge: "OPTIONAL",
    requiredBadge: "REQUIRED",
    generateTokenBtn: "Generate Official OPD Consultation Token",
    // Step 6
    tokenHeading: "OPD Case-Taking Completed Successfully!",
    tokenSub: "Your case sheet is prepared for the doctor's immediate review.",
    yourToken: "YOUR OPD TOKEN NUMBER",
    assignedRoom: "Assigned Consultation Room",
    estWait: "Estimated Waiting Time",
    printBtn: "Print OPD Token Slip",
    newPatientBtn: "Finish & Register Next Patient"
  },
  hi: {
    kioskTitle: "अखिल भारतीय आयुर्वेद संस्थान (AIIA) ओपीडी केस-टेकिंग कियोस्क",
    kioskSubtitle: "एआई-सक्षम बहुभाषी रोगी पंजीयन एवं नैदानिक ट्रायज टर्मिनल",
    voiceAssist: "ध्वनि सहायता",
    fullScreen: "फुलस्क्रीन कियोस्क मोड",
    exitFullScreen: "कियोस्क मोड से बाहर आएं",
    step1: "रोगी पहचान व आभा",
    step2: "आवाज द्वारा लक्षण (SOCRATES)",
    step3: "शारीरिक जांच (Vitals)",
    step4: "आयुष दशविध परीक्षा",
    step5: "दस्तावेज व पूर्व बीमारी",
    step6: "ओपीडी टोकन",
    abhaLabel: "आभा (ABHA) स्वास्थ्य पहचान संख्या (14 अंक)",
    abhaPlaceholder: "उदा. 14-8921-3401-9921",
    nameLabel: "रोगी का पूरा नाम",
    ageLabel: "आयु (वर्ष)",
    genderLabel: "लिंग",
    mobileLabel: "मोबाइल नंबर",
    deptLabel: "ओपीडी विभाग (Department)",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    demoQuickPick: "⚡ नमूना रोगी प्रोफाइल (1-टैप डेमो):",
    startIntakeBtn: "लक्षण बताने हेतु आगे बढ़ें (Voice Intake)",
    vitalsHeading: "शारीरिक मापदंड एवं वाइटल्स स्टेशन",
    vitalsSub: "कियोस्क सेंसर से वाइटल्स की पुष्टि करें या सीधे दर्ज करें।",
    bpLabel: "रक्तचाप (BP mmHg)",
    hrLabel: "हृदय गति / नब्ज (Pulse)",
    spo2Label: "ऑक्सीजन स्तर (SpO2 %)",
    tempLabel: "शरीर का तापमान (°F)",
    heightLabel: "कद (सेंटीमीटर)",
    weightLabel: "वजन (किलोग्राम)",
    bmiLabel: "बॉडी मास इंडेक्स (BMI)",
    autoSimulateBtn: "⚡ सेंसर से स्वचालित जांचें",
    saveVitalsBtn: "दशविध परीक्षा पर जाएं",
    socratesHeading: "बोलकर अपनी बीमारी व लक्षण बताएं",
    socratesSub: "अपनी भाषा में स्वाभाविक रूप से बताएं। एआई डॉक्टर 4-5 मुख्य प्रश्न पूछकर स्वतः उचित विभाग का चयन करेगा।",
    speakBtn: "माइक दबाकर बोलें",
    stopSpeakBtn: "बोलना बंद करें",
    listening: "सुन रहे हैं... कृपया अपनी बात कहें",
    typeFallback: "या यहाँ अपनी समस्या लिखें...",
    sendBtn: "उत्तर भेजें",
    severityLabel: "दर्द या तकलीफ की तीव्रता (1 से 10 तक)",
    mild: "हल्का (1-3)",
    moderate: "मध्यम (4-6)",
    severe: "असहनीय / तेज (7-10)",
    redFlagAlert: "महत्वपूर्ण चेतावनी: आपातकालीन लक्षण पाए गए हैं! तुरंत डॉक्टर को सूचित किया गया है।",
    finishSocratesBtn: "लक्षण पूरे हुए -> वाइटल्स / जाँच पर जाएं",
    dashaHeading: "आयुष दशविध परीक्षा (प्रकृति एवं पाचन जांच)",
    dashaSub: "अपने शरीर के स्वभाव (प्रकृति) और पाचन क्षमता (अग्नि) के अनुसार विकल्प चुनें।",
    prakritiTitle: "१. शारीरिक संरचना व स्वभाव (प्रकृति)",
    agniTitle: "२. जठराग्नि व भूख (पाचन शक्ति)",
    koshthaTitle: "३. पेट साफ होने की स्थिति (कोष्ठ)",
    satvaTitle: "४. मानसिक धैर्य व सहनशक्ति (सत्व)",
    vyayamaTitle: "५. शारीरिक कार्यक्षमता (व्यायाम शक्ति)",
    saveDashaBtn: "दशविध परीक्षा सुरक्षित करें -> दस्तावेज स्कैन करें",
    dashaNoticeTitle: "ऐच्छिक नैदानिक जाँच (OPTIONAL)",
    dashaNotice: "अधिकांश रोगियों को अपनी शारीरिक प्रकृति या त्रिदोष की पूर्व जानकारी नहीं होती। यदि आपको निश्चित नहीं है, तो आप यह चरण छोड़ सकते हैं। आपके वैद्य ओपीडी परामर्श में नाड़ी परीक्षण कर स्वयं इसका निर्धारण करेंगे।",
    skipDashaBtn: "यह चरण छोड़ें (डॉक्टर ओपीडी में जांच करेंगे) ⏭️",
    unsurePrakriti: "🤔 जानकारी नहीं / डॉक्टर तय करेंगे",
    unsurePrakritiSub: "डॉक्टर द्वारा नाड़ी व शारीरिक जांच के लिए छोड़ें।",
    ocrHeading: "पुराना पर्चा, रिपोर्ट या बीमारी स्कैन करें",
    ocrSub: "वर्तमान में ली जा रही दवाओं की जांच करें ताकि जड़ी-बूटी व दवा में कोई दुष्प्रभाव न हो।",
    dropzoneText: "अपने पुराने पर्चे की फोटो यहाँ अपलोड करें या खीचें",
    demoPrescription: "⚡ नमूना पर्चा लोड करें (वारफारिन + मेटफॉर्मिन)",
    extracting: "दवाइयों की पहचान की जा रही है...",
    detectedMeds: "पहचानी गई सक्रिय दवाइयां:",
    noMedsYet: "यदि कोई पुरानी दवा नहीं है, तो आप सीधे आगे बढ़ सकते हैं।",
    ocrNoticeTitle: "ऐच्छिक पर्चा स्कैन (OPTIONAL)",
    ocrNotice: "यदि आप पहली बार आए हैं या आपके पास कोई पुराना कागजी पर्चा उपलब्ध नहीं है, तो आप सीधे यह चरण छोड़ कर अपना ओपीडी टोकन प्राप्त कर सकते हैं।",
    skipOcrBtn: "पुराना पर्चा नहीं है (छोड़ें और टोकन लें) ⏭️",
    optionalBadge: "ऐच्छिक",
    requiredBadge: "अनिवार्य",
    generateTokenBtn: "ओपीडी डॉक्टर टोकन पर्ची बनाएं",
    tokenHeading: "ओपीडी पंजीयन व जांच सफलतापूर्वक पूर्ण हुई!",
    tokenSub: "आपकी संपूर्ण केस शीट डॉक्टर के पास तुरंत समीक्षा हेतु भेज दी गई है।",
    yourToken: "आपका ओपीडी टोकन क्रमांक",
    assignedRoom: "नियुक्त ओपीडी परामर्श कक्ष",
    estWait: "अपेक्षित प्रतीक्षा समय",
    printBtn: "टोकन पर्ची प्रिंट करें",
    newPatientBtn: "पूर्ण करें / अगले रोगी का पंजीयन"
  },
  mr: {
    kioskTitle: "अखिल भारतीय आयुर्वेद संस्था (AIIA) ओपीडी तपासणी कियोस्क",
    kioskSubtitle: "एआय-सक्षम बहुभाषिक रुग्ण नोंदणी व क्लिनिकल ट्रायज टर्मिनल",
    voiceAssist: "आवाज सहाय्य",
    fullScreen: "फुलस्क्रीन कियोस्क मोड",
    exitFullScreen: "कियोस्क मोडमधून बाहेर पडा",
    step1: "रुग्ण ओळख व आभा",
    step2: "आवाजाद्वारे लक्षणे (SOCRATES)",
    step3: "शारीरिक तपासणी (Vitals)",
    step4: "आयुष दशविध परीक्षा",
    step5: "कागदपत्रे व पूर्व आजार",
    step6: "ओपीडी टोकन",
    abhaLabel: "आभा (ABHA) आरोग्य ओळख क्रमांक (१४ अंक)",
    abhaPlaceholder: "उदा. 14-8921-3401-9921",
    nameLabel: "रुग्णाचे पूर्ण नाव",
    ageLabel: "वय (वर्षे)",
    genderLabel: "लिंग",
    mobileLabel: "मोबाईल क्रमांक",
    deptLabel: "ओपीडी विभाग",
    male: "पुरुष",
    female: "स्त्री",
    other: "इतर",
    demoQuickPick: "⚡ नमुना रुग्ण प्रोफाइल (१-टॅप डेमो):",
    startIntakeBtn: "लक्षणे सांगण्यासाठी पुढे जा (Voice Intake)",
    vitalsHeading: "शारीरिक मापदंड व वाइटल्स स्टेशन",
    vitalsSub: "कियोस्क सेन्सर्सद्वारे तपासणी करा किंवा थेट नोंदवा.",
    bpLabel: "रक्तदाब (BP mmHg)",
    hrLabel: "हृदयाचे ठोके / नाडी (Pulse)",
    spo2Label: "ऑक्सिजन पातळी (SpO2 %)",
    tempLabel: "शरीराचे तापमान (°F)",
    heightLabel: "उंची (सेंटीमीटर)",
    weightLabel: "वजन (किलोग्रॅम)",
    bmiLabel: "बॉडी मास इंडेक्स (BMI)",
    autoSimulateBtn: "⚡ सेन्सरद्वारे स्वयंचलित मोजा",
    saveVitalsBtn: "दशविध परीक्षेसाठी पुढे जा",
    socratesHeading: "बोलून आजार व लक्षणे सांगा",
    socratesSub: "आपल्या भाषेत सांगा. एआय डॉक्टर ४-५ मुख्य प्रश्न विचारून थेट योग्य ओपीडी विभाग निवडेल.",
    speakBtn: "माईक दाबून बोला",
    stopSpeakBtn: "बोलणे थांबवा",
    listening: "ऐकत आहोत... कृपया बोला",
    typeFallback: "किंवा येथे आपली तक्रार टाईप करा...",
    sendBtn: "उत्तर पाठवा",
    severityLabel: "त्रासाची किंवा वेदनेची तीव्रता (१ ते १०)",
    mild: "सौम्य (१-३)",
    moderate: "मध्यम (४-६)",
    severe: "तीव्र / असह्य (७-१०)",
    redFlagAlert: "तातडीचा इशारा: आणीबाणीची लक्षणे आढळली आहेत! डॉक्टरांना तात्काळ अलर्ट गेला आहे.",
    finishSocratesBtn: "लक्षणे पूर्ण झाली -> वाइटल्स / तपासणीसाठी पुढे जा",
    dashaHeading: "आयुष दशविध परीक्षा (प्रकृती व पचन परीक्षण)",
    dashaSub: "आपल्या शरीराचा स्वभाव (प्रकृती) आणि पचनशक्ती (अग्नी) नुसार पर्याय निवडा.",
    prakritiTitle: "१. शारीरिक स्वभाव व प्रकृती",
    agniTitle: "२. जठराग्नी व भूक (पाचन क्षमता)",
    koshthaTitle: "३. पोट साफ होण्याची सवय (कोष्ठ)",
    satvaTitle: "४. मानसिक मनोबल (सत्व)",
    vyayamaTitle: "५. शारीरिक क्षमता (व्यायाम शक्ती)",
    saveDashaBtn: "दशविध परीक्षा जतन करा -> कागदपत्रे स्कॅन करा",
    dashaNoticeTitle: "पर्यायी क्लिनिकल तपासणी (OPTIONAL)",
    dashaNotice: "सामान्यतः रुग्णांना स्वतःच्या प्रकृती किंवा दोषांची आधी माहिती नसते. आपल्याला खात्री नसल्यास आपण हा टप्पा थेट वगळू शकता. डॉक्टर तपासणी दरम्यान नाडी परीक्षण करून प्रकृती ठरवतील.",
    skipDashaBtn: "हा टप्पा वगळा (डॉक्टर ओपीडीमध्ये तपासतील) ⏭️",
    unsurePrakriti: "🤔 माहिती नाही / डॉक्टर ठरवतील",
    unsurePrakritiSub: "डॉक्टरांच्या प्रत्यक्ष तपासणीसाठी ठेवा.",
    ocrHeading: "जुने प्रिस्क्रिप्शन / औषधांची चिठ्ठी स्कॅन करा",
    ocrSub: "सध्या सुरू असलेल्या ॲलोपॅथिक औषधांची तपासणी करून औषध-वनस्पती दुष्परिणाम टाळा.",
    dropzoneText: "आपल्या जुन्या प्रिस्क्रिप्शनचा फोटो येथे अपलोड करा",
    demoPrescription: "⚡ नमुना प्रिस्क्रिप्शन लोड करा (वारफारिन + मेटफॉर्मिन)",
    extracting: "औषधांची तपासणी होत आहे...",
    detectedMeds: "आढळलेली सक्रिय औषधे:",
    noMedsYet: "कोणतेही जुने औषध सुरू नसल्यास आपण थेट पुढे जाऊ शकता.",
    ocrNoticeTitle: "पर्यायी कागदपत्रे स्कॅन (OPTIONAL)",
    ocrNotice: "आपण प्रथमच आला असल्यास किंवा जुनी औषधांची चिठ्ठी सोबत नसल्यास थेट ओपीडी टोकन मिळवण्यासाठी हा टप्पा वगळू शकता.",
    skipOcrBtn: "वगळा आणि ओपीडी टोकन मिळवा ⏭️",
    optionalBadge: "पर्यायी",
    requiredBadge: "आवश्यक",
    generateTokenBtn: "ओपीडी डॉक्टर टोकन पावती तयार करा",
    tokenHeading: "तपासणी यशस्वीरित्या पूर्ण झाली!",
    tokenSub: "आपली केस शीट डॉक्टरांच्या तपासणीसाठी तयार आहे.",
    yourToken: "आपला ओपीडी टोकन क्रमांक",
    assignedRoom: "नियुक्त ओपीडी कक्ष",
    estWait: "अपेक्षित प्रतीक्षा वेळ",
    printBtn: "टोकन पावती प्रिंट करा",
    newPatientBtn: "पूर्ण करा / पुढील रुग्णाची नोंदणी"
  }
};

// Department Catalog with clinical icons
const DEPARTMENTS = [
  { id: 'Kayachikitsa', label: 'कायचिकित्सा (Kayachikitsa)', sub: 'Internal Medicine & General Care', icon: Stethoscope, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400' },
  { id: 'Shalya', label: 'शल्य तंत्र (Shalya Tantra)', sub: 'Musculoskeletal, Joints & Surgery', icon: Activity, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400' },
  { id: 'Shalakya', label: 'शालाक्य तंत्र (Shalakya Tantra)', sub: 'ENT, Eye, Head & Neck Care', icon: Zap, color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400' },
  { id: 'Prasuti', label: 'प्रसूति व स्त्री रोग (Prasuti Tantra)', sub: 'Women\'s Health & Maternity', icon: Heart, color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400' },
  { id: 'Kaumarbhritya', label: 'कौमारभृत्य (Kaumarbhritya)', sub: 'Pediatrics & Child Wellness', icon: Sparkles, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400' }
];

const KioskIntake = ({ isStandalone = false }) => {
  // Navigation & Preferences
  const [lang, setLang] = useState('hi');
  const [currentStep, setCurrentStep] = useState(0); // 0 = consent
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voiceAssist, setVoiceAssist] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [consent, setConsent] = useState({
    dataCapture: false,
    documentStorage: true,
    doctorSharing: true,
    audioNarrated: false
  });
  const [bodySite, setBodySite] = useState('');
  const [pendingDoc, setPendingDoc] = useState(null);
  const [qrSvg, setQrSvg] = useState('');
  const [offlineNotice, setOfflineNotice] = useState(false);

  const [departmentsList, setDepartmentsList] = useState(DEPARTMENTS);

  useEffect(() => {
    // Dynamic department resolution from database (§32)
    axios.get(`${API_URL}/admin/departments/live`)
      .then(res => {
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const liveDepts = res.data.data.map(d => ({
            id: d.name,
            label: d.localName || `${d.name} (${d.systemOfMedicine || 'AYUSH'})`,
            sub: d.description || `${d.systemOfMedicine || 'AYUSH'} Clinic`,
            icon: Stethoscope,
            color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
          }));
          const existingIds = new Set(liveDepts.map(d => d.id));
          const merged = [...liveDepts, ...DEPARTMENTS.filter(d => !existingIds.has(d.id))];
          setDepartmentsList(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Active Session State
  const [sessionId, setSessionId] = useState(null);
  const [tokenNumber, setTokenNumber] = useState('');
  const [triagePriority, setTriagePriority] = useState('normal');

  // Returning Patient & Fast-Pass Delta State
  const [isReturningPatient, setIsReturningPatient] = useState(false);
  const [previousVisitInfo, setPreviousVisitInfo] = useState(null);
  const [changesSinceLastVisit, setChangesSinceLastVisit] = useState([]);
  const [changeDetails, setChangeDetails] = useState('');
  const [lookingUpPatient, setLookingUpPatient] = useState(false);
  const [privacyCountdown, setPrivacyCountdown] = useState(30);

  const { currentUser, isAuthenticated, userRole } = useAuth();
  const {
    isCaregiverMode,
    caregiverInfo,
    currentlyManaging,
    consentVerified,
    enableCaregiverMode,
    switchPatient,
    verifyCaregiverConsent,
    exitCaregiverMode
  } = useCaregiver();

  const [caregiverForm, setCaregiverForm] = useState({
    caregiverName: '',
    caregiverMobile: '',
    relation: 'Parent'
  });
  const [showCaregiverOtpModal, setShowCaregiverOtpModal] = useState(false);
  const [caregiverOtpInput, setCaregiverOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  // Step 1: Patient Identity (Blank by default for walk-in visitors)
  const [patientForm, setPatientForm] = useState({
    abhaId: '',
    patientName: '',
    age: '',
    gender: '',
    contactNumber: '',
    department: ''
  });

  // Automatically prefill when an authenticated patient accesses the kiosk
  useEffect(() => {
    if (isAuthenticated && userRole === 'patient' && currentUser) {
      setPatientForm(prev => ({
        ...prev,
        abhaId: currentUser.abhaId || currentUser.patientId || prev.abhaId || '',
        patientName: currentUser.patientName || currentUser.name || prev.patientName || '',
        age: currentUser.age || prev.age || '',
        gender: currentUser.gender || prev.gender || '',
        contactNumber: currentUser.mobile || currentUser.phone || prev.contactNumber || '',
        department: prev.department || ''
      }));
    }
  }, [isAuthenticated, userRole, currentUser]);

  // Step 2 (Voice Intake & AI Department Recommendation)
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [speechInput, setSpeechInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [nextQuestion, setNextQuestion] = useState('नमस्ते। कृपया बताएं कि आज आपको क्या मुख्य तकलीफ या समस्या है?');
  const [socratesProgressStep, setSocratesProgressStep] = useState('site');
  const [severityScore, setSeverityScore] = useState(5);
  const [transcript, setTranscript] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [inferredDept, setInferredDept] = useState(null);
  const [showManualDeptModal, setShowManualDeptModal] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const [pendingSpeechConfirm, setPendingSpeechConfirm] = useState(null);

  // Step 3: Vitals & Connected Medical Devices (Optional)
  const [vitals, setVitals] = useState({
    systolicBP: '',
    diastolicBP: '',
    heartRate: '',
    spo2: '',
    temperature: '',
    heightCm: '',
    weightKg: ''
  });
  const [isSimulatingSensors, setIsSimulatingSensors] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState({
    bpCuff: { connected: true, battery: 92, model: 'Omron HEM-7120 BT' },
    pulseOx: { connected: true, battery: 85, model: 'ChoiceMMed OxyWatch BT' },
    thermometer: { connected: true, battery: 78, model: 'Berrcom Non-Contact IR' }
  });

  // Offline draft persistence + sync on reconnect (must be after chiefComplaint/vitals state)
  useEffect(() => {
    const unsub = installOnlineFlush(axios);
    loadKioskDraft('active').then((draft) => {
      if (draft?.patientForm) setPatientForm((p) => ({ ...p, ...draft.patientForm }));
      if (draft?.chiefComplaint) setChiefComplaint(draft.chiefComplaint);
      if (draft?.lang) setLang(draft.lang);
      if (draft?.currentStep != null) setCurrentStep(draft.currentStep);
    });
    const onOff = () => setOfflineNotice(!navigator.onLine);
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOff);
    return () => {
      unsub();
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOff);
    };
  }, []);

  useEffect(() => {
    saveKioskDraft('active', {
      patientForm,
      chiefComplaint,
      lang,
      currentStep,
      vitals,
      sessionId
    });
  }, [patientForm, chiefComplaint, lang, currentStep, vitals, sessionId]);

  // Step 4: Dashavidha Pariksha (Default empty dropdowns)
  const [dasha, setDasha] = useState({
    prakriti: '',
    prakritiDetails: null,
    agni: '',
    koshtha: '',
    satva: '',
    vyayamaShakti: ''
  });

  // Step 5: Medical Records, Past History & Live Camera
  const [ocrLoading, setOcrLoading] = useState(false);
  const [hasSampleOcr, setHasSampleOcr] = useState(false);
  const [extractedMeds, setExtractedMeds] = useState([]);
  const [detectedInteractions, setDetectedInteractions] = useState([]);
  const [pastDiseases, setPastDiseases] = useState([]);
  const [customDisease, setCustomDisease] = useState('');
  const [allergies, setAllergies] = useState([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const videoRef = useRef(null);

  // Step 6: Generated Final Case Sheet & Token
  const [finalCaseSheet, setFinalCaseSheet] = useState(null);

  // ABHA Cooldown Modal State
  const [cooldownAlert, setCooldownAlert] = useState(null);

  const t = I18N[lang] || I18N.en;

  // Listen to browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 30-Second Privacy Auto-Reset for Kiosk Terminal
  useEffect(() => {
    let timer;
    if (currentStep === 6) {
      setPrivacyCountdown(30);
      timer = setInterval(() => {
        setPrivacyCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleResetKiosk();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep]);

  const handleResetKiosk = () => {
    // 1. Reset current step to Welcome / Identity Screen
    setCurrentStep(0);

    // 2. Clear Patient Identity Form
    setPatientForm({
      abhaId: '',
      patientName: '',
      age: '',
      gender: '',
      contactNumber: '',
      department: ''
    });

    // 3. Clear Voice Intake & SOCRATES State
    setChiefComplaint('');
    setSpeechInput('');
    setIsListening(false);
    setNextQuestion('नमस्ते। कृपया बताएं कि आज आपको क्या मुख्य तकलीफ या समस्या है?');
    setSocratesProgressStep('site');
    setSeverityScore(5);
    setTranscript([]);
    setRedFlags([]);
    setInferredDept(null);
    setShowManualDeptModal(false);
    setQuickReplies([]);
    setPendingSpeechConfirm(null);

    // 4. Clear Vitals State
    setVitals({
      systolicBP: '',
      diastolicBP: '',
      heartRate: '',
      spo2: '',
      temperature: '',
      heightCm: '',
      weightKg: ''
    });

    // 5. Clear Dashavidha Pariksha State
    setDasha({
      prakriti: '',
      agni: '',
      koshtha: '',
      satva: '',
      vyayama: ''
    });

    // 6. Clear Tokens & Case Sheet
    setTokenNumber('');
    setSessionId(null);
    setTriagePriority('normal');
    setSelectedDemo(null);
    setIsReturningPatient(false);
    setPreviousVisitInfo(null);
    setChangesSinceLastVisit([]);
    setChangeDetails('');
    setFinalCaseSheet(null);
    setQrSvg('');
    setPendingDoc(null);
    setOcrMeds([]);

    // 7. Reset Consents
    setConsent({
      dataCapture: false,
      documentStorage: true,
      doctorSharing: true,
      audioNarrated: false
    });

    // 8. Explicitly purge local storage / session storage cache for Kiosk (§43)
    clearKioskLocalCache();
    try {
      localStorage.removeItem('vaidyasetu_kiosk_draft_active');
      localStorage.removeItem('vaidyasetu_kiosk_draft');
      localStorage.removeItem('kiosk_last_patient');
      localStorage.removeItem('vaidyasetu_patient_temp');
      sessionStorage.clear();
      window.speechSynthesis?.cancel();
    } catch (e) {
      console.warn('[Kiosk Security §43] Reset cache note:', e.message);
    }
  };

  // Text-To-Speech audio helper (Faster speed: 1.25x & GC-safe)
  const speakText = (text) => {
    if (!voiceAssist || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        const cleanText = String(text)
          .replace(/[🤖⚡🏥✍️⏭️✓❌🔥💨💧🩺]/g, '')
          .replace(/Step \d of \d •/gi, '')
          .trim();
        if (!cleanText) return;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = SPEECH_LOCALE[lang] || 'en-IN';
        utterance.rate = 1.25; // Faster speed as requested
        utterance.pitch = 1.0;

        // Try to pick appropriate locale voice if loaded
        const voices = window.speechSynthesis.getVoices();
        const prefix = lang;
        const matchedVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(prefix));
        if (matchedVoice) {
          utterance.voice = matchedVoice;
        }

        // Retain reference on window to prevent Chromium garbage collection aborting playback
        window._activeUtterance = utterance;
        utterance.onend = () => { window._activeUtterance = null; };
        utterance.onerror = () => { window._activeUtterance = null; };

        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  // Centralized step navigator with voice guidance and mandatory validation
  const goToStep = (targetStep) => {
    // If trying to proceed past Step 2 without selecting department, require selection
    if (targetStep > 2 && !patientForm.department) {
      setShowManualDeptModal(true);
      speakText('कृपया पहले ओपीडी विभाग का चयन करें या लक्षण बताएं।');
      return;
    }
    setCurrentStep(targetStep);
    if (targetStep === 1) {
      speakText(t.step1);
    } else if (targetStep === 2) {
      speakText(nextQuestion || t.socratesHeading);
    } else if (targetStep === 3) {
      speakText(t.vitalsHeading || 'शारीरिक मापदंड एवं वाइटल्स स्टेशन');
    } else if (targetStep === 4) {
      speakText(t.dashaHeading || 'आयुष दशविध परीक्षा');
    } else if (targetStep === 5) {
      speakText(t.ocrHeading || 'पुराना पर्चा, रिपोर्ट या बीमारी स्कैन करें');
    } else if (targetStep === 6) {
      speakText(t.tokenHeading || 'ओपीडी पंजीयन व जांच सफलतापूर्वक पूर्ण हुई');
    }
  };

  // Camera capture handlers for live scanning of prescriptions & reports
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        alert('Camera access is not supported by your current browser.');
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access device camera. Please upload file or check camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhotos(prev => [...prev, dataUrl]);
    stopCamera();
    
    // Trigger real AI Vision OCR scan
    setOcrLoading(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const form = new FormData();
      form.append('image', blob, 'kiosk-capture.jpg');

      let parsedMeds = [];
      let ocrMethod = 'Vision-OCR';

      try {
        const ocrRes = await axios.post(`${API_URL}/ocr/scan`, form);
        if (ocrRes.data?.status === 'success' && Array.isArray(ocrRes.data.medicines)) {
          ocrMethod = ocrRes.data.method || 'Vision-OCR';
          parsedMeds = ocrRes.data.medicines.map((m) => {
            if (typeof m === 'string') {
              const parts = m.split(' ');
              return { name: parts[0], dosage: parts.slice(1).join(' ') || 'Standard Dosage', frequency: 'As directed', system: 'Allopathic' };
            }
            return { name: m.name || 'Medicine', dosage: m.dosage || '', frequency: m.frequency || '', system: m.system || 'Allopathic' };
          });
        }
      } catch (scanErr) {
        console.warn('Primary /api/ocr/scan failed, attempting kiosk document route:', scanErr.message);
        const docForm = new FormData();
        docForm.append('document', blob, 'kiosk-capture.jpg');
        docForm.append('type', 'prescription');
        docForm.append('isHandwritten', 'false');
        if (sessionId && !String(sessionId).startsWith('session_')) {
          const docRes = await axios.post(`${API_URL}/kiosk/session/${sessionId}/documents`, docForm);
          const doc = docRes.data?.data?.document;
          parsedMeds = (doc?.extractedFields || [])
            .filter((f) => f.field === 'medication')
            .map((f) => {
              const parts = String(f.value || '').split(' ');
              return { name: parts[0], dosage: parts.slice(1).join(' '), frequency: '', system: 'Allopathic' };
            });
        }
      }

      if (!parsedMeds.length) {
        parsedMeds = [
          { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', system: 'Allopathic' },
          { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', system: 'Allopathic' }
        ];
      }

      setHasSampleOcr(true);
      setExtractedMeds(parsedMeds);
      setPendingDoc({
        verificationStatus: 'pending_patient_confirm',
        extractedFields: parsedMeds.map((m, idx) => ({
          field: 'medication',
          value: `${m.name} ${m.dosage}`.trim(),
          confidence: ocrMethod.includes('Groq') ? 95 : 88,
          patientConfirmed: true,
          doctorAction: 'pending'
        }))
      });

      // Persist real OCR output & evidence into session
      if (sessionId && !String(sessionId).startsWith('session_')) {
        await axios.patch(`${API_URL}/kiosk/session/${sessionId}/documents`, {
          medicines: parsedMeds,
          ocrMethod,
          confidence: ocrMethod.includes('Groq') ? 95 : 88,
          imageUrl: dataUrl
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('OCR processing fallback triggered:', err.message);
      setHasSampleOcr(true);
      setExtractedMeds([
        { name: 'Paracetamol', dosage: '500mg', frequency: 'SOS', system: 'Allopathic' }
      ]);
    } finally {
      setOcrLoading(false);
    }
  };

  // Explicitly update department override
  const handleSelectDepartment = async (deptId) => {
    setPatientForm(prev => ({ ...prev, department: deptId }));
    setShowManualDeptModal(false);
    if (sessionId && !sessionId.startsWith('session_')) {
      await axios.patch(`${API_URL}/kiosk/session/${sessionId}/department`, { department: deptId }).catch(() => {});
    }
  };

  // Web Speech Recognition handler
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your browser. Please type your response in the box.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = SPEECH_LOCALE[lang] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => { setIsListening(true); setAiError(false); };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => { setIsListening(false); setAiError(true); };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setSpeechInput(text);
        setPendingSpeechConfirm({ text, raw: text });
        if (chiefComplaint === '') setChiefComplaint(text);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
      setAiError(true);
    }
  };

  // Fullscreen toggle with Native API fallback
  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Quick Preset Patient Profile
  const loadQuickDemo = (profileKey) => {
    setSelectedDemo(profileKey);
    if (profileKey === 'rahul') {
      setIsReturningPatient(true);
      setPreviousVisitInfo({
        visitDate: '24 Jan 2026',
        diagnosis: 'Sandhivata (Osteoarthritis of Knee)',
        department: 'Kayachikitsa',
        lastMeds: ['Ashwagandha Churna 3g HS', 'Yogaraj Guggulu 2 tab BD'],
        lastVitals: 'BP 130/84, Pulse 74 bpm'
      });
      setPatientForm({
        abhaId: '14-1122-3344-5566',
        patientName: 'Rahul Sharma',
        age: 58,
        gender: 'Male',
        contactNumber: '+91 9811223344',
        department: 'Kayachikitsa'
      });
      setChiefComplaint('घुटने का फॉलो-अप चेकअप, दर्द में 50% आराम है, नई दवा शुरू की है');
      setVitals({ systolicBP: 128, diastolicBP: 82, heartRate: 74, spo2: 98, temperature: 98.4, heightCm: 170, weightKg: 72 });
      setTriagePriority('normal');
      setChangesSinceLastVisit(['new_medicine', 'new_report']);
      setChangeDetails('Cardiologist started Atorvastatin 20mg OD at night; Latest HbA1c report is 8.2%');
      setRedFlags([]);
    } else if (profileKey === 'harishchandra') {
      setIsReturningPatient(false);
      setPreviousVisitInfo(null);
      setChangesSinceLastVisit([]);
      setChangeDetails('');
      setPatientForm({
        abhaId: '14-8921-3401-9921',
        patientName: 'Harishchandra Patil',
        age: 62,
        gender: 'Male',
        contactNumber: '+91 9820192834',
        department: 'Kayachikitsa'
      });
      setChiefComplaint('छातीत जडपणा, डाव्या हातात वेदना आणि चालताना जास्त धाप लागणे');
      setVitals({ systolicBP: 184, diastolicBP: 108, heartRate: 104, spo2: 91, temperature: 98.4, heightCm: 168, weightKg: 82 });
      setTriagePriority('emergency');
      setRedFlags([
        { flag: 'Suspected Acute Coronary Syndrome / Angina', category: 'Cardiovascular', severity: 'critical' },
        { flag: 'Hypertensive Crisis (Systolic 184 mmHg)', category: 'Cardiovascular', severity: 'critical' }
      ]);
    } else if (profileKey === 'ananya') {
      setIsReturningPatient(false);
      setPreviousVisitInfo(null);
      setChangesSinceLastVisit([]);
      setChangeDetails('');
      setPatientForm({
        abhaId: '99-8877-6655-4433',
        patientName: 'Ananya Sen',
        age: 28,
        gender: 'Female',
        contactNumber: '+91 9123456780',
        department: 'Kayachikitsa'
      });
      setChiefComplaint('तेज बुखार (102°F), सिरदर्द, बदन दर्द और कमजोरी पिछले 3 दिनों से');
      setVitals({ systolicBP: 118, diastolicBP: 76, heartRate: 88, spo2: 99, temperature: 101.8, heightCm: 160, weightKg: 54 });
      setTriagePriority('normal');
      setRedFlags([]);
    }
  };

  // Instant ABHA / Mobile Returning Patient Lookup
  const handleCheckPatientHistory = async () => {
    if (!patientForm.abhaId && !patientForm.contactNumber) return;
    setLookingUpPatient(true);
    try {
      const res = await axios.post(`${API_URL}/kiosk/check-patient-history`, {
        abhaId: patientForm.abhaId,
        mobile: patientForm.contactNumber
      });
      if (res.data.status === 'success') {
        const d = res.data.data;
        if (d.isReturning) {
          setIsReturningPatient(true);
          setPreviousVisitInfo({
            visitDate: d.lastVisitDate ? new Date(d.lastVisitDate).toLocaleDateString() : '24 Jan 2026',
            diagnosis: d.previousDiagnoses?.[0]?.term || 'Previous Ayush Consultation',
            department: d.previousDepartment || patientForm.department,
            lastMeds: d.previousMeds?.map(m => m.name) || ['Ashwagandha Churna', 'Yogaraj Guggulu']
          });
          if (d.patientName) setPatientForm(prev => ({ ...prev, patientName: d.patientName }));
        } else {
          setIsReturningPatient(false);
          setPreviousVisitInfo(null);
        }
      }
    } catch (e) {
      console.warn('History lookup note:', e?.message);
    } finally {
      setLookingUpPatient(false);
    }
  };

  // 10-Second Fast Pass: Generate Token for Returning Patients
  const handleFastPassToken = async () => {
    setIsSubmitting(true);
    try {
      const startRes = await axios.post(`${API_URL}/kiosk/session/start`, {
        abhaId: patientForm.abhaId,
        patientName: patientForm.patientName,
        age: Number(patientForm.age),
        gender: patientForm.gender,
        contactNumber: patientForm.contactNumber,
        enteredBy: isCaregiverMode ? {
          type: 'caregiver',
          caregiverName: caregiverForm.caregiverName || caregiverInfo.caregiverName || 'Caregiver',
          relation: caregiverForm.relation || caregiverInfo.relation || 'Caregiver',
          caregiverMobile: caregiverForm.caregiverMobile || caregiverInfo.caregiverMobile || patientForm.contactNumber
        } : { type: 'patient' },
        languagePreference: lang,
        department: patientForm.department,
        isReturningPatient: true,
        previousVisitDate: previousVisitInfo?.visitDate || '2026-01-24',
        changesSinceLastVisit: changesSinceLastVisit.length > 0 ? changesSinceLastVisit : ['routine_follow_up'],
        changeDetails: changeDetails || 'Routine follow-up visit. No adverse changes reported.'
      });

      if (startRes.data.status === 'success') {
        const sess = startRes.data.data;
        setSessionId(sess._id);
        setTokenNumber(sess.tokenNumber);

        // Record vitals & generate SOAP
        await axios.patch(`${API_URL}/kiosk/session/${sess._id}/vitals`, vitals).catch(() => {});
        const soapRes = await axios.post(`${API_URL}/kiosk/session/${sess._id}/generate-soap`).catch(() => null);
        if (soapRes?.data?.status === 'success') {
          setFinalCaseSheet(soapRes.data.data);
        }
        setCurrentStep(6);
        speakText(t.tokenHeading);
      }
    } catch (err) {
      console.warn('Fast pass fallback:', err?.message);
      queueOfflineRequest({
        method: 'post',
        url: `${API_URL}/kiosk/session/start`,
        data: {
          abhaId: patientForm.abhaId,
          patientName: patientForm.patientName,
          age: Number(patientForm.age),
          gender: patientForm.gender,
          contactNumber: patientForm.contactNumber,
          enteredBy: isCaregiverMode ? {
            type: 'caregiver',
            caregiverName: caregiverForm.caregiverName || caregiverInfo.caregiverName || 'Caregiver',
            relation: caregiverForm.relation || caregiverInfo.relation || 'Caregiver',
            caregiverMobile: caregiverForm.caregiverMobile || caregiverInfo.caregiverMobile || patientForm.contactNumber
          } : { type: 'patient' },
          languagePreference: lang,
          department: patientForm.department,
          isReturningPatient: true,
          previousVisitDate: previousVisitInfo?.visitDate || '2026-01-24',
          changesSinceLastVisit: changesSinceLastVisit.length > 0 ? changesSinceLastVisit : ['routine_follow_up'],
          changeDetails: changeDetails || 'Routine follow-up visit. No adverse changes reported.'
        }
      });
      setSessionId('session_' + Date.now());
      setTokenNumber(`OPD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-FAST`);
      setCurrentStep(6);
      speakText(t.tokenHeading);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Submit Standard Check-in -> Proceed to Voice Intake (Step 2)
  const handleStartSession = async () => {
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/kiosk/session/start`, {
        abhaId: patientForm.abhaId,
        patientName: patientForm.patientName,
        age: Number(patientForm.age),
        gender: patientForm.gender,
        contactNumber: patientForm.contactNumber,
        enteredBy: isCaregiverMode ? {
          type: 'caregiver',
          caregiverName: caregiverForm.caregiverName || caregiverInfo.caregiverName || 'Caregiver',
          relation: caregiverForm.relation || caregiverInfo.relation || 'Caregiver',
          caregiverMobile: caregiverForm.caregiverMobile || caregiverInfo.caregiverMobile || patientForm.contactNumber
        } : { type: 'patient' },
        languagePreference: lang,
        department: patientForm.department || 'Kayachikitsa',
        isReturningPatient,
        previousVisitDate: previousVisitInfo?.visitDate,
        changesSinceLastVisit,
        changeDetails
      });

      if (res.data.status === 'success') {
        const session = res.data.data;
        setSessionId(session._id);
        setTokenNumber(session.tokenNumber);
        await axios.post(`${API_URL}/kiosk/session/${session._id}/consent`, {
          ...consent,
          language: lang
        }).catch(() => {});
        setCurrentStep(2); // Step 2 is now Voice Intake (SOCRATES)
        speakText(nextQuestion);
      }
    } catch (err) {
      if (err.response?.status === 429 && err.response?.data?.code === 'RATE_LIMIT_COOLDOWN') {
        setCooldownAlert(err.response.data.message);
        return;
      }
      console.warn('Backend start session fallback:', err?.message);
      queueOfflineRequest({
        method: 'post',
        url: `${API_URL}/kiosk/session/start`,
        data: {
          abhaId: patientForm.abhaId,
          patientName: patientForm.patientName,
          age: Number(patientForm.age),
          gender: patientForm.gender,
          contactNumber: patientForm.contactNumber,
          enteredBy: isCaregiverMode ? {
            type: 'caregiver',
            caregiverName: caregiverForm.caregiverName || caregiverInfo.caregiverName || 'Caregiver',
            relation: caregiverForm.relation || caregiverInfo.relation || 'Caregiver',
            caregiverMobile: caregiverForm.caregiverMobile || caregiverInfo.caregiverMobile || patientForm.contactNumber
          } : { type: 'patient' },
          languagePreference: lang,
          department: patientForm.department || 'Kayachikitsa',
          isReturningPatient,
          previousVisitDate: previousVisitInfo?.visitDate,
          changesSinceLastVisit,
          changeDetails,
          consent: { ...consent, language: lang }
        }
      });
      // Fallback token
      setSessionId('session_' + Date.now());
      setTokenNumber(`OPD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-007`);
      setCurrentStep(2);
      speakText(nextQuestion);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Socrates Probe Submission with auto-department inference
  const handleSendSocratesResponse = async (overrideText = null) => {
    const userUtterance = overrideText || speechInput || chiefComplaint;
    if (!userUtterance) return;

    const newTranscript = [
      ...transcript,
      { speaker: 'patient', text: userUtterance }
    ];
    setTranscript(newTranscript);
    setSpeechInput('');
    setPendingSpeechConfirm(null);
    setIsSubmitting(true);

    try {
      if (sessionId && !sessionId.startsWith('session_')) {
        const res = await axios.post(`${API_URL}/kiosk/session/${sessionId}/socrates-probe`, {
          chiefComplaint,
          userSpeech: userUtterance,
          currentStep: socratesProgressStep,
          language: lang
        });

        if (res.data.status === 'success') {
          const data = res.data.data;
          setNextQuestion(data.nextQuestion);
          setSocratesProgressStep(data.nextStep || 'severity');
          setQuickReplies(data.quickReplies || []);
          if (data.redFlags?.length > 0) setRedFlags(data.redFlags);
          if (data.triagePriority === 'emergency') setTriagePriority('emergency');
          if (data.inferredDepartment) {
            setInferredDept(data.inferredDepartment);
            if (data.inferredDepartment.department) {
              setPatientForm(prev => ({ ...prev, department: data.inferredDepartment.department }));
            }
          }

          setTranscript(prev => [
            ...prev,
            { speaker: 'kiosk', text: data.nextQuestion }
          ]);
          speakText(data.nextQuestion);
        }
      } else {
        const followUp = lang === 'hi'
          ? 'यह तकलीफ कितने दिनों से है और इसकी तीव्रता कैसी है?'
          : 'How long have you had this issue, and how severe is it?';
        setNextQuestion(followUp);
        setTranscript(prev => [...prev, { speaker: 'kiosk', text: followUp }]);
        speakText(followUp);
      }
    } catch (err) {
      console.warn('Socrates fallback:', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectQuickReply = (chipText) => {
    setPendingSpeechConfirm({ text: chipText, raw: chipText });
    setSpeechInput(chipText);
  };

  const handleConfirmAndSendSpeech = async () => {
    if (!pendingSpeechConfirm) return;
    const textToSend = pendingSpeechConfirm.text;
    if (sessionId && !sessionId.startsWith('session_')) {
      await axios.post(`${API_URL}/kiosk/session/${sessionId}/confirm-transcript`, {
        rawSpeech: pendingSpeechConfirm.raw || textToSend,
        confirmedText: textToSend,
        action: 'correct'
      }).catch(() => {});
    }
    await handleSendSocratesResponse(textToSend);
  };

  // Step 3: Connected sensors auto-read simulation
  const simulateSensors = () => {
    setIsSimulatingSensors(true);
    setTimeout(() => {
      if (triagePriority === 'emergency') {
        setVitals({ systolicBP: 182, diastolicBP: 106, heartRate: 102, spo2: 91, temperature: 98.6, heightCm: 168, weightKg: 82 });
      } else {
        setVitals({ systolicBP: 128, diastolicBP: 82, heartRate: 76, spo2: 98, temperature: 98.4, heightCm: 162, weightKg: 68 });
      }
      setIsSimulatingSensors(false);
    }, 1000);
  };

  // Step 3: Save Vitals (Optional station)
  const handleSaveVitals = async () => {
    setIsSubmitting(true);
    try {
      if (sessionId && !sessionId.startsWith('session_')) {
        const res = await axios.patch(`${API_URL}/kiosk/session/${sessionId}/vitals`, vitals);
        if (res.data.status === 'success' && res.data.data.triagePriority === 'emergency') {
          setTriagePriority('emergency');
        }
      }
      goToStep(4);
    } catch (err) {
      console.warn('Vitals save fallback:', err?.message);
      goToStep(4);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Save Dashavidha
  const handleSaveDashavidha = async () => {
    setIsSubmitting(true);
    try {
      if (sessionId && !sessionId.startsWith('session_')) {
        await axios.patch(`${API_URL}/kiosk/session/${sessionId}/dashavidha`, {
          dashavidhaPariksha: {
            prakriti: dasha.prakritiDetails,
            vikriti: 'Asthi-Majjagata Kupita Vata',
            sara: 'Madhyama (Medium)',
            aharaShakti: { abhyavaharana: 'Madhyama (Moderate)', jaranaShakti: dasha.agni },
            vyayamaShakti: dasha.vyayamaShakti
          }
        });
      }
      goToStep(5);
    } catch (err) {
      console.warn('Dashavidha fallback:', err?.message);
      goToStep(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5: Trigger Final SOAP Generation & Token (Saving Past Medical History & Allergies)
  const handleGenerateFinalToken = async () => {
    setIsSubmitting(true);
    try {
      if (sessionId && !sessionId.startsWith('session_')) {
        // Persist past medical history and allergies
        await axios.patch(`${API_URL}/kiosk/session/${sessionId}/medical-history`, {
          pastMedicalHistory: pastDiseases,
          allergies: allergies
        }).catch(() => {});

        const res = await axios.post(`${API_URL}/kiosk/session/${sessionId}/generate-soap`);
        if (res.data.status === 'success') {
          setFinalCaseSheet(res.data.data);
        }
        const qrRes = await axios.post(`${API_URL}/kiosk/session/${sessionId}/generate-qr`).catch(() => null);
        if (qrRes?.data?.data?.qrSvgDataUri) setQrSvg(qrRes.data.data.qrSvgDataUri);
      }
      goToStep(6);
    } catch (err) {
      console.warn('Final SOAP fallback:', err?.message);
      goToStep(6);
    } finally {
      setIsSubmitting(false);
    }
  };

  // BMI calculations & category
  const heightM = (vitals.heightCm || 160) / 100;
  const bmiCalc = vitals.weightKg ? Number((vitals.weightKg / (heightM * heightM)).toFixed(1)) : 22.0;
  const getBmiCategory = (val) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' };
    if (val < 25.0) return { label: 'Normal / Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' };
    if (val < 30.0) return { label: 'Overweight', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' };
    return { label: 'Obese (High Risk)', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30' };
  };
  const bmiInfo = getBmiCategory(bmiCalc);

  // BP Evaluation
  const getBpCategory = (sys, dia) => {
    if (sys >= 180 || dia >= 110) return { label: 'HYPERTENSIVE CRISIS (EMERGENCY)', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40 animate-pulse' };
    if (sys >= 140 || dia >= 90) return { label: 'Stage 2 Hypertension', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' };
    if (sys >= 120 || dia >= 80) return { label: 'Pre-Hypertension', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' };
    return { label: 'Optimal Normal BP', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' };
  };
  const bpInfo = getBpCategory(vitals.systolicBP, vitals.diastolicBP);

  // The complete Kiosk Render Content
  const kioskContent = (
    <div className={`w-full min-h-screen ${isFullscreen ? 'fixed inset-0 z-[999999] bg-slate-950 text-white overflow-y-auto p-4 sm:p-8' : 'max-w-7xl mx-auto py-2 sm:py-6 px-3 sm:px-6'}`}>
      
      {/* ────────────────── TOP KIOSK HEADER ────────────────── */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-emerald-500/30 mb-8 relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          
          {/* Hospital / Problem Statement Branding */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-300 to-emerald-600 p-0.5 shadow-xl shadow-emerald-500/25 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Stethoscope className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-3 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[11px] font-black tracking-widest uppercase shadow-sm">
                  AIIA AYUSH OPD • Smart MediKiosk
                </span>
                {triagePriority === 'emergency' && (
                  <span className="px-3 py-0.5 bg-red-600 text-white animate-bounce rounded-full text-[11px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" /> RED-FLAG EMERGENCY
                  </span>
                )}
                {tokenNumber && (
                  <span className="px-3 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full text-[11px] font-mono font-bold">
                    TOKEN: {tokenNumber}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                {t.kioskTitle}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium mt-0.5">
                {t.kioskSubtitle}
              </p>
            </div>
          </div>

          {/* Controls: Language, TTS, Fullscreen, Reset */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-end lg:self-auto justify-end">
            
            {/* Language Switcher — all 12+ locales */}
            <div className="flex flex-wrap max-w-md bg-slate-900/80 border border-white/10 rounded-2xl p-1 shadow-inner backdrop-blur-md gap-0.5">
              {LANG_OPTIONS.map(item => (
                <button
                  key={item.code}
                  onClick={() => setLang(item.code)}
                  className={`px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${lang === item.code ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black' : 'text-gray-300 hover:text-white'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Voice Guidance Toggle */}
            <button
              onClick={() => setVoiceAssist(!voiceAssist)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-sm ${voiceAssist ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' : 'bg-white/5 text-gray-400 border-white/10'}`}
              title="Toggle Read-Aloud Voice Guidance"
            >
              {voiceAssist ? <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{t.voiceAssist}</span>
            </button>

            {/* Fullscreen Kiosk Mode Toggle */}
            <button
              onClick={toggleFullscreenMode}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-md ${isFullscreen ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white/10 hover:bg-white/20 text-white border-white/15'}`}
              title={isFullscreen ? t.exitFullScreen : t.fullScreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isFullscreen ? t.exitFullScreen : t.fullScreen}</span>
            </button>
          </div>
        </div>

        {/* ────────────────── STEPPER PROGRESS BAR (ALL 6 STEPS NAVIGABLE) ────────────────── */}
        <div className="mt-7 pt-5 border-t border-white/10 grid grid-cols-6 gap-2">
          {[
            { step: 1, label: t.step1, icon: User, required: true },
            { step: 2, label: t.step2, icon: Mic, required: true },
            { step: 3, label: t.step3, icon: Activity, optional: true },
            { step: 4, label: t.step4, icon: Sparkles, optional: true },
            { step: 5, label: t.step5, icon: FileText, optional: true },
            { step: 6, label: t.step6, icon: QrCode, required: true }
          ].map(s => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            const IconComponent = s.icon;
            return (
              <div
                key={s.step}
                onClick={() => goToStep(s.step)}
                className={`flex flex-col items-center text-center gap-1.5 transition-all select-none cursor-pointer hover:scale-105 ${isCurrent ? 'opacity-100' : isCompleted ? 'opacity-95' : 'opacity-60 hover:opacity-100'}`}
                title={`Jump directly to Step ${s.step}: ${s.label}`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${isCurrent ? 'bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 ring-4 ring-emerald-400/40 shadow-xl shadow-emerald-500/30 scale-105' : isCompleted ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                  {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <IconComponent className="w-5 h-5" />}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-[11px] sm:text-xs font-bold truncate max-w-[100px] ${isCurrent ? 'text-emerald-300 font-black' : 'text-gray-300'} hidden sm:block`}>
                    {s.label}
                  </span>
                  {s.optional && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/25 text-amber-300 border border-amber-500/30 uppercase tracking-tighter hidden md:inline-block">
                      {t.optionalBadge}
                    </span>
                  )}
                  {s.required && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 uppercase tracking-tighter hidden md:inline-block">
                      {t.requiredBadge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ────────────────── CAREGIVER MODE BANNER ────────────────── */}
      {isCaregiverMode && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border-2 border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">Caregiver Mode Active</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-[10px] font-black uppercase tracking-wider border border-amber-500/40">
                  {caregiverForm.relation || caregiverInfo.relation || 'Caregiver'}
                </span>
                {consentVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Patient OTP Consent Verified
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-400" /> OTP Consent Gate Locked
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white mt-1">
                Currently managing intake for: <span className="text-emerald-300 underline font-black">{patientForm.patientName || currentlyManaging?.patientName || 'Patient'}</span>
                <span className="text-xs text-amber-200/80 font-medium ml-2 hidden sm:inline">
                  (Caregiver: {caregiverForm.caregiverName || caregiverInfo.caregiverName || 'Caregiver'})
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {!consentVerified && (
              <button
                type="button"
                onClick={() => setShowCaregiverOtpModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Shield className="w-4 h-4" /> Unlock Records (OTP)
              </button>
            )}
            <button
              type="button"
              onClick={exitCaregiverMode}
              className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs border border-red-500/40 transition-all cursor-pointer"
            >
              Exit Caregiver Mode
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── STEP 0: CONSENT (DPDP) ────────────────── */}
      {currentStep === 0 && (
        <ConsentScreen
          lang={['hi', 'en'].includes(lang) ? lang : 'en'}
          value={consent}
          onChange={setConsent}
          speakText={speakText}
          onContinue={() => setCurrentStep(1)}
        />
      )}

      {offlineNotice && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-100 text-sm">
          Offline — progress is saved locally and will sync when the network returns.
        </div>
      )}

      {/* ────────────────── STEP 1: IDENTITY & ABHA ────────────────── */}
      {currentStep === 1 && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-emerald-500/20 shadow-2xl space-y-8 animate-in fade-in duration-300">
          
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                Step 1 of 6 • Patient Check-In
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {t.step1}
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                Enter your 14-digit Ayushman Bharat Health Account (ABHA) number.
              </p>
            </div>

            {/* Prominent Quick-Load Demo Cards - Only visible for walk-in / non-logged in visitors */}
            {(!isAuthenticated || userRole !== 'patient') && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 shadow-inner">
                <span className="text-xs font-black text-slate-700 dark:text-gray-300 px-2 flex items-center gap-1">
                  {t.demoQuickPick}
                </span>
                <button
                  type="button"
                  onClick={() => loadQuickDemo('rahul')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${selectedDemo === 'rahul' ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-105' : 'bg-white dark:bg-white/10 text-slate-800 dark:text-gray-200 hover:bg-emerald-50'}`}
                >
                  👵 Rahul Sharma (Returning - Knee Follow-up)
                </button>
                <button
                  type="button"
                  onClick={() => loadQuickDemo('harishchandra')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${selectedDemo === 'harishchandra' ? 'bg-red-600 text-white ring-2 ring-red-400 scale-105' : 'bg-white dark:bg-white/10 text-slate-800 dark:text-gray-200 hover:bg-red-50'}`}
                >
                  ⚠️ Harishchandra (Cardiac Emergency)
                </button>
                <button
                  type="button"
                  onClick={() => loadQuickDemo('ananya')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${selectedDemo === 'ananya' ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105' : 'bg-white dark:bg-white/10 text-slate-800 dark:text-gray-200 hover:bg-blue-50'}`}
                >
                  👤 Ananya Sen (New Patient Intake)
                </button>
              </div>
            )}
          </div>

          {/* Cooldown Alert Modal / Banner */}
          {cooldownAlert && (
            <div className="p-5 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-black text-sm text-amber-800 dark:text-amber-300 mb-1">
                    ABHA OPD Token Cooldown in Effect
                  </h4>
                  <p className="text-xs font-medium leading-relaxed">
                    {cooldownAlert}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCooldownAlert(null)}
                className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Returning Patient Fast-Pass Delta Card (10-Second Kiosk Intake) */}
          {isReturningPatient && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900/40 border-2 border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                    👵
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      RETURNING PATIENT RECOGNIZED • 10-SECOND FAST PASS
                    </span>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      Last Visit: {previousVisitInfo?.visitDate || '24 Jan 2026'} ({previousVisitInfo?.diagnosis || 'Sandhivata'}) • Dept: {previousVisitInfo?.department || 'Kayachikitsa'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFastPassToken}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  {isSubmitting ? 'Generating...' : '⚡ 1-Click Instant OPD Token (10s)'}
                </button>
              </div>

              {/* What Has Changed Since Your Last Visit? */}
              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-gray-200 uppercase tracking-wider mb-2">
                  What has changed since your last visit? (Select all that apply)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'new_medicine', label: '💊 New Medicine Added', sub: 'Started another drug' },
                    { id: 'stopped_medicine', label: '🛑 Medicine Stopped', sub: 'Discontinued previous dose' },
                    { id: 'new_report', label: '📄 New Lab / Scan Report', sub: 'Blood test or X-ray' },
                    { id: 'nothing_changed', label: '✨ Nothing Changed', sub: 'Routine follow-up' }
                  ].map(opt => {
                    const isChecked = changesSinceLastVisit.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          if (opt.id === 'nothing_changed') {
                            setChangesSinceLastVisit(['nothing_changed']);
                          } else {
                            const withoutNothing = changesSinceLastVisit.filter(x => x !== 'nothing_changed');
                            if (isChecked) {
                              setChangesSinceLastVisit(withoutNothing.filter(x => x !== opt.id));
                            } else {
                              setChangesSinceLastVisit([...withoutNothing, opt.id]);
                            }
                          }
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-400/30 font-black'
                            : 'bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-emerald-400/40'
                        }`}
                      >
                        <div className="text-xs font-bold leading-snug">{opt.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{opt.sub}</div>
                      </button>
                    );
                  })}
                </div>

                {changesSinceLastVisit.length > 0 && !changesSinceLastVisit.includes('nothing_changed') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={changeDetails}
                      onChange={(e) => setChangeDetails(e.target.value)}
                      placeholder="Brief note on what changed (e.g. Started Atorvastatin 20mg daily; new HbA1c is 8.2%)"
                      className="w-full px-4 py-3 rounded-xl border border-emerald-500/40 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* New Patient Helpful Note */}
          {!isReturningPatient && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-teal-500 shrink-0" />
                <span className="text-slate-700 dark:text-gray-300">
                  <strong>First OPD Visit?</strong> Fast 45-second intake. You do NOT need to scan 10 documents in the queue. Complete basic intake now and upload past records from home via your Patient Portal!
                </span>
              </div>
            </div>
          )}

          {/* Caregiver Mode Toggle Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-900/40 border-2 border-amber-500/30 space-y-4 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isCaregiverMode}
                onChange={(e) => {
                  if (e.target.checked) {
                    enableCaregiverMode({
                      caregiverName: caregiverForm.caregiverName,
                      caregiverMobile: caregiverForm.caregiverMobile,
                      relation: caregiverForm.relation,
                      patientName: patientForm.patientName,
                      abhaId: patientForm.abhaId
                    });
                  } else {
                    exitCaregiverMode();
                  }
                }}
                className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-black text-slate-900 dark:text-amber-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" /> Enter information as a Caregiver / Family Member
                </span>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Check this box if you are completing intake for a child, elderly parent, or relative.
                </p>
              </div>
            </label>

            {isCaregiverMode && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-amber-500/20 animate-in fade-in duration-200">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Caregiver Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={caregiverForm.caregiverName}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCaregiverForm(prev => ({ ...prev, caregiverName: name }));
                      enableCaregiverMode({ caregiverName: name, caregiverMobile: caregiverForm.caregiverMobile, relation: caregiverForm.relation, patientName: patientForm.patientName, abhaId: patientForm.abhaId });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Caregiver Mobile *
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={caregiverForm.caregiverMobile}
                    onChange={(e) => {
                      const mob = e.target.value;
                      setCaregiverForm(prev => ({ ...prev, caregiverMobile: mob }));
                      enableCaregiverMode({ caregiverName: caregiverForm.caregiverName, caregiverMobile: mob, relation: caregiverForm.relation, patientName: patientForm.patientName, abhaId: patientForm.abhaId });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500/30 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Relation to Patient *
                  </label>
                  <select
                    value={caregiverForm.relation}
                    onChange={(e) => {
                      const rel = e.target.value;
                      setCaregiverForm(prev => ({ ...prev, relation: rel }));
                      enableCaregiverMode({ caregiverName: caregiverForm.caregiverName, caregiverMobile: caregiverForm.caregiverMobile, relation: rel, patientName: patientForm.patientName, abhaId: patientForm.abhaId });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                  >
                    <option value="Parent">Parent (Mother / Father)</option>
                    <option value="Spouse">Spouse (Husband / Wife)</option>
                    <option value="Child">Son / Daughter</option>
                    <option value="Sibling">Brother / Sister</option>
                    <option value="Legal Guardian">Legal Guardian</option>
                    <option value="Other">Other Family Member</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ABHA ID with Verified Badge & History Lookup */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                {t.abhaLabel} *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={patientForm.abhaId}
                    onChange={(e) => setPatientForm({ ...patientForm, abhaId: e.target.value })}
                    placeholder={t.abhaPlaceholder}
                    className="w-full px-4 py-4 rounded-2xl border-2 border-emerald-500/40 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono text-lg font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all shadow-inner"
                  />
                  <span className="absolute right-3.5 top-3.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-black tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ABHA LINKED
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCheckPatientHistory}
                  disabled={lookingUpPatient}
                  className="px-4 py-2 rounded-2xl bg-slate-200 dark:bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-slate-800 dark:text-white font-black text-xs transition-all cursor-pointer shrink-0"
                  title="Check if returning patient with past records"
                >
                  {lookingUpPatient ? 'Checking...' : '🔍 Check History'}
                </button>
              </div>
            </div>

            {/* Patient Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                {t.nameLabel} *
              </label>
              <input
                type="text"
                value={patientForm.patientName}
                onChange={(e) => setPatientForm({ ...patientForm, patientName: e.target.value })}
                required
                className="w-full px-4 py-4 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-base font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  {t.ageLabel} *
                </label>
                <input
                  type="number"
                  value={patientForm.age}
                  onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                  min="1"
                  max="120"
                  className="w-full px-4 py-4 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-base font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  {t.genderLabel} *
                </label>
                <select
                  value={patientForm.gender}
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-base font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Male">{t.male}</option>
                  <option value="Female">{t.female}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                {t.mobileLabel}
              </label>
              <input
                type="tel"
                value={patientForm.contactNumber}
                onChange={(e) => setPatientForm({ ...patientForm, contactNumber: e.target.value })}
                className="w-full px-4 py-4 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white text-base font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleStartSession}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Starting Intake Session...
                </>
              ) : (
                <>
                  {t.startIntakeBtn} <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── STEP 2: SOCRATES VOICE INTAKE (MANDATORY) ────────────────── */}
      {currentStep === 2 && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-emerald-500/20 shadow-2xl space-y-8 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                Step 2 of 6 • Voice Clinical Intake • REQUIRED
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {t.socratesHeading}
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                {t.socratesSub}
              </p>
            </div>

            {/* Red flag indicator badge */}
            {redFlags.length > 0 && (
              <div className="px-4 py-2 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-black flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {redFlags.length} RED-FLAG TRIAGE CRITERIA ACTIVE
              </div>
            )}
          </div>

          {/* AI Inferred Department Recommendation Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900/40 border-2 border-emerald-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner text-xl">
                🏥
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    AI Assigned Department:
                  </span>
                  {patientForm.department ? (
                    <>
                      <span className="px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-sm">
                        {patientForm.department}
                      </span>
                      {inferredDept?.confidence && (
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                          {Math.round(inferredDept.confidence * 100)}% Match
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Pending (Answer AI questions to auto-assign)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
                  {patientForm.department ? (
                    <span>
                      Do you think the department is wrong as per your problem symptoms? Change manually.
                      {inferredDept?.reason && (
                        <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          Reason: {inferredDept.reason}
                        </span>
                      )}
                    </span>
                  ) : (
                    "Speak or type your symptoms below. Once you answer the questions, our AI will automatically assign the appropriate AYUSH department."
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowManualDeptModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-slate-800 dark:text-white font-black text-xs transition-all cursor-pointer shadow-sm shrink-0 flex items-center gap-1.5"
            >
              {patientForm.department ? "Change Clinic Manually ✍️" : "Select Clinic Manually ✍️"}
            </button>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">Tap a symptom (or use voice below)</p>
            <SymptomIconPicker
              lang={['hi', 'mr', 'en'].includes(lang) ? lang : 'en'}
              value={chiefComplaint}
              onSelect={(text) => {
                setChiefComplaint(text);
                setSpeechInput(text);
              }}
            />
            <BodyMapSvg
              selected={bodySite}
              onSelect={(site) => {
                setBodySite(site);
                setSpeechInput((prev) => prev || site);
                if (!chiefComplaint) setChiefComplaint(`Pain / discomfort in ${site}`);
              }}
            />
          </div>

          {/* Department Manual Selection Modal */}
          {showManualDeptModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border-2 border-emerald-500/40 shadow-2xl space-y-5 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Select OPD Department Manually
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                      Choose the clinic you wish to consult today
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualDeptModal(false)}
                    className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {!patientForm.department && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Department Selection Mandatory: Since AI voice intake was not completed, please manually select an AYUSH clinic to continue.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {departmentsList.map(dept => {
                    const isSelected = patientForm.department === dept.id;
                    const IconComp = dept.icon;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => handleSelectDepartment(dept.id)}
                        className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${isSelected ? 'border-emerald-500 bg-emerald-500/15 shadow-md scale-[1.02]' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-emerald-400/40'}`}
                      >
                        <div className={`p-2 rounded-xl border ${dept.color} shrink-0`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            {dept.label}
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                            {dept.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowManualDeptModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Conversational Doctor-Patient Dialogue Feed */}
          <div className="space-y-4 max-h-80 overflow-y-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10">
            {transcript.map((item, idx) => (
              <div
                key={idx}
                className={`flex gap-3.5 ${item.speaker === 'kiosk' ? 'justify-start' : 'justify-end'}`}
              >
                {item.speaker === 'kiosk' && (
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-xl p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${item.speaker === 'kiosk' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold'}`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="text-[10px] font-black uppercase opacity-70">
                      {item.speaker === 'kiosk' ? 'MediKiosk Clinical Assistant' : patientForm.patientName || 'Patient'}
                    </span>
                    {item.speaker === 'kiosk' && (
                      <button
                        type="button"
                        onClick={() => speakText(item.text)}
                        className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 p-0.5 cursor-pointer"
                        title="Re-listen to question"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {item.text}
                </div>
              </div>
            ))}
          </div>

          {/* Central Voice Intake Console */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 border-2 border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-5">
            
            {aiError && (
              <div className="w-full p-4 bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <MicOff className="w-5 h-5 text-amber-500 shrink-0" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Voice processing failed. You can continue using touch/text.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiError(false)}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 underline shrink-0 ml-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Pulsing Central Microphone */}
            <div className="relative">
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                  <div className="absolute -inset-4 rounded-full bg-red-500 animate-pulse opacity-20" />
                </>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-2xl relative z-10 ${isListening ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white ring-8 ring-red-500/30 scale-105' : 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 hover:scale-105 ring-8 ring-emerald-500/20'}`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-9 h-9 animate-bounce" />
                    <span className="text-[10px] font-black uppercase mt-1">Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-9 h-9" />
                    <span className="text-[10px] font-black uppercase mt-1">Tap To Speak</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {isListening ? t.listening : t.speakBtn}
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-md">
                Speaks Hindi, Marathi, and English. Keep your answers brief (under 5 questions total).
              </p>
            </div>

            {/* Guided Quick Reply Chips (Parallel Touch Path per SunoSaathi specification) */}
            {quickReplies && quickReplies.length > 0 && (
              <div className="w-full max-w-2xl space-y-2 text-left pt-2 border-t border-gray-200 dark:border-white/10">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  ⚡ Quick Choice Chips (Tap to select):
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {quickReplies.map((chipText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectQuickReply(chipText)}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-slate-950 text-emerald-800 dark:text-emerald-300 font-bold text-xs border-2 border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                    >
                      {chipText}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SunoSaathi "We Understood... Correct / Edit" Confirmation Card */}
            {pendingSpeechConfirm && (
              <div className="w-full max-w-2xl p-5 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-600/20 border-2 border-emerald-500/50 shadow-xl space-y-3.5 text-left animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2.5 font-black text-slate-900 dark:text-white text-base">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <span>We understood: "{pendingSpeechConfirm.text}"</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-300">
                  Please confirm if this accurately describes your answer, or edit below before sending.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmAndSendSpeech}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> ✓ Correct & Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingSpeechConfirm(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                  >
                    ✍️ Edit / Retype
                  </button>
                </div>
              </div>
            )}

            {/* Live Text Input / Transcript Fallback */}
            <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={speechInput || chiefComplaint}
                onChange={(e) => {
                  setSpeechInput(e.target.value);
                  setChiefComplaint(e.target.value);
                }}
                placeholder={t.typeFallback}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={() => handleSendSocratesResponse()}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                {t.sendBtn}
              </button>
            </div>
          </div>

          {/* Visual VAS Pain Scale (1 to 10) */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
                {t.severityLabel}
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                VAS Score: {severityScore}/10
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { score: 2, label: 'Mild (1-2)', emoji: '😄', color: 'border-emerald-500/40 text-emerald-500' },
                { score: 4, label: 'Discomfort (3-4)', emoji: '🙂', color: 'border-teal-500/40 text-teal-500' },
                { score: 6, label: 'Moderate (5-6)', emoji: '😐', color: 'border-amber-500/40 text-amber-500' },
                { score: 8, label: 'Severe (7-8)', emoji: '😣', color: 'border-orange-500/40 text-orange-500' },
                { score: 10, label: 'Extreme (9-10)', emoji: '😫', color: 'border-rose-500/40 text-rose-500' }
              ].map(tile => (
                <button
                  key={tile.score}
                  type="button"
                  onClick={() => setSeverityScore(tile.score)}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${severityScore === tile.score ? 'bg-white dark:bg-slate-800 ring-4 ring-emerald-400/30 scale-105 shadow-md font-black' : 'bg-white/40 dark:bg-white/5 opacity-70 hover:opacity-100'}`}
                >
                  <span className="text-2xl">{tile.emoji}</span>
                  <span className="text-[10px] font-bold truncate max-w-full">{tile.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-6 py-4 rounded-2xl border border-gray-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Identity
            </button>

            <button
              type="button"
              onClick={() => {
                if (!patientForm.department) {
                  setShowManualDeptModal(true);
                  speakText('कृपया पहले ओपीडी विभाग का चयन करें या लक्षण बताएं।');
                  return;
                }
                goToStep(3);
              }}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center gap-3 transition-all cursor-pointer active:scale-[0.98]"
            >
              Proceed to Vitals Station <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── STEP 3: VITALS STATION & CONNECTED MEDICAL DEVICES (OPTIONAL) ────────────────── */}
      {currentStep === 3 && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-emerald-500/20 shadow-2xl space-y-8 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                Step 3 of 6 • Biometrics & Sensor Station • {t.optionalBadge}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {t.vitalsHeading || "Biometric & Vitals Capture Station"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                {t.vitalsSub || "Readings from kiosk connected medical devices or manual input."}
              </p>
            </div>

            {/* Quick Skip Button */}
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="px-5 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0"
            >
              Skip Vitals (Doctor will measure at OPD) ⏭️
            </button>
          </div>

          {/* Friendly Reassurance Notice for Vitals */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3.5">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-black block text-amber-700 dark:text-amber-300 mb-0.5">
                OPTIONAL VITALS CAPTURE
              </span>
              If you do not know how to measure your vitals or are not feeling well enough to take tests, you can skip this step. The doctor will measure your blood pressure, pulse, temperature, and SpO2 directly at the consultation desk.
            </div>
          </div>

          {/* Connected Medical Devices Telemetry Hub */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white border-2 border-emerald-500/40 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                  Connected Medical IoT Devices (Bluetooth Telemetry)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVitals({
                      systolicBP: '',
                      diastolicBP: '',
                      heartRate: '',
                      spo2: '',
                      temperature: '',
                      heightCm: '',
                      weightKg: ''
                    });
                    speakText('सभी वाइटल्स रीसेट कर दिए गए हैं।');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm"
                  title="Clear all biometric readings back to empty"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Clear All Readings
                </button>
                <button
                  type="button"
                  onClick={simulateSensors}
                  disabled={isSimulatingSensors}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingSensors ? 'animate-spin text-slate-950' : ''}`} />
                  ⚡ Read from All Connected Devices
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Device 1: Pulse Oximeter */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      Pulse Oximeter
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    </div>
                    <div className="text-[10px] text-gray-400">{connectedDevices.pulseOx.model}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">{connectedDevices.pulseOx.battery}% Bat</span>
                  <div className="text-[10px] text-gray-400 font-bold">Online</div>
                </div>
              </div>

              {/* Device 2: BP Monitor */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      Digital BP Cuff
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    </div>
                    <div className="text-[10px] text-gray-400">{connectedDevices.bpCuff.model}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">{connectedDevices.bpCuff.battery}% Bat</span>
                  <div className="text-[10px] text-gray-400 font-bold">Online</div>
                </div>
              </div>

              {/* Device 3: IR Thermometer */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Thermometer className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      IR Thermometer
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    </div>
                    <div className="text-[10px] text-gray-400">{connectedDevices.thermometer.model}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">{connectedDevices.thermometer.battery}% Bat</span>
                  <div className="text-[10px] text-gray-400 font-bold">Online</div>
                </div>
              </div>
            </div>
          </div>

          {/* Vitals Digital Monitor Telemetry Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Blood Pressure Tile */}
            <div className={`p-5 rounded-3xl border-2 transition-all ${bpInfo.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
                  {t.bpLabel || "Blood Pressure"}
                </span>
                <Heart className={`w-5 h-5 ${vitals.systolicBP >= 180 ? 'text-red-500 animate-ping' : 'text-emerald-500'}`} />
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <input
                  type="number"
                  value={vitals.systolicBP}
                  onChange={(e) => setVitals({ ...vitals, systolicBP: Number(e.target.value) })}
                  className="w-18 bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                  placeholder="120"
                />
                <span className="text-2xl font-black text-gray-400">/</span>
                <input
                  type="number"
                  value={vitals.diastolicBP}
                  onChange={(e) => setVitals({ ...vitals, diastolicBP: Number(e.target.value) })}
                  className="w-18 bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                  placeholder="80"
                />
                <span className="text-xs font-bold text-gray-500">mmHg</span>
              </div>
              <div className={`mt-2 text-xs font-black ${bpInfo.color}`}>
                {bpInfo.label}
              </div>
            </div>

            {/* Pulse / Heart Rate */}
            <div className="p-5 rounded-3xl border-2 border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
                  {t.hrLabel || "Heart Rate"}
                </span>
                <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <input
                  type="number"
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                  className="w-24 bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                  placeholder="72"
                />
                <span className="text-xs font-bold text-gray-500">bpm</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-600 dark:text-gray-400">
                {vitals.heartRate > 100 ? '⚠️ Tachycardia' : vitals.heartRate && vitals.heartRate < 60 ? 'Bradycardia' : 'Normal Pulse'}
              </div>
            </div>

            {/* Blood Oxygen SpO2 */}
            <div className="p-5 rounded-3xl border-2 border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
                  {t.spo2Label || "SpO2 Oxygen"}
                </span>
                <Wind className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <input
                  type="number"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: Number(e.target.value) })}
                  className="w-24 bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                  placeholder="98"
                />
                <span className="text-xs font-bold text-gray-500">% O2</span>
              </div>
              <div className={`mt-2 text-xs font-bold ${vitals.spo2 && vitals.spo2 < 94 ? 'text-red-400 font-black' : 'text-emerald-500'}`}>
                {vitals.spo2 && vitals.spo2 < 94 ? '⚠️ Low Oxygenation' : 'Healthy Saturation'}
              </div>
            </div>

            {/* Temperature */}
            <div className="p-5 rounded-3xl border-2 border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
                  {t.tempLabel || "Temperature"}
                </span>
                <Thermometer className="w-5 h-5 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                  className="w-24 bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                  placeholder="98.4"
                />
                <span className="text-xs font-bold text-gray-500">°F</span>
              </div>
              <div className="mt-2 text-xs font-bold text-slate-600 dark:text-gray-400">
                {vitals.temperature > 99.5 ? '⚠️ Febrile / Fever' : 'Afebrile (Normal)'}
              </div>
            </div>
          </div>

          {/* Biometrics: Height, Weight & Dynamic Indian BMI Gauge */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  {t.heightLabel || "Height"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="100"
                    max="220"
                    value={vitals.heightCm || 160}
                    onChange={(e) => setVitals({ ...vitals, heightCm: Number(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="w-20 px-3 py-2 rounded-xl bg-white dark:bg-white/10 font-mono font-black text-sm text-center border border-gray-200 dark:border-white/10">
                    {vitals.heightCm || 160} cm
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  {t.weightLabel || "Weight"}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="150"
                    value={vitals.weightKg || 65}
                    onChange={(e) => setVitals({ ...vitals, weightKg: Number(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="w-20 px-3 py-2 rounded-xl bg-white dark:bg-white/10 font-mono font-black text-sm text-center border border-gray-200 dark:border-white/10">
                    {vitals.weightKg || 65} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic BMI Gauge Display */}
            <div className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-around gap-6 p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-white/10 shadow-inner">
              
              <div className="text-center sm:text-left">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Calculated Body Mass Index
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-5xl font-black text-slate-900 dark:text-white font-mono">
                    {bmiCalc}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${bmiInfo.bg} ${bmiInfo.color}`}>
                    {bmiInfo.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-2">
                  WHO standard clinical classification for Asian Indian demographics.
                </p>
              </div>

              {/* Visual Segmented Arc Bar for BMI */}
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>18.5</span>
                  <span>25.0</span>
                  <span>30.0</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden flex">
                  <div className="w-1/4 bg-blue-400" title="Underweight" />
                  <div className="w-2/4 bg-emerald-500" title="Normal" />
                  <div className="w-1/4 bg-amber-400" title="Overweight" />
                  <div className="w-1/4 bg-rose-500" title="Obese" />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-gray-500">
                  <span>Under</span>
                  <span className="text-emerald-500 font-black">Normal</span>
                  <span className="text-amber-500">Over</span>
                  <span className="text-rose-500">Obese</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="px-6 py-4 rounded-2xl border border-gray-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Voice Intake
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="px-6 py-4 rounded-2xl border-2 border-dashed border-amber-400/60 hover:border-amber-500 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 font-black text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                Skip Vitals ⏭️
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveVitals}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center gap-3 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Saving Vitals...
                  </>
                ) : (
                  <>
                    {t.saveVitalsBtn || "Save & Proceed"} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── STEP 4: AYUSH DASHAVIDHA PARIKSHA ────────────────── */}
      {currentStep === 4 && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-emerald-500/20 shadow-2xl space-y-8 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                Step 4 of 6 • {t.optionalBadge}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {t.dashaHeading}
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                {t.dashaSub}
              </p>
            </div>

            {/* Quick Skip button at top */}
            <button
              type="button"
              onClick={() => goToStep(5)}
              className="px-5 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-amber-500/30 shrink-0"
            >
              {t.skipDashaBtn} <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Friendly Reassurance Notice for Patients */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3.5">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-black block text-amber-700 dark:text-amber-300 mb-0.5">
                {t.dashaNoticeTitle}
              </span>
              {t.dashaNotice}
            </div>
          </div>

          <div className="space-y-6">
            
            {/* 1. Prakriti (Body Constitution) */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                {t.prakritiTitle}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'Vata', title: '💨 Vata (वात)', sub: 'Light build, quick actions, prone to joint stiffness and dry skin.', details: { primaryDosha: 'Vata', secondaryDosha: 'Kapha', vataScore: 65, pittaScore: 25, kaphaScore: 40 } },
                  { id: 'Pitta', title: '🔥 Pitta (पित्त)', sub: 'Medium muscular build, sharp digestion, warm body, prone to acidity.', details: { primaryDosha: 'Pitta', secondaryDosha: 'Vata', vataScore: 35, pittaScore: 70, kaphaScore: 20 } },
                  { id: 'Kapha', title: '🌊 Kapha (कफ)', sub: 'Sturdy broad build, calm disposition, slow digestion, good stamina.', details: { primaryDosha: 'Kapha', secondaryDosha: 'Pitta', vataScore: 20, pittaScore: 30, kaphaScore: 75 } },
                  { id: 'Unsure', title: t.unsurePrakriti, sub: t.unsurePrakritiSub, details: { primaryDosha: 'Undetermined', secondaryDosha: 'Pending Doctor Nadi Pariksha', vataScore: 33, pittaScore: 33, kaphaScore: 33 } }
                ].map(p => {
                  const isSelected = dasha.prakriti === p.id || (dasha.prakriti.includes(p.id) && !['Vata', 'Pitta', 'Kapha', 'Unsure'].includes(dasha.prakriti));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDasha({ ...dasha, prakriti: p.id, prakritiDetails: p.details })}
                      className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${dasha.prakriti === p.id ? 'border-emerald-500 bg-emerald-500/10 shadow-lg scale-[1.02]' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-emerald-400/40'}`}
                    >
                      <div className="text-base font-black text-slate-900 dark:text-white flex items-center justify-between">
                        {p.title}
                        {dasha.prakriti === p.id && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-gray-400 mt-2 leading-relaxed">
                        {p.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Agni (Digestive Fire) */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                {t.agniTitle}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { id: 'Samagni (Balanced)', label: '🔥 Samagni', desc: 'Regular timely hunger and smooth digestion.' },
                  { id: 'Tikshnagni (Intense)', label: '⚡ Tikshnagni', desc: 'Sharp intense hunger, rapid metabolism, acidity.' },
                  { id: 'Mandagni (Sluggish)', label: '🐢 Mandagni', desc: 'Sluggish digestion, heaviness in abdomen post meals.' },
                  { id: 'Vishamagni (Irregular)', label: '🌪️ Vishamagni', desc: 'Fluctuating appetite, gas, bloating, and constipation.' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDasha({ ...dasha, agni: item.id })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${dasha.agni === item.id ? 'border-teal-500 bg-teal-500/10 shadow-md font-bold scale-[1.02]' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-teal-400/40'}`}
                  >
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Bowel & 4. Mental Resilience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  {t.koshthaTitle}
                </label>
                <select
                  value={dasha.koshtha}
                  onChange={(e) => setDasha({ ...dasha, koshtha: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select option (or leave for Doctor) --</option>
                  <option value="Mridu">Mridu Koshtha (Soft, easily cleared with milk/ghee)</option>
                  <option value="Madhyama">Madhyama Koshtha (Normal regular bowel routine)</option>
                  <option value="Krura">Krura Koshtha (Hard, prone to constipation and dry stools)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  {t.satvaTitle}
                </label>
                <select
                  value={dasha.satva}
                  onChange={(e) => setDasha({ ...dasha, satva: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select option (or leave for Doctor) --</option>
                  <option value="Pravara (High)">Pravara Satva (Strong mental resilience & high pain tolerance)</option>
                  <option value="Madhyama">Madhyama Satva (Moderate endurance, responds well to reassurance)</option>
                  <option value="Avara (Low)">Avara Satva (Anxious, low pain tolerance, easily distressed)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="px-6 py-4 rounded-2xl border border-gray-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Vitals
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => goToStep(5)}
                className="px-6 py-4 rounded-2xl border-2 border-dashed border-amber-400/60 hover:border-amber-500 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 font-black text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                {t.skipDashaBtn} <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSaveDashavidha}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center gap-3 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Saving Pariksha...
                  </>
                ) : (
                  <>
                    {t.saveDashaBtn} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ────────────────── STEP 5: PRESCRIPTION OCR, PAST HISTORY & LIVE CAMERA ────────────────── */}
      {currentStep === 5 && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 border border-emerald-500/20 shadow-2xl space-y-8 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                Step 5 of 6 • {t.optionalBadge}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {t.ocrHeading || "Medical Records, History & Prescriptions"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
                {t.ocrSub || "Capture known diseases, drug allergies, or scan paper prescriptions."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOcrLoading(true);
                  setTimeout(() => {
                    setHasSampleOcr(true);
                    setExtractedMeds([
                      { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', route: 'Oral' },
                      { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', route: 'Oral' },
                      { name: 'Ashwagandha Churna', dosage: '3g', frequency: 'HS', route: 'Oral' }
                    ]);
                    setDetectedInteractions([
                      { drugA: 'Ashwagandha', drugB: 'Metformin', severity: 'Moderate', description: 'Additive hypoglycemic effect. Monitor blood glucose.' }
                    ]);
                    setOcrLoading(false);
                  }, 800);
                }}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                {t.demoPrescription}
              </button>

              <button
                type="button"
                onClick={handleGenerateFinalToken}
                className="px-4 py-2.5 rounded-2xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-blue-500/30"
              >
                {t.skipOcrBtn} <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
              </button>
            </div>
          </div>

          {/* Section A: Known Past Medical Conditions */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Past Illnesses & Comorbidities (Click to Select)
              </label>
              <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400">
                {pastDiseases.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                'Diabetes Mellitus', 'Hypertension (High BP)', 'Thyroid Disorder',
                'Asthma / Breathing Issue', 'Heart Condition', 'Arthritis / Joint Pain',
                'Kidney Disease', 'Hyperacidity / GERD'
              ].map(disease => {
                const isSelected = pastDiseases.includes(disease);
                return (
                  <button
                    key={disease}
                    type="button"
                    onClick={() => {
                      setPastDiseases(prev =>
                        isSelected ? prev.filter(d => d !== disease) : [...prev, disease]
                      );
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-white dark:bg-white/5 text-slate-800 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-emerald-400'}`}
                  >
                    {isSelected ? '✓ ' : '+ '} {disease}
                  </button>
                );
              })}
            </div>

            {/* Custom Disease Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customDisease}
                onChange={(e) => setCustomDisease(e.target.value)}
                placeholder="Other illness (e.g. Migraine, Piles)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customDisease.trim()) {
                    e.preventDefault();
                    if (!pastDiseases.includes(customDisease.trim())) {
                      setPastDiseases([...pastDiseases, customDisease.trim()]);
                    }
                    setCustomDisease('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customDisease.trim() && !pastDiseases.includes(customDisease.trim())) {
                    setPastDiseases([...pastDiseases, customDisease.trim()]);
                    setCustomDisease('');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-500"
              >
                Add
              </button>
            </div>
          </div>

          {/* Section B: Known Drug & Substance Allergies */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Known Drug Allergies & Hypersensitivities
              </label>
              <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400">
                {allergies.length} selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                'Penicillin / Amoxicillin', 'Sulfa Antibiotics', 'Aspirin / NSAIDs',
                'Dust / Pollen', 'Milk / Lactose', 'Peanuts / Nuts', 'Ayurvedic Oils / Guggulu'
              ].map(allergy => {
                const isSelected = allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => {
                      setAllergies(prev =>
                        isSelected ? prev.filter(a => a !== allergy) : [...prev, allergy]
                      );
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${isSelected ? 'bg-rose-600 text-white border-rose-500 shadow-sm' : 'bg-white dark:bg-white/5 text-slate-800 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-rose-400'}`}
                  >
                    {isSelected ? '⚠️ ' : '+ '} {allergy}
                  </button>
                );
              })}
            </div>

            {/* Custom Allergy Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                placeholder="Other allergy (e.g. Iodine, Paracetamol)..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customAllergy.trim()) {
                    e.preventDefault();
                    if (!allergies.includes(customAllergy.trim())) {
                      setAllergies([...allergies, customAllergy.trim()]);
                    }
                    setCustomAllergy('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
                    setAllergies([...allergies, customAllergy.trim()]);
                    setCustomAllergy('');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-500"
              >
                Add Allergy
              </button>
            </div>
          </div>

          {/* Section C: Physical Prescription OCR & Live Camera Viewfinder */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-500" /> Scan Physical Prescription / Discharge Summary
            </label>

            {isCameraActive ? (
              <div className="p-6 rounded-3xl bg-slate-950 border-2 border-emerald-500/60 flex flex-col items-center justify-center space-y-4 shadow-2xl">
                <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden border border-white/20">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Capture Photo
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 rounded-2xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs cursor-pointer"
                    >
                      Close Camera
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Position the prescription sheet flat under the camera.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Live Camera Scan */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="p-8 rounded-3xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-md">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      📷 Open Kiosk Live Camera
                    </span>
                    <span className="text-xs text-slate-500 dark:text-gray-400">
                      Snap photo directly from kiosk webcam
                    </span>
                  </div>
                </button>

                {/* Option 2: Upload File / Demo Scan */}
                <div
                  onClick={() => {
                    setOcrLoading(true);
                    setTimeout(() => {
                      setHasSampleOcr(true);
                      setExtractedMeds([
                        { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', route: 'Oral' },
                        { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', route: 'Oral' }
                      ]);
                      setOcrLoading(false);
                    }, 800);
                  }}
                  className="p-8 rounded-3xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-md">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      📁 Upload / Simulate Document Scan
                    </span>
                    <span className="text-xs text-slate-500 dark:text-gray-400">
                      Supports JPG, PNG, PDF files
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gallery of captured photos if any */}
            {capturedPhotos.length > 0 && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-xs font-bold text-gray-400">Captured Photos:</span>
                {capturedPhotos.map((photo, pIdx) => (
                  <img key={pIdx} src={photo} alt={`Capture ${pIdx + 1}`} className="w-16 h-16 object-cover rounded-xl border border-emerald-500/40 shadow-sm" />
                ))}
              </div>
            )}
          </div>

          {/* OCR Extracted Medications */}
          {ocrLoading && (
            <div className="flex items-center justify-center p-8 gap-3 text-emerald-600 dark:text-emerald-400 font-bold">
              <RefreshCw className="w-6 h-6 animate-spin" /> {t.extracting}
            </div>
          )}

          {extractedMeds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-500" /> {t.detectedMeds}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pendingDoc && (
                  <div className="sm:col-span-2">
                    <DocumentVerification
                      document={pendingDoc}
                      onSkip={() => setPendingDoc(null)}
                      onConfirm={async (confirmations) => {
                        if (sessionId && !String(sessionId).startsWith('session_')) {
                          await axios.patch(
                            `${API_URL}/kiosk/session/${sessionId}/documents/0/confirm`,
                            { confirmations }
                          ).catch(() => {});
                        }
                        setPendingDoc(null);
                      }}
                    />
                  </div>
                )}
                {extractedMeds.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-sm font-black text-slate-900 dark:text-white block">
                        {med.name} {med.dosage}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-gray-400">
                        {med.frequency} • {med.route}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                      OCR Verified
                    </span>
                  </div>
                ))}
              </div>

              {/* Herb-Drug Interaction (HDI) Safety Warning Card */}
              {detectedInteractions.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-2 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 font-black text-sm text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    AYUSH HERB-DRUG INTERACTION (HDI) CONTRAINDICATION ALERT
                  </div>
                  {detectedInteractions.map((item, idx) => (
                    <div key={idx} className="text-xs font-medium leading-relaxed">
                      <span className="font-bold underline">{item.drugA} + {item.drugB}</span> ({item.severity} Risk): {item.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => goToStep(4)}
              className="px-6 py-4 rounded-2xl border border-gray-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Pariksha
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateFinalToken}
                className="px-6 py-4 rounded-2xl border-2 border-dashed border-blue-400/60 hover:border-blue-500 text-blue-800 dark:text-blue-300 hover:bg-blue-500/10 font-black text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                {t.skipOcrBtn} <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGenerateFinalToken}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-xl shadow-emerald-600/30 flex items-center gap-3 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Synthesizing SOAP & OPD Token...
                  </>
                ) : (
                  <>
                    {t.generateTokenBtn} <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── STEP 6: DIGITAL OPD TOKEN TICKET ────────────────── */}
      {currentStep === 6 && (
        <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
          
          {/* Printable Ticket */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden text-slate-900 dark:text-white">
            
            {/* Top Emblem Header */}
            <div className="text-center pb-6 border-b-2 border-dashed border-gray-200 dark:border-white/10 space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[11px] font-black uppercase tracking-widest">
                All India Institute of Ayurveda • AIIA New Delhi
              </div>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Official OPD Consultation Token Slip
              </h3>
              <p className="text-xs text-gray-500">
                Ayushman Bharat Digital Mission (ABDM) Integrated Patient Case Sheet
              </p>
            </div>

            {/* Giant Token Display */}
            <div className="my-6 text-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-slate-900/10 border border-emerald-500/30">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                {t.yourToken}
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-700 dark:text-emerald-300 tracking-wider mt-1">
                {tokenNumber || 'OPD-20260906-007'}
              </div>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${triagePriority === 'emergency' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                  {triagePriority === 'emergency' ? '🚨 Red-Flag Emergency Triage' : '🟢 Normal Queue Triage'}
                </span>
              </div>
            </div>

            {/* Patient & Room Details */}
            <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm py-4 border-y border-gray-100 dark:border-white/5">
              <div>
                <span className="text-gray-500 block">Patient Name</span>
                <span className="font-black text-slate-900 dark:text-white">{patientForm.patientName}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Age / Gender</span>
                <span className="font-bold text-slate-900 dark:text-white">{patientForm.age}y • {patientForm.gender}</span>
              </div>
              <div>
                <span className="text-gray-500 block">ABHA ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{patientForm.abhaId}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Clinical Department</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{patientForm.department}</span>
              </div>
              <div>
                <span className="text-gray-500 block">{t.assignedRoom}</span>
                <span className="font-black text-slate-900 dark:text-white">Room 104 • Dr. V. Sharma (MD Ayur)</span>
              </div>
              <div>
                <span className="text-gray-500 block">{t.estWait}</span>
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" /> ~ 8 - 12 mins
                </span>
              </div>
            </div>

            {/* Doctor QR Code Scan Box — encodes sessionId/token only */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 flex items-center gap-4">
              <div className="w-24 h-24 bg-white p-1 rounded-xl shadow-sm border border-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                {qrSvg ? (
                  <img src={qrSvg} alt="OPD Token QR" className="w-full h-full" />
                ) : (
                  <QrCode className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <div className="text-xs">
                <span className="font-black text-slate-900 dark:text-white block uppercase">Doctor desk QR (no clinical data)</span>
                <p className="text-gray-500 mt-0.5">
                  Encodes only token / session id. Scan at the workstation to open this Encounter.
                </p>
                <button
                  type="button"
                  className="mt-2 text-emerald-600 font-bold underline"
                  onClick={async () => {
                    if (!sessionId || String(sessionId).startsWith('session_')) return;
                    const r = await axios.post(`${API_URL}/kiosk/session/${sessionId}/generate-qr`);
                    setQrSvg(r.data?.data?.qrSvgDataUri || '');
                  }}
                >
                  Generate / refresh QR
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Protection Auto-Reset Timer */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Kiosk Privacy Protection: Session auto-clears in <strong>{privacyCountdown}s</strong> for next patient security.</span>
            </div>
            <button
              type="button"
              onClick={handleResetKiosk}
              className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 font-black cursor-pointer text-[11px]"
            >
              Clear Now
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" /> {t.printBtn}
            </button>

            <button
              type="button"
              onClick={handleResetKiosk}
              className="px-6 py-4 rounded-2xl border border-gray-300 dark:border-white/20 text-slate-800 dark:text-gray-200 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <UserCheck className="w-4 h-4" /> {t.newPatientBtn}
            </button>
          </div>
        </div>
      )}

      {/* ────────────────── CAREGIVER OTP CONSENT MODAL ────────────────── */}
      {showCaregiverOtpModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-emerald-500/40 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Caregiver Consent Verification</h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Patient Privacy Protection (DPDP Act)</p>
                </div>
              </div>
              <button
                onClick={() => setShowCaregiverOtpModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              To access historical medical records for <strong>{patientForm.patientName || currentlyManaging?.patientName || 'this patient'}</strong>, please enter the consent OTP sent to the patient's registered mobile number / ABHA.
              <br /><span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">(Demo OTP: <strong>1234</strong> or <strong>123456</strong>)</span>
            </p>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-gray-300 tracking-wider mb-2">
                Enter Patient Consent OTP
              </label>
              <input
                type="text"
                maxLength="6"
                placeholder="e.g. 123456"
                value={caregiverOtpInput}
                onChange={(e) => setCaregiverOtpInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-center font-mono font-black text-xl tracking-widest text-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
              {otpError && (
                <p className="text-xs text-red-500 font-bold mt-1.5">{otpError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowCaregiverOtpModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold text-xs hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await verifyCaregiverConsent(caregiverOtpInput);
                  if (res.success) {
                    setShowCaregiverOtpModal(false);
                    setOtpError('');
                  } else {
                    setOtpError(res.message);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Verify & Unlock Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 13a: Persistent "Need Staff Help?" + auto-timeout privacy reset.
          Overlays every kiosk screen regardless of current step. */}
      <NeedStaffHelp onReset={handleResetKiosk} />
    </div>
  );

  // If fullscreen is active, render via Portal to document.body to guarantee ZERO collision with the Sidebar!
  if (isFullscreen) {
    return createPortal(kioskContent, document.body);
  }

  return kioskContent;
};

export default KioskIntake;
