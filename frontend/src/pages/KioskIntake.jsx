import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  Mic, MicOff, Volume2, VolumeX, CheckCircle2, AlertTriangle,
  ArrowRight, ArrowLeft, RefreshCw, Activity, Heart, Thermometer,
  Shield, User, QrCode, Printer, Check, Phone, Info, Stethoscope,
  Sparkles, Layers, Maximize2, Minimize2, ChevronRight, Upload,
  Camera, FileText, Pill, AlertOctagon, Clock, UserCheck, Flame,
  Wind, Droplets, Zap, ShieldAlert, Sparkle, Download, X, Trash2, Lock, Eye
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import ComprehensiveMedicalHistory from '../components/ComprehensiveMedicalHistory';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [voiceAssist, setVoiceAssist] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);

  // Table 3.2 Accessibility Suite (WCAG AAA High Contrast & Font Sizing)
  const [fontScale, setFontScale] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Statutory DPDP Act 2023 & ABDM Consent Layer State
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [showDpdpModal, setShowDpdpModal] = useState(false);
  const [dpdpAudioPlaying, setDpdpAudioPlaying] = useState(false);

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
  const [nextQuestion, setNextQuestion] = useState('नमस्ते। कृपया बताएं कि आज आपको क्या मुख्य तकलीफ या समस्या है?');
  const [socratesProgressStep, setSocratesProgressStep] = useState('site');
  const [socratesState, setSocratesState] = useState({});
  const [severityScore, setSeverityScore] = useState(5);
  const [transcript, setTranscript] = useState([]);
  const [redFlags, setRedFlags] = useState([]);
  const [inferredDept, setInferredDept] = useState(null);
  const [showManualDeptModal, setShowManualDeptModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat feed to bottom smoothly when messages arrive
  useEffect(() => {
    if (currentStep === 2) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, isSubmitting, currentStep]);

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

  // Step 4: Full 10-Parameter Classical Dashavidha Pariksha & Ahara-Vihara (Charaka Samhita)
  const [dasha, setDasha] = useState({
    prakriti: '',
    prakritiDetails: null,
    vikriti: '',
    sara: '',
    samhanana: '',
    pramana: '',
    satmya: '',
    satva: '',
    agni: '',
    abhyavaharana: '',
    vyayamaShakti: '',
    vaya: '',
    koshtha: ''
  });

  const [aharaVihara, setAharaVihara] = useState({
    dietType: 'Vegetarian',
    waterIntake: 'Normal',
    sleepPattern: 'Sound (7-8 hours)',
    habitsAddictions: []
  });

  const [caseSummaryAudioPlaying, setCaseSummaryAudioPlaying] = useState(false);

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
    setCurrentStep(1);
    setTokenNumber('');
    setSessionId(null);
    setTriagePriority('normal');
    setSelectedDemo(null);
    setIsReturningPatient(false);
    setPreviousVisitInfo(null);
    setChangesSinceLastVisit([]);
    setChangeDetails('');
    setRedFlags([]);
    setTranscript([]);
    setFinalCaseSheet(null);
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
        utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
        utterance.rate = 1.25; // Faster speed as requested
        utterance.pitch = 1.0;

        // Try to pick appropriate locale voice if loaded
        const voices = window.speechSynthesis.getVoices();
        const prefix = lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en';
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

  // DPDP Act 2023 Audio Explainer (Statutory Requirement Module D)
  const playDpdpConsentAudio = () => {
    setDpdpAudioPlaying(true);
    setDpdpConsent(true);
    const audioNotice = lang === 'hi'
      ? 'डिजिटल पर्सनल डेटा प्रोटेक्शन अधिनियम 2023 के तहत, आप अखिल भारतीय आयुर्वेद संस्थान में ओपीडी परामर्श हेतु अपने स्वास्थ्य लक्षण, पुरानी बीमारी और पर्चे दर्ज करने की सहमति दे रहे हैं। यह डेटा पूर्णतः सुरक्षित रहेगा और कियोस्क छोड़ने के 30 सेकंड बाद टर्मिनल से साफ कर दिया जाएगा।'
      : lang === 'mr'
      ? 'डिजिटल वैयक्तिक डेटा संरक्षण कायदा २०२३ अंतर्गत, आपण एआयआयए ओपीडी तपासणीसाठी आपली लक्षणे व कागदपत्रे देण्यास स्वेच्छेने संमती देत आहात. हा डेटा पूर्णपणे सुरक्षित असून ३० सेकंदात टर्मिनलवरून आपोआप हटवला जाईल.'
      : 'Under the Digital Personal Data Protection Act 2023, you grant revocable consent for AIIA to process your symptoms and medical documents solely for OPD clinical consultation. Your data is encrypted and automatically cleared from this kiosk terminal after 30 seconds.';
    speakText(audioNotice);
  };

  // Registered Case Summary Spoken Confirmation (Step 6 Local Audio Confirmation)
  const playRegisteredCaseSummaryAudio = () => {
    setCaseSummaryAudioPlaying(true);
    const summarySpeech = lang === 'hi'
      ? `नमस्ते ${patientForm.patientName || 'रोगी'}, आपका ओपीडी टोकन क्रमांक ${tokenNumber || 'ओपीडी टोकन'} है। आपकी मुख्य शिकायत ${chiefComplaint || 'सामान्य परामर्श'} और पूर्व पर्चे डॉक्टर के पास कक्ष 104 में भेज दिए गए हैं। कृपया प्रतीक्षा क्षेत्र में बैठें।`
      : lang === 'mr'
      ? `नमस्कार ${patientForm.patientName || 'रुग्ण'}, आपला ओपीडी टोकन क्रमांक ${tokenNumber || 'ओपीडी टोकन'} आहे. आपल्या तक्रारी आणि कागदपत्रे कक्ष क्रमांक 104 कडे डॉक्टरांकडे पाठवली आहेत. कृपया प्रतीक्षा कक्षात बसा.`
      : `Hello ${patientForm.patientName || 'Patient'}, your OPD Token number is ${tokenNumber || 'OPD Token'}. Your clinical complaints and medical records have been forwarded to Doctor in Room 104. Please wait in the OPD lounge.`;
    speakText(summarySpeech);
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

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhotos(prev => [...prev, dataUrl]);
    stopCamera();
    // Trigger simulated OCR extraction on the captured image
    setOcrLoading(true);
    setTimeout(() => {
      setHasSampleOcr(true);
      setExtractedMeds([
        { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', route: 'Oral' },
        { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', route: 'Oral' },
        { name: 'Ashwagandha Churna', dosage: '3g', frequency: 'HS', route: 'Oral' }
      ]);
      setOcrLoading(false);
    }, 1200);
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
      recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setSpeechInput(text);
        if (chiefComplaint === '') setChiefComplaint(text);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
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
    if (!dpdpConsent) {
      speakText(lang === 'hi' ? 'कृपया आगे बढ़ने से पहले सहमति बॉक्स को चुनें।' : lang === 'mr' ? 'कृपया पुढे जाण्यापूर्वी संमती द्या.' : 'Please provide consent under the DPDP Act 2023 to proceed.');
      alert(lang === 'hi' ? 'कृपया आगे बढ़ने से पहले DPDP सहमति बॉक्स को चेक करें।' : 'Please check the DPDP Act 2023 consent box to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/kiosk/session/start`, {
        abhaId: patientForm.abhaId,
        patientName: patientForm.patientName,
        age: Number(patientForm.age),
        gender: patientForm.gender,
        contactNumber: patientForm.contactNumber,
        languagePreference: lang,
        department: patientForm.department || 'Kayachikitsa',
        isReturningPatient,
        previousVisitDate: previousVisitInfo?.visitDate,
        changesSinceLastVisit,
        changeDetails,
        dpdpConsent: {
          granted: dpdpConsent,
          timestamp: new Date(),
          audioListened: dpdpAudioPlaying,
          consentVersion: 'DPDP-2023-ABDM-v1.0'
        },
        aharaVihara
      });

      if (res.data.status === 'success') {
        const session = res.data.data;
        setSessionId(session._id);
        setTokenNumber(session.tokenNumber);
        setCurrentStep(2); // Step 2 is now Voice Intake (SOCRATES)
        speakText(nextQuestion);
      }
    } catch (err) {
      if (err.response?.status === 429 && err.response?.data?.code === 'RATE_LIMIT_COOLDOWN') {
        setCooldownAlert(err.response.data.message);
        return;
      }
      console.warn('Backend start session fallback:', err?.message);
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
  const handleSendSocratesResponse = async () => {
    const userUtterance = (speechInput || '').trim();
    if (!userUtterance || isSubmitting) return;

    // Retain initial chief complaint across conversation turns without overwriting
    const effectiveChiefComplaint = chiefComplaint || userUtterance;
    if (!chiefComplaint) {
      setChiefComplaint(userUtterance);
    }

    const newTranscript = [
      ...transcript,
      { speaker: 'patient', text: userUtterance, timestamp: new Date() }
    ];
    setTranscript(newTranscript);
    setSpeechInput('');
    setIsSubmitting(true);

    try {
      const targetSessionId = (sessionId && !sessionId.startsWith('session_')) ? sessionId : ('temp_' + Date.now());
      const res = await axios.post(`${API_URL}/kiosk/session/${targetSessionId}/socrates-probe`, {
        chiefComplaint: effectiveChiefComplaint,
        userSpeech: userUtterance,
        currentStep: socratesProgressStep,
        language: lang,
        socratesState,
        transcript: newTranscript,
        age: Number(patientForm.age) || null,
        gender: patientForm.gender || ''
      });

      if (res.data?.status === 'success') {
        const data = res.data.data;
        if (data.nextQuestion) {
          setNextQuestion(data.nextQuestion);
          setTranscript(prev => [
            ...prev,
            { speaker: 'kiosk', text: data.nextQuestion, timestamp: new Date() }
          ]);
          speakText(data.nextQuestion);
        }
        if (data.nextStep) setSocratesProgressStep(data.nextStep);
        if (data.socrates) setSocratesState(data.socrates);
        if (data.redFlags?.length > 0) setRedFlags(data.redFlags);
        if (data.triagePriority === 'emergency') setTriagePriority('emergency');
        if (data.inferredDepartment) {
          setInferredDept(data.inferredDepartment);
          if (data.inferredDepartment.department) {
            setPatientForm(prev => ({ ...prev, department: data.inferredDepartment.department }));
          }
        }
      }
    } catch (err) {
      console.warn('Socrates live dynamic probe error:', err?.message);
      const fallbackQ = lang === 'hi'
        ? 'मैं समझ रहा हूँ। क्या इसके साथ आपको ठंड लगना, सिरदर्द या शरीर में अत्यधिक कमजोरी महसूस हो रही है?'
        : lang === 'mr'
        ? 'समजले. यासोबत तुम्हाला थंडी वाजणे, डोकेदुखी किंवा जास्त अशक्तपणा जाणवतो का?'
        : 'Understood. Along with this, are you noticing any chills, headache, or body weakness?';
      setNextQuestion(fallbackQ);
      setTranscript(prev => [...prev, { speaker: 'kiosk', text: fallbackQ, timestamp: new Date() }]);
      speakText(fallbackQ);
    } finally {
      setIsSubmitting(false);
    }
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

  // Step 4: Save Dashavidha (10 Parameters + Ahara-Vihara)
  const handleSaveDashavidha = async () => {
    setIsSubmitting(true);
    try {
      if (sessionId && !sessionId.startsWith('session_')) {
        await axios.patch(`${API_URL}/kiosk/session/${sessionId}/dashavidha`, {
          dashavidhaPariksha: {
            prakriti: dasha.prakritiDetails || { primaryDosha: dasha.prakriti || 'Vata' },
            vikriti: dasha.vikriti || 'Asthi-Majjagata Kupita Vata',
            sara: dasha.sara || 'Madhyama (Medium)',
            samhanana: dasha.samhanana || 'Madhyama (Moderate)',
            pramana: dasha.pramana || 'Prakrita (Proportionate)',
            satmya: dasha.satmya || 'Sarva-rasa (All tastes adaptable)',
            satva: dasha.satva || 'Pravara (High mental endurance)',
            aharaShakti: {
              abhyavaharana: dasha.abhyavaharana || 'Madhyama (Moderate)',
              jaranaShakti: dasha.agni || 'Samagni (Balanced)'
            },
            vyayamaShakti: dasha.vyayamaShakti || 'Madhyama (Moderate)',
            vaya: dasha.vaya || (patientForm.age < 16 ? 'Bala (Childhood)' : patientForm.age > 60 ? 'Vriddha (Geriatric)' : 'Madhyama (Adult)'),
            koshtha: dasha.koshtha || 'Madhyama'
          },
          aharaVihara
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
    <div className={`w-full min-h-screen transition-all ${
      isHighContrast
        ? 'bg-[#0a0a0a] text-[#FACC15]'
        : isFullscreen ? 'fixed inset-0 z-[999999] bg-slate-950 text-white overflow-y-auto p-4 sm:p-8' : 'max-w-7xl mx-auto py-2 sm:py-6 px-3 sm:px-6'
    } ${
      fontScale === 'large' ? 'text-lg' : fontScale === 'xlarge' ? 'text-xl' : 'text-base'
    }`}>
      
      {/* ────────────────── TOP KIOSK HEADER ────────────────── */}
      <div className={`rounded-3xl p-5 sm:p-7 shadow-2xl mb-8 relative overflow-hidden backdrop-blur-3xl transition-all ${
        isHighContrast
          ? 'bg-black text-[#FACC15] border-2 border-[#FACC15]'
          : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white border border-emerald-500/30'
      }`}>
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

          {/* Controls: Language, TTS, Accessibility (A+/A- & High Contrast), Fullscreen */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-end lg:self-auto justify-end">
            
            {/* Table 3.2 Accessibility: Font Sizing (A- / A+) */}
            <div className="flex bg-slate-900/80 border border-white/10 rounded-2xl p-1 shadow-inner backdrop-blur-md">
              <button
                type="button"
                onClick={() => setFontScale(prev => prev === 'xlarge' ? 'large' : 'normal')}
                className={`px-2.5 py-1 text-xs font-black transition-all cursor-pointer ${fontScale === 'normal' ? 'text-emerald-400' : 'text-gray-300 hover:text-white'}`}
                title="Decrease Font Size (Elderly Mode)"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontScale(prev => prev === 'normal' ? 'large' : 'xlarge')}
                className={`px-2.5 py-1 text-xs font-black transition-all cursor-pointer border-l border-white/10 ${fontScale === 'xlarge' || fontScale === 'large' ? 'text-emerald-400' : 'text-gray-300 hover:text-white'}`}
                title="Increase Font Size (Elderly Mode)"
              >
                A+
              </button>
            </div>

            {/* Table 3.2 Accessibility: WCAG AAA High Contrast Toggle */}
            <button
              type="button"
              onClick={() => setIsHighContrast(!isHighContrast)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-sm ${
                isHighContrast
                  ? 'bg-yellow-400 text-black border-yellow-300 font-black ring-2 ring-yellow-400/50 scale-105'
                  : 'bg-white/5 text-gray-300 hover:text-white border-white/10'
              }`}
              title="Toggle WCAG AAA High-Contrast Accessibility Mode"
            >
              <span>🌓</span>
              <span className="hidden sm:inline">High Contrast</span>
            </button>

            {/* Language Switcher */}
            <div className="flex bg-slate-900/80 border border-white/10 rounded-2xl p-1 shadow-inner backdrop-blur-md">
              {[
                { code: 'hi', label: '🇮🇳 हिन्दी' },
                { code: 'mr', label: '🇮🇳 मराठी' },
                { code: 'en', label: '🇬🇧 English' }
              ].map(item => (
                <button
                  key={item.code}
                  onClick={() => setLang(item.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${lang === item.code ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black scale-105' : 'text-gray-300 hover:text-white'}`}
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

            {/* Statutory DPDP Act 2023 & ABDM Consent Layer (Module D & Step 1 Mandate) */}
            <div className="md:col-span-2 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-500/30 space-y-3 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Statutory Consent (DPDP Act 2023 & ABDM Framework)
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={playDpdpConsentAudio}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-700 dark:text-emerald-300 hover:text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {lang === 'hi' ? '🔊 सहमति सुनें' : lang === 'mr' ? '🔊 संमती ऐका' : '🔊 Listen to Consent'}
                </button>
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dpdpConsent}
                  onChange={(e) => setDpdpConsent(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded-lg border-2 border-emerald-500 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-700 dark:text-gray-300 font-medium leading-relaxed">
                  {lang === 'hi'
                    ? 'मैं डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अधिनियम 2023 एवं ABDM के तहत AIIA अस्पताल ओपीडी परामर्श हेतु अपने स्वास्थ्य लक्षण, मेडिकल इतिहास तथा पर्चे साझा करने की स्पष्ट, प्रतिसंहरणीय (Revocable) सहमति देता/देती हूँ।'
                    : lang === 'mr'
                    ? 'मी डिजिटल वैयक्तिक डेटा संरक्षण (DPDP) कायदा २०२३ आणि ABDM अंतर्गत AIIA रुग्णालय ओपीडी सल्लामसलतीसाठी माझी लक्षणे व पूर्व आजारांची माहिती देण्यास स्वेच्छेने संमती देतो/देते. ही संमती कधीही मागे घेता येईल.'
                    : 'I grant explicit, revocable consent under the Digital Personal Data Protection (DPDP) Act 2023 and ABDM Framework for AIIA to capture my clinical symptoms, medical history, and paper records for OPD consultation.'}
                </span>
              </label>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-1 gap-2">
                <span>🔒 Terminal memory auto-clears within 30 seconds for patient privacy</span>
                <button
                  type="button"
                  onClick={() => setShowDpdpModal(true)}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  View Granular Terms (Section 6 DPDP Act) →
                </button>
              </div>
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
                  {(inferredDept || (patientForm.department && transcript.length > 0)) ? (
                    <>
                      <span className="px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-sm">
                        {patientForm.department || inferredDept?.department}
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
                  {(inferredDept || (patientForm.department && transcript.length > 0)) ? (
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
              {(inferredDept || (patientForm.department && transcript.length > 0)) ? "Change Clinic Manually ✍️" : "Select Clinic Manually ✍️"}
            </button>
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
                  {DEPARTMENTS.map(dept => {
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

          {/* Conversational Doctor-Patient Dialogue Feed & Console */}
          <div className="rounded-3xl bg-slate-50 dark:bg-slate-800/50 border-2 border-emerald-500/30 overflow-hidden shadow-xl flex flex-col">
            
            {/* Feed Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/40 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Live AI Doctor Intake Dialogue
                  </h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Multilingual Clinical Reasoning Active
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? 'Stop Mic' : 'Voice Mic'}</span>
                </button>
              </div>
            </div>

            {/* Chat Messages Feed with Smooth Auto-Scroll */}
            <div className="p-4 sm:p-6 space-y-4 min-h-[220px] max-h-[380px] overflow-y-auto scroll-smooth">
              {transcript.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${item.speaker === 'kiosk' ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
                >
                  {item.speaker === 'kiosk' && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-xl p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                      item.speaker === 'kiosk'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-tl-sm'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-tr-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 pb-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase opacity-75">
                        {item.speaker === 'kiosk' ? 'AIIA Medical AI Doctor' : patientForm.patientName || 'Patient'}
                      </span>
                      {item.speaker === 'kiosk' && (
                        <button
                          type="button"
                          onClick={() => speakText(item.text)}
                          className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 p-0.5 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                          title="Listen aloud"
                        >
                          <Volume2 className="w-3 h-3" /> Listen
                        </button>
                      )}
                    </div>
                    <div>{item.text}</div>
                  </div>
                </div>
              ))}

              {isSubmitting && (
                <div className="flex gap-3 justify-start items-center animate-in fade-in">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2 shadow-sm">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Doctor AI is evaluating your response...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Live Chat Input Bar: Enter-key enabled with integrated Voice and Send buttons */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendSocratesResponse();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
                title={isListening ? 'Stop listening' : 'Speak using microphone'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-500" />}
              </button>

              <input
                type="text"
                value={speechInput}
                onChange={(e) => {
                  setSpeechInput(e.target.value);
                  if (!chiefComplaint) setChiefComplaint(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendSocratesResponse();
                  }
                }}
                placeholder={isListening ? "Listening to your voice... (speak clearly)" : "Type your answer here & press Enter to send..."}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-gray-400"
              />

              <button
                type="submit"
                disabled={isSubmitting || !speechInput.trim()}
                className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md ${
                  speechInput.trim() && !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

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

          <div className="space-y-8">
            
            {/* 1. Prakriti (Constitutional Body Type) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">1</span>
                  {t.prakritiTitle || "Prakriti (Natural Body Constitution)"}
                </label>
                <span className="text-[11px] font-medium text-slate-500">Charaka Samhita Vimanashana 8/95</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'Vata', title: '💨 Vata (वात)', sub: 'Light frame, quick actions, prone to joint stiffness and dry skin.', details: { primaryDosha: 'Vata', secondaryDosha: 'Kapha', vataScore: 65, pittaScore: 25, kaphaScore: 40 } },
                  { id: 'Pitta', title: '🔥 Pitta (पित्त)', sub: 'Medium build, sharp digestion, warm skin, prone to acidity.', details: { primaryDosha: 'Pitta', secondaryDosha: 'Vata', vataScore: 35, pittaScore: 70, kaphaScore: 20 } },
                  { id: 'Kapha', title: '🌊 Kapha (कफ)', sub: 'Sturdy broad build, calm nature, slow digestion, good stamina.', details: { primaryDosha: 'Kapha', secondaryDosha: 'Pitta', vataScore: 20, pittaScore: 30, kaphaScore: 75 } },
                  { id: 'Unsure', title: t.unsurePrakriti || '🤔 Unsure / Doctor check', sub: t.unsurePrakritiSub || 'Leave for doctor pulse examination (Nadi Pariksha).', details: { primaryDosha: 'Undetermined', secondaryDosha: 'Pending Doctor Nadi Pariksha', vataScore: 33, pittaScore: 33, kaphaScore: 33 } }
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

            {/* 2. Vikriti (Current Dosha Imbalance / Morbidity) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">2</span>
                  Vikriti (Current Morbidity & Dosha Imbalance)
                </label>
                <span className="text-[11px] font-medium text-slate-500">Pathological Deviation</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { id: 'Vataja Morbidity', label: '💨 Vata Imbalance', sub: 'Joint pain, tremors, dryness, constipation' },
                  { id: 'Pittaja Morbidity', label: '🔥 Pitta Imbalance', sub: 'Burning, inflammation, skin rash, hyperacidity' },
                  { id: 'Kaphaja Morbidity', label: '🌊 Kapha Imbalance', sub: 'Heaviness, mucus, sweet taste, sluggishness' },
                  { id: 'Dwandwaja / Sannipata', label: '⚡ Mixed Dosha', sub: 'Combined symptoms across two or three doshas' },
                  { id: 'Balanced / Sama', label: '🟢 Sama / Balanced', sub: 'No acute doshic aggravation' }
                ].map(v => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setDasha({ ...dasha, vikriti: v.id })}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${dasha.vikriti === v.id ? 'border-amber-500 bg-amber-500/10 shadow-md font-bold scale-[1.02]' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-amber-400/40'}`}
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white block">{v.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-gray-400 mt-1 block leading-tight">{v.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Sara (Dhatu Tissue Excellence & Vitality) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">3</span>
                  Sara (Tissue Quality & Vitality / Dhatu Excellence)
                </label>
                <span className="text-[11px] font-medium text-slate-500">Immunity & Resilience</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'Pravara (High)', label: '🌟 Pravara Sara (High Vitality)', desc: 'Robust tissues, excellent immunity, radiant skin and strong bones.' },
                  { id: 'Madhyama (Medium)', label: '⚖️ Madhyama Sara (Moderate)', desc: 'Average tissue strength, healthy maintenance with balanced lifestyle.' },
                  { id: 'Avara (Low)', label: '🍃 Avara Sara (Delicate)', desc: 'Low tissue reserve, fatigues easily, prone to recurrent illness.' }
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDasha({ ...dasha, sara: s.id })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${dasha.sara === s.id ? 'border-teal-500 bg-teal-500/10 shadow-md scale-[1.02]' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-teal-400/40'}`}
                  >
                    <div className="text-sm font-black text-slate-900 dark:text-white">{s.label}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Samhanana (Compactness) & 5. Pramana (Proportions) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">4</span>
                  Samhanana (Body Compactness & Musculoskeletal Symmetry)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Susamhata (High)', label: 'Susamhata', desc: 'Well-knit, compact frame' },
                    { id: 'Madhyama', label: 'Madhyama', desc: 'Average build' },
                    { id: 'Hina / Asamhata', label: 'Hina', desc: 'Loose / fragile joints' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDasha({ ...dasha, samhanana: c.id })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${dasha.samhanana === c.id ? 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800'}`}
                    >
                      <span className="text-xs font-black block">{c.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">5</span>
                  Pramana (Anthropometry & Bodily Proportions)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Prakrita (Proportionate)', label: 'Prakrita', desc: 'Harmonious BMI & height' },
                    { id: 'Atisthaulya (Obese / Heavy)', label: 'Atisthaulya', desc: 'High adiposity / heaviness' },
                    { id: 'Atikarshya (Emaciated / Lean)', label: 'Atikarshya', desc: 'Underweight / lean build' }
                  ].map(pr => (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => setDasha({ ...dasha, pramana: pr.id })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${dasha.pramana === pr.id ? 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800'}`}
                    >
                      <span className="text-xs font-black block">{pr.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{pr.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. Satmya (Habituation & Adaptability) & 7. Satva (Mental Resilience) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">6</span>
                  Satmya (Dietary & Environmental Adaptability)
                </label>
                <select
                  value={dasha.satmya}
                  onChange={(e) => setDasha({ ...dasha, satmya: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Satmya Habituation --</option>
                  <option value="Sarva-rasa Satmya (All 6 tastes adaptable)">Sarva-rasa Satmya (Tolerates sweet, sour, salty, pungent, bitter, astringent)</option>
                  <option value="Oka-satmya (Habituated to specific regional diet)">Oka-satmya (Tolerates only customary native foods)</option>
                  <option value="Vyashamishra (Mixed adaptability)">Vyashamishra (Moderate dietary flexibility)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">7</span>
                  {t.satvaTitle || "Satva (Mental Resilience & Pain Endurance)"}
                </label>
                <select
                  value={dasha.satva}
                  onChange={(e) => setDasha({ ...dasha, satva: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Satva Endurance --</option>
                  <option value="Pravara (High)">Pravara Satva (Strong mental fortitude, high pain tolerance)</option>
                  <option value="Madhyama">Madhyama Satva (Moderate endurance, manages with doctor reassurance)</option>
                  <option value="Avara (Low)">Avara Satva (Anxious, low pain tolerance, easily distressed)</option>
                </select>
              </div>
            </div>

            {/* 8. Ahara Shakti (Jarana Shakti / Agni + Abhyavaharana Shakti / Appetite) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">8</span>
                  Ahara Shakti (Digestive Capacity & Appetite)
                </label>
                <span className="text-[11px] font-medium text-slate-500">Jarana & Abhyavaharana Shakti</span>
              </div>
              
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-600 dark:text-gray-400 block">
                  Jarana Shakti / Agni (Digestive Fire):
                </span>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {[
                    { id: 'Pravara (Large)', label: 'Abhyavaharana: Pravara', desc: 'Large meal intake capacity' },
                    { id: 'Madhyama (Normal)', label: 'Abhyavaharana: Madhyama', desc: 'Normal meal portion capacity' },
                    { id: 'Avara (Small)', label: 'Abhyavaharana: Avara', desc: 'Poor appetite / early fullness' }
                  ].map(ab => (
                    <button
                      key={ab.id}
                      type="button"
                      onClick={() => setDasha({ ...dasha, abhyavaharana: ab.id })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${dasha.abhyavaharana === ab.id ? 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-700 dark:text-emerald-300' : 'border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800'}`}
                    >
                      <span className="text-xs font-black block">{ab.label}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{ab.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 9. Vyayama Shakti (Physical Endurance) & 10. Vaya (Age Stage) & Koshtha */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">9</span>
                  Vyayama Shakti (Work Capacity)
                </label>
                <select
                  value={dasha.vyayamaShakti}
                  onChange={(e) => setDasha({ ...dasha, vyayamaShakti: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Work Capacity --</option>
                  <option value="Pravara (High)">Pravara (Can do strenuous physical work easily)</option>
                  <option value="Madhyama (Moderate)">Madhyama (Moderate exercise tolerance)</option>
                  <option value="Avara (Low)">Avara (Exhausts easily with minimal exertion)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-mono">10</span>
                  Vaya (Age Stage Classification)
                </label>
                <select
                  value={dasha.vaya || (patientForm.age && patientForm.age < 16 ? 'Bala (Childhood <16y)' : patientForm.age && patientForm.age > 60 ? 'Vriddha (Geriatric >60y)' : 'Madhyama (Adult 16-60y)')}
                  onChange={(e) => setDasha({ ...dasha, vaya: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="Bala (Childhood <16y)">Bala (Childhood & Growth / Kapha Predominance)</option>
                  <option value="Madhyama (Adult 16-60y)">Madhyama (Youth & Adult Vitality / Pitta Predominance)</option>
                  <option value="Vriddha (Geriatric >60y)">Vriddha (Geriatric Dhatu Depletion / Vata Predominance)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                  {t.koshthaTitle || "Koshtha (Bowel Habit)"}
                </label>
                <select
                  value={dasha.koshtha}
                  onChange={(e) => setDasha({ ...dasha, koshtha: e.target.value })}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Select Koshtha --</option>
                  <option value="Mridu">Mridu Koshtha (Soft, easily cleared with milk/ghee)</option>
                  <option value="Madhyama">Madhyama Koshtha (Normal regular daily bowel routine)</option>
                  <option value="Krura">Krura Koshtha (Hard, prone to constipation and dry stools)</option>
                </select>
              </div>
            </div>

            {/* ────────────────── AHARA-VIHARA (LIFESTYLE & DIET) ASSESSMENT (PS 26047) ────────────────── */}
            <div className="p-6 rounded-3xl bg-emerald-500/5 dark:bg-emerald-950/20 border-2 border-emerald-500/20 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    🥗 Personal Ahara & Vihara Lifestyle Profile
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                    Dietary habits, circadian sleep patterns, and daily lifestyle routine (Charaka Samhita Sutrasthana)
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  PS 26047 Standard
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Diet Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-2">Dietary Pattern (Ahara)</label>
                  <select
                    value={aharaVihara.dietType}
                    onChange={(e) => setAharaVihara({ ...aharaVihara, dietType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Vegetarian">Vegetarian (Shakahari)</option>
                    <option value="Lacto-Vegetarian">Lacto-Vegetarian (Includes dairy)</option>
                    <option value="Non-Vegetarian">Non-Vegetarian (Mamsahari)</option>
                    <option value="Vegan">Vegan (Strict plant-based)</option>
                  </select>
                </div>

                {/* Water Intake */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-2">Water Intake (Jala-Pana)</label>
                  <select
                    value={aharaVihara.waterIntake}
                    onChange={(e) => setAharaVihara({ ...aharaVihara, waterIntake: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Warm / Ushnodaka">Warm Water (Ushnodaka)</option>
                    <option value="Normal">Room Temperature (Sheeta)</option>
                    <option value="Refrigerated / Cold">Refrigerated / Chilled</option>
                  </select>
                </div>

                {/* Sleep Pattern */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-2">Circadian Sleep (Nidra)</label>
                  <select
                    value={aharaVihara.sleepPattern}
                    onChange={(e) => setAharaVihara({ ...aharaVihara, sleepPattern: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Sound (7-8 hours)">Sound Sleep (7-8 hours)</option>
                    <option value="Disturbed / Interrupted">Disturbed / Insomnia (Anidra)</option>
                    <option value="Day-sleeping (Divaswapna)">Day-sleeping (Divaswapna)</option>
                    <option value="Late Nights (Ratri-Jagarana)">Late Nights (Ratri-Jagarana)</option>
                  </select>
                </div>

                {/* Habits / Vyasana */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-2">Habits / Vyasana</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['None', 'Tea/Coffee > 3 cups', 'Tobacco / Bidi', 'Alcohol'].map(h => {
                      const isSelected = aharaVihara.habitsAddictions?.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            if (h === 'None') {
                              setAharaVihara({ ...aharaVihara, habitsAddictions: ['None'] });
                            } else {
                              const filtered = (aharaVihara.habitsAddictions || []).filter(x => x !== 'None');
                              if (isSelected) {
                                setAharaVihara({ ...aharaVihara, habitsAddictions: filtered.filter(x => x !== h) });
                              } else {
                                setAharaVihara({ ...aharaVihara, habitsAddictions: [...filtered, h] });
                              }
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-gray-300 dark:border-white/10 hover:border-emerald-400'}`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
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

          {/* Comprehensive Longitudinal Medical History Dossier Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900/60 border-2 border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Comprehensive Medical History Dossier (8 Dimensions)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase">
                    Interactive
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                  Inspect past lab reports, longitudinal trends, drug allergies, past hospital visits, surgical history & AYUSH lifestyle profile.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
            >
              <Eye className="w-4 h-4" />
              <span>Open Medical History Dossier</span>
            </button>
          </div>

          {/* Comprehensive Medical History Modal */}
          {showHistoryModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
              <div className="w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl">
                <ComprehensiveMedicalHistory
                  patientData={{
                    ...patientForm,
                    pastDiseases,
                    allergies: selectedAllergies
                  }}
                  isModal={true}
                  onClose={() => setShowHistoryModal(false)}
                />
              </div>
            </div>
          )}

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

            {/* Spoken Registered Case Summary for Low-Literacy / Visual Accessibility (Module A.3) */}
            <div className="my-4 p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Volume2 className={`w-6 h-6 ${caseSummaryAudioPlaying ? 'animate-bounce text-emerald-500' : ''}`} />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 dark:text-white block">
                    🔊 {lang === 'hi' ? 'पंजीकरण का बोलकर सारांश सुनें' : lang === 'mr' ? 'नोंदणीकृत सारांश ऐका' : 'Listen to Spoken Confirmation'}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-gray-400">
                    {lang === 'hi' ? 'कम साक्षर अथवा दृष्टिबाधित मरीजों के लिए ऑडियो सारांश' : lang === 'mr' ? 'कमी साक्षर रुग्णांसाठी ऑडिओ पुष्टीकरण' : 'Audio voice confirmation of token, complaints and room'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={playRegisteredCaseSummaryAudio}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <Volume2 className="w-4 h-4" /> {caseSummaryAudioPlaying ? (lang === 'hi' ? 'सुना रहे हैं...' : 'Speaking...') : (lang === 'hi' ? 'आवाज़ सुनें' : 'Play Audio')}
              </button>
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

            {/* Doctor QR Code Scan Box */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 flex items-center gap-4">
              <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-sm border border-gray-200 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="30" height="30" fill="black" />
                  <rect x="15" y="15" width="20" height="20" fill="white" />
                  <rect x="20" y="20" width="10" height="10" fill="black" />
                  <rect x="60" y="10" width="30" height="30" fill="black" />
                  <rect x="65" y="15" width="20" height="20" fill="white" />
                  <rect x="70" y="20" width="10" height="10" fill="black" />
                  <rect x="10" y="60" width="30" height="30" fill="black" />
                  <rect x="15" y="65" width="20" height="20" fill="white" />
                  <rect x="20" y="70" width="10" height="10" fill="black" />
                  <rect x="50" y="45" width="10" height="10" fill="black" />
                  <rect x="70" y="70" width="20" height="20" fill="black" />
                </svg>
              </div>
              <div className="text-xs">
                <span className="font-black text-slate-900 dark:text-white block uppercase">Instant Doctor Workstation QR</span>
                <p className="text-gray-500 mt-0.5">
                  Scanning this QR code at the doctor's desk immediately loads the synthesized 10-second SOAP note and dual ICD-11 / NAMASTE diagnosis codes.
                </p>
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

      {/* ────────────────── STATUTORY DPDP ACT 2023 & ABDM CONSENT MODAL (MODULE D) ────────────────── */}
      {showDpdpModal && (
        <div className="fixed inset-0 z-[9999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border-2 border-emerald-500/40 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    DPDP Act 2023 Statutory Consent Disclosure
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    India Digital Personal Data Protection Act, 2023 (Section 6 & 7 Compliance)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDpdpModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700 dark:text-gray-300 max-h-[55vh] overflow-y-auto pr-2">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="font-black text-emerald-700 dark:text-emerald-400 block mb-1">
                  Data Fiduciary: All India Institute of Ayurveda (AIIA) / Ministry of Ayush
                </span>
                Your clinical symptoms, biometrics, Dashavidha parameters, and medical documents will be processed solely for OPD consultation, clinical auto-routing, and preparation of the standardized case-taking summary.
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-white">Purpose Limitation & Minimal Storage</span>
                    Data collected during this kiosk session is transmitted over TLS 1.3 encrypted channels directly to the treating doctor's secure workstation.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-white">Terminal Data Erasure (Privacy Guard)</span>
                    To protect walk-in patient privacy, this kiosk automatically wipes cached tokens and camera scans within 30 seconds of session completion.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-slate-900 dark:text-white">Right to Revoke & Grievance Redressal</span>
                    You may withdraw consent or request data rectification at any time through the ABDM Consent Manager or hospital OPD registration desk.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={playDpdpConsentAudio}
                className="px-4 py-2.5 rounded-xl border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 hover:bg-emerald-500/10 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" /> Listen Audio Explainer
              </button>

              <button
                type="button"
                onClick={() => {
                  setDpdpConsent(true);
                  setShowDpdpModal(false);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer"
              >
                I Accept & Understand Consent Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If fullscreen is active, render via Portal to document.body to guarantee ZERO collision with the Sidebar!
  if (isFullscreen) {
    return createPortal(kioskContent, document.body);
  }

  return kioskContent;
};

export default KioskIntake;
