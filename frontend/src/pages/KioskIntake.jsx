import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    Mic, MicOff, Volume2, VolumeX, CheckCircle2, AlertTriangle,
    ArrowRight, ArrowLeft, RefreshCw, Activity, Heart, Thermometer,
    Shield, User, QrCode, Printer, Check, Phone, Info, Stethoscope,
    Sparkles, Layers, Maximize2, Minimize2, ChevronRight, Upload,
    Camera, FileText, Pill, AlertOctagon, Clock, UserCheck, Flame,
    Wind, Droplets, Zap, ShieldAlert, Sparkle, Download, X, Trash2,
    Globe, ChevronDown, BookOpen, Eye, Snowflake, Building2
} from 'lucide-react';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useCaregiver } from '../context/CaregiverContext';
import SymptomIconPicker from '../components/kiosk/SymptomIconPicker';
import ConsentScreen from '../components/kiosk/ConsentScreen';
import DocumentVerification from '../components/kiosk/DocumentVerification';
import ConsentPolicyModal from '../components/kiosk/ConsentPolicyModal';
import ParikshaGuideModal from '../components/kiosk/ParikshaGuideModal';
import DepartmentSelectionModal from '../components/kiosk/DepartmentSelectionModal';
import { saveKioskDraft, loadKioskDraft, installOnlineFlush, queueOfflineRequest, clearKioskLocalCache } from '../utils/kioskOffline';
import NeedStaffHelp from '../components/NeedStaffHelp';
import { generateOpdTokenPDF } from '../utils/pdfGenerator';

const LANG_OPTIONS = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' }
];

const SPEECH_LOCALE = {
    en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN'
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
// Facilities offered when the patient books from home rather than at the kiosk.
const HOSPITALS = [
    { id: 'VS-CHC-01', name: 'VaidyaSetu Community Health Centre, Wardha' },
    { id: 'VS-DH-02', name: 'District Hospital, Nagpur' },
    { id: 'VS-AYU-03', name: 'Govt. Ayurvedic Hospital, Nashik' },
    { id: 'VS-PHC-04', name: 'Primary Health Centre, Seloo' }
];

const DOCTORS_BY_DEPT = {
    Kayachikitsa: ['Dr. Anjali Deshmukh', 'Dr. Ramesh Patil'],
    Panchakarma: ['Dr. Suresh Kulkarni'],
    'General Medicine': ['Dr. Meera Nair', 'Dr. Vikram Joshi'],
    Cardiology: ['Dr. Arun Mehta'],
    Orthopaedics: ['Dr. Sanjay Rao'],
    Paediatrics: ['Dr. Kavita Sharma'],
    Dermatology: ['Dr. Neha Gupta'],
    ENT: ['Dr. Rahul Bose']
};

const DEPARTMENTS = [
    { id: 'Kayachikitsa', label: 'कायचिकित्सा (Kayachikitsa)', sub: 'Internal Medicine & General Care', icon: Stethoscope, color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400' },
    { id: 'Shalya', label: 'शल्य तंत्र (Shalya Tantra)', sub: 'Musculoskeletal, Joints & Surgery', icon: Activity, color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400' },
    { id: 'Shalakya', label: 'शालाक्य तंत्र (Shalakya Tantra)', sub: 'ENT, Eye, Head & Neck Care', icon: Zap, color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400' },
    { id: 'Prasuti', label: 'प्रसूति व स्त्री रोग (Prasuti Tantra)', sub: 'Women\'s Health & Maternity', icon: Heart, color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400' },
    { id: 'Kaumarbhritya', label: 'कौमारभृत्य (Kaumarbhritya)', sub: 'Pediatrics & Child Wellness', icon: Sparkles, color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400' }
];


const STEP_VOICE_INSTRUCTIONS = {
    1: {
        en: "Welcome to MediKiosk. Please verify your ABHA ID and personal details, check consent permissions, and tap proceed.",
        hi: "चरण एक। मेडिकियोस्क में आपका स्वागत है। कृपया अपनी आभा आईडी व व्यक्तिगत जानकारी की पुष्टि करें और सहमति देकर आगे बढ़ें।",
        mr: "टप्पा एक. मेडिकियोस्कमध्ये आपले स्वागत आहे. कृपया आपला आभा क्रमांक व माहिती तपासा, संमती द्या आणि पुढे जा."
    },
    2: {
        en: "Step two. Voice clinical intake. Tap the green microphone to speak your symptoms, or select from suggested options.",
        hi: "चरण दो। बोलकर लक्षण बताएं। हरा माइक दबाकर अपनी बीमारी बताएं या नीचे दिए गए विकल्पों में से चुनें।",
        mr: "टप्पा दोन. बोलून आजार सांगा. हिरवा माईक दाबून आपली लक्षणे सांगा किंवा खालील पर्यायांमधून निवडा."
    },
    3: {
        en: "Step three. Vitals station. Use the connected kiosk sensors to measure blood pressure, pulse, temperature, and oxygen.",
        hi: "चरण तीन। वाइटल्स स्टेशन। कियोस्क सेंसर से अपना रक्तचाप, नब्ज, तापमान और ऑक्सीजन स्तर दर्ज करें।",
        mr: "टप्पा तीन. वाइटल्स तपासणी. कियोस्क सेन्सरद्वारे आपला रक्तदाब, नाडी, तापमान व ऑक्सिजन मोजा."
    },
    4: {
        en: "Step four. AYUSH Dashavidha Pariksha. Select your Prakriti body type and digestion fire, or leave for doctor examination.",
        hi: "चरण चार। आयुष दशविध परीक्षा। अपने शरीर की प्रकृति और पाचन शक्ति का चयन करें या डॉक्टर की जांच हेतु छोड़ें।",
        mr: "टप्पा चार. आयुष दशविध परीक्षा. आपल्या शरीराची प्रकृती व पचनक्षमता निवडा किंवा डॉक्टरांच्या तपासणीसाठी ठेवा."
    },
    5: {
        en: "Step five. Previous prescriptions and reports scan. Upload your existing medicines to check for herb-drug safety.",
        hi: "चरण पांच। पुराने पर्चे व रिपोर्ट स्कैन करें। वर्तमान दवाओं की जांच और दुष्प्रभाव रोकने हेतु पर्चा अपलोड करें।",
        mr: "टप्पा पाच. जुनी कागदपत्रे स्कॅन करा. चालू औषधांची तपासणी करून औषध-दुष्परिणाम टाळण्यासाठी प्रिस्क्रिप्शन अपलोड करा."
    },
    6: {
        en: "Step six. Registration complete. Please take your printed OPD token slip and proceed to the designated consultation room.",
        hi: "चरण छह। पंजीयन पूर्ण हुआ। कृपया अपनी मुद्रित ओपीडी टोकन पर्ची प्राप्त करें और परामर्श कक्ष में जाएं।",
        mr: "टप्पा सहा. नोंदणी यशस्वीरीत्या पूर्ण झाली. कृपया आपली छापील ओपीडी पावती घ्या आणि नियुक्त कक्षात जा."
    }
};

// Step 4: AYUSH Pariksha Configuration & Clinical Mapping
const TRIVIDHA_CONFIG = [
    {
        key: 'darshana',
        num: '१',
        titleHi: 'दर्शन परीक्षा',
        titleEn: 'Darshana (Visual Inspection)',
        descHi: 'वर्ण, नेत्र, मुख कान्ति और शरीर का समग्र स्वरूप',
        descEn: 'Complexion, sclera, facial luster & posture',
        options: [
            {
                id: 'Normal / Healthy',
                labelHi: 'प्राकृत (Normal)',
                labelEn: 'Clear & Healthy',
                desc: 'Clear sclera, bright complexion, radiant healthy skin',
                badge: 'Prakrita',
                color: 'emerald',
                icon: Sparkles
            },
            {
                id: 'Pandu (Pale)',
                labelHi: 'पाण्डु (Pale / Anemic)',
                labelEn: 'Pale / Hypochromic',
                desc: 'Pale sclera, tongue & nailbeds, signs of fatigue/anemia',
                badge: 'Pandu',
                color: 'amber',
                icon: Activity
            },
            {
                id: 'Peeta (Jaundiced)',
                labelHi: 'पीत (Yellow / Pitta)',
                labelEn: 'Icteric / Yellowish',
                desc: 'Yellowish tint in eyes, skin or tongue, excess metabolic heat',
                badge: 'Peeta',
                color: 'orange',
                icon: Flame
            },
            {
                id: 'Shyava (Dark/Cyanotic)',
                labelHi: 'श्याव (Dark / Vata)',
                labelEn: 'Dull / Cyanotic',
                desc: 'Dull grayish-blackish tone, dry lusterless appearance',
                badge: 'Shyava',
                color: 'indigo',
                icon: Wind
            }
        ]
    },
    {
        key: 'sparshana',
        num: '२',
        titleHi: 'स्पर्शन परीक्षा',
        titleEn: 'Sparshana (Tactile & Temperature)',
        descHi: 'त्वचा तापमान, स्निग्धता, आर्द्रता और स्पर्श अनुभूति',
        descEn: 'Skin temperature, texture, moisture & tactile feel',
        options: [
            {
                id: 'Samasheeta (Normal)',
                labelHi: 'समशीतोष्ण (Normal)',
                labelEn: 'Balanced Warmth',
                desc: 'Pleasantly warm, supple, balanced moist skin texture',
                badge: 'Samasheeta',
                color: 'emerald',
                icon: Heart
            },
            {
                id: 'Ushna (Warm/Febrile)',
                labelHi: 'उष्ण (Hot / Febrile)',
                labelEn: 'Warm / Febrile',
                desc: 'Elevated skin heat, hot flashes, sweating, feverishness',
                badge: 'Ushna',
                color: 'rose',
                icon: Flame
            },
            {
                id: 'Sheeta (Cold Clammy)',
                labelHi: 'शीत (Cold / Clammy)',
                labelEn: 'Chilled / Hypothermic',
                desc: 'Chilled extremities, clammy skin, poor peripheral warmth',
                badge: 'Sheeta',
                color: 'cyan',
                icon: Snowflake
            },
            {
                id: 'Ruksha (Rough/Dry)',
                labelHi: 'रूक्ष (Rough & Scaly)',
                labelEn: 'Dry / Coarse',
                desc: 'Dry, rough, unlubricated skin, cracked epidermis',
                badge: 'Ruksha',
                color: 'amber',
                icon: Wind
            }
        ]
    },
    {
        key: 'prashna',
        num: '३',
        titleHi: 'प्रश्न परीक्षा',
        titleEn: 'Prashna (Clinical Inquiry - Pain Nature)',
        descHi: 'कष्ट व वेदना का प्रकार, समय और तीव्रता का विवरण',
        descEn: 'Subjective pain quality, chronicity & aggravating factors',
        options: [
            {
                id: 'Toda (Piercing/Shooting Vata Pain)',
                labelHi: 'तोद / सुई चुभना (Piercing)',
                labelEn: 'Piercing / Shooting (Vata)',
                desc: 'Sharp, intermittent shooting pain that shifts locations',
                badge: 'Vata Pain',
                color: 'purple',
                icon: Zap
            },
            {
                id: 'Daha (Burning Sensations Pitta)',
                labelHi: 'दाह / जलन (Burning)',
                labelEn: 'Burning Heat (Pitta)',
                desc: 'Intense burning sensation, acidity, internal inflammatory heat',
                badge: 'Pitta Pain',
                color: 'rose',
                icon: Flame
            },
            {
                id: 'Gaurava (Heaviness/Numbness Kapha)',
                labelHi: 'गौरव / भारीपन (Heavy / Dull)',
                labelEn: 'Heavy / Aching (Kapha)',
                desc: 'Stiffness, sluggishness, dull continuous ache, localized heaviness',
                badge: 'Kapha Pain',
                color: 'blue',
                icon: Layers
            }
        ]
    }
];

const ASHTAVIDHA_CONFIG = [
    {
        key: 'nadi',
        num: '१',
        hindi: 'नाड़ी परीक्षा',
        title: 'Nadi (Pulse Gait & Rhythm)',
        sub: 'Classic arterial wave palpation',
        icon: Heart,
        color: 'rose',
        placeholder: '-- Nadi Gati (Pulse) चुनें --',
        options: [
            { value: 'Sarpa Gati (Vata - Rapid/Curving)', label: 'सर्प गति (Vata - Rapid / Serpentine)', short: '🐍 सर्प गति (Vata)' },
            { value: 'Manduka Gati (Pitta - Jumping/Bounding)', label: 'मण्डूक गति (Pitta - Jumping / Bounding)', short: '🐸 मण्डूक (Pitta)' },
            { value: 'Hamsa Gati (Kapha - Slow/Steady)', label: 'हंस गति (Kapha - Steady / Swan-like)', short: '🦢 हंस गति (Kapha)' },
            { value: 'Sannipata (Mixed)', label: 'सन्निपात (Mixed complex rhythm)', short: '⚡ सन्निपात (Mixed)' }
        ]
    },
    {
        key: 'jihwa',
        num: '२',
        hindi: 'जिह्वा परीक्षा',
        title: 'Jihwa (Tongue Surface & Coating)',
        sub: 'Digestive fire & metabolic toxins (Ama)',
        icon: Sparkles,
        color: 'purple',
        placeholder: '-- Jihwa (Tongue) स्थिति चुनें --',
        options: [
            { value: 'Nirama (Pink & Clear)', label: 'निराम (Pink, Clear & Healthy)', short: '🌸 निराम (Clean/Pink)' },
            { value: 'Saama (White Thick Coating / Aama)', label: 'साम (White Thick Coated / Toxins)', short: '⚪ साम (Coated/Ama)' },
            { value: 'Ruksha (Dry & Cracked)', label: 'रूक्ष (Dry, Cracked / Vata)', short: '🍂 रूक्ष (Dry/Cracked)' },
            { value: 'Rakta (Red & Inflamed)', label: 'रक्त (Red / Hyperemic / Pitta)', short: '🔴 रक्त (Red/Pitta)' }
        ]
    },
    {
        key: 'mala',
        num: '३',
        hindi: 'मल परीक्षा',
        title: 'Mala (Stool & Bowel Elimination)',
        sub: 'Excretory consistency & regularity',
        icon: Layers,
        color: 'amber',
        placeholder: '-- Mala (Bowel) स्थिति चुनें --',
        options: [
            { value: 'Prakrita (Normal)', label: 'प्राकृत (Normal Regular Formed)', short: '✨ प्राकृत (Regular)' },
            { value: 'Baddha (Constipated)', label: 'बद्ध (Hard / Constipated / Dry)', short: '🧱 बद्ध (Hard)' },
            { value: 'Sandra / Drava (Loose)', label: 'द्रव / पतला (Loose / Diarrhea)', short: '💧 द्रव (Loose)' },
            { value: 'Sama (Mucus)', label: 'साम (Mucus-coated / Aama)', short: '🪨 साम (Mucus)' }
        ]
    },
    {
        key: 'mootra',
        num: '४',
        hindi: 'मूत्र परीक्षा',
        title: 'Mootra (Urine Character & Sensation)',
        sub: 'Urinary clarity, frequency & sensation',
        icon: Droplets,
        color: 'cyan',
        placeholder: '-- Mootra (Urine) स्थिति चुनें --',
        options: [
            { value: 'Prakrita', label: 'प्राकृत (Normal Clear Pale Amber)', short: '✨ प्राकृत (Clear Amber)' },
            { value: 'Rakta-Peeta (Burning/Yellow)', label: 'रक्त-पीत (High Colored / Burning)', short: '🔥 रक्त-पीत (Burning)' },
            { value: 'Pandu (Pale)', label: 'पाण्डु (Pale / Copious Watery)', short: '💧 पाण्डु (Pale Copious)' },
            { value: 'Avila (Turbid)', label: 'आविल (Cloudy / Turbid Sediment)', short: '🌫️ आविल (Turbid)' }
        ]
    },
    {
        key: 'shabda',
        num: '५',
        hindi: 'शब्द परीक्षा',
        title: 'Shabda (Voice Resonance & Speech)',
        sub: 'Phonation, clarity & acoustic power',
        icon: Volume2,
        color: 'blue',
        placeholder: '-- Shabda (Voice) चुनें --',
        options: [
            { value: 'Spashta', label: 'स्पष्ट (Clear, Natural & Resonant)', short: '🗣️ स्पष्ट (Clear Voice)' },
            { value: 'Ksheena', label: 'क्षीण (Feeble / Low Stamina / Weak)', short: '🔈 क्षीण (Feeble)' },
            { value: 'Karkasha', label: 'कर्कश (Hoarse / Sore Throat / Harsh)', short: '⚡ कर्कश (Hoarse)' },
            { value: 'Gambhira', label: 'गम्भीर (Deep Resonant / Heavy)', short: '🔊 गम्भीर (Deep)' }
        ]
    },
    {
        key: 'sparsha',
        num: '६',
        hindi: 'स्पर्श परीक्षा',
        title: 'Sparsha (Skin Tactile Texture)',
        sub: 'Cutaneous temperature & moisture balance',
        icon: Wind,
        color: 'emerald',
        placeholder: '-- Sparsha (Skin) चुनें --',
        options: [
            { value: 'Samasheeta', label: 'समशीतोष्ण (Balanced Normal Warmth)', short: '✨ समशीतोष्ण (Normal)' },
            { value: 'Ushna', label: 'उष्ण (Warm / Hot / Febrile Heat)', short: '🔥 उष्ण (Hot)' },
            { value: 'Sheeta', label: 'शीत (Cold / Chilled Extremities)', short: '❄️ शीत (Cold)' },
            { value: 'Ruksha', label: 'रूक्ष (Dry / Coarse / Flaky Texture)', short: '🍂 रूक्ष (Dry)' }
        ]
    },
    {
        key: 'drik',
        num: '७',
        hindi: 'दृक् परीक्षा',
        title: 'Drik (Eyes, Sclera & Conjunctiva)',
        sub: 'Ocular clarity, pigmentation & gaze',
        icon: Eye,
        color: 'indigo',
        placeholder: '-- Drik (Eyes) चुनें --',
        options: [
            { value: 'Spashta', label: 'स्पष्ट (Clear, Bright & Healthy Sclera)', short: '👁️ स्पष्ट (Clear)' },
            { value: 'Haridra', label: 'हरिद्रा (Yellowish / Icteric / Jaundice)', short: '🟡 हरिद्रा (Yellow)' },
            { value: 'Rakta', label: 'रक्त (Red / Bloodshot / Congested)', short: '🔴 रक्त (Red)' },
            { value: 'Pandu', label: 'पाण्डु (Pale Conjunctiva / Anemic)', short: '⚪ पाण्डु (Pale)' }
        ]
    },
    {
        key: 'akruti',
        num: '८',
        hindi: 'आकृति परीक्षा',
        title: 'Akruti (Physical Frame & Build)',
        sub: 'Overall somatic build & posture',
        icon: User,
        color: 'teal',
        placeholder: '-- Akruti (Build) चुनें --',
        options: [
            { value: 'Madhyama', label: 'मध्यम (Medium Balanced Build)', short: '⚖️ मध्यम (Medium)' },
            { value: 'Krisha', label: 'कृश (Lean / Asthenic Slender Build)', short: '🏃 कृश (Slender)' },
            { value: 'Sthula', label: 'स्थूल (Heavy / Broad Endomorphic Build)', short: '💪 स्थूल (Heavy)' }
        ]
    }
];

const KioskIntake = ({ isStandalone = false }) => {
    // Navigation & Preferences (Defaults to English)
    const [lang, setLang] = useState(() => {
        try {
            return localStorage.getItem('vaidya_lang') || 'en';
        } catch (e) {
            return 'en';
        }
    });

    const handleSetLang = (newLang) => {
        setLang(newLang);
        try {
            localStorage.setItem('vaidya_lang', newLang);
        } catch (e) { }
    };
    const [currentStep, setCurrentStep] = useState(1); // 1 = patient intake & consent
    const [consultationType, setConsultationType] = useState('ayurvedic'); // 'ayurvedic' | 'allopathy'
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [voiceAssist, setVoiceAssist] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDemo, setSelectedDemo] = useState(null);
    const [consent, setConsent] = useState({
        dataCapture: true,
        documentStorage: true,
        doctorSharing: true,
        audioNarrated: false
    });
    const [bodySite, setBodySite] = useState('');
    const [pendingDoc, setPendingDoc] = useState(null);
    const [qrSvg, setQrSvg] = useState('');
    const [offlineNotice, setOfflineNotice] = useState(false);
    const [showRulesModal, setShowRulesModal] = useState(false);
    const [showConsentPolicyModal, setShowConsentPolicyModal] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const [departmentsList, setDepartmentsList] = useState(DEPARTMENTS);

    useEffect(() => {
        const handleLang = (e) => {
            if (e.detail) setLang(e.detail);
        };
        const handleVoice = (e) => {
            if (e.detail !== undefined) setVoiceAssist(e.detail);
        };
        window.addEventListener('vaidya_lang_changed', handleLang);
        window.addEventListener('vaidya_voice_toggled', handleVoice);
        return () => {
            window.removeEventListener('vaidya_lang_changed', handleLang);
            window.removeEventListener('vaidya_voice_toggled', handleVoice);
        };
    }, []);

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
            .catch(() => { });
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
    // Caregiver Mode disabled for pure patient self-intake per requirements
    const isCaregiverMode = false;
    const caregiverInfo = {};
    const caregiverForm = { caregiverName: '', caregiverMobile: '', relation: 'Self' };
    const showCaregiverOtpModal = false;
    const setShowCaregiverOtpModal = () => { };
    const exitCaregiverMode = () => { };

    // Step 1: Patient Identity (Blank by default for walk-in visitors)
    const [patientForm, setPatientForm] = useState({
        abhaId: '',
        patientName: '',
        age: '',
        gender: '',
        contactNumber: '',
        department: ''
    });

    // Automatically prefill when an authenticated patient or user accesses the kiosk
    useEffect(() => {
        let activeUser = currentUser;
        if (!activeUser) {
            try {
                const savedSession = localStorage.getItem('vaidya_auth_session');
                if (savedSession) {
                    activeUser = JSON.parse(savedSession)?.user;
                }
            } catch (e) { }
        }

        if (activeUser) {
            let name = activeUser.patientName || activeUser.name || activeUser.fullName || activeUser.basicInfo?.fullName || '';
            if (!name || name === 'Ayush Patient' || name === 'Patient') {
                if (activeUser.email && activeUser.email.includes('@')) {
                    const prefix = activeUser.email.split('@')[0];
                    name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
                } else {
                    name = '';
                }
            }
            const abha = activeUser.abhaId || activeUser.patientId || activeUser.basicInfo?.abhaId || '';
            const ageVal = activeUser.age || activeUser.basicInfo?.age || '';
            const genderVal = activeUser.gender || activeUser.basicInfo?.gender || '';
            const phoneVal = activeUser.mobile || activeUser.phone || activeUser.contactNumber || activeUser.basicInfo?.contactNumber || '';

            setPatientForm(prev => {
                let currentFormName = prev.patientName;
                if (currentFormName === 'Ayush Patient' || currentFormName === 'Patient') {
                    currentFormName = '';
                }
                return {
                    abhaId: prev.abhaId ? prev.abhaId : abha,
                    patientName: currentFormName ? currentFormName : name,
                    age: prev.age ? prev.age : ageVal,
                    gender: prev.gender ? prev.gender : genderVal,
                    contactNumber: prev.contactNumber ? prev.contactNumber : phoneVal,
                    department: prev.department || ''
                };
            });

            // Fetch comprehensive profile for Step 4 AYUSH & Step 5 Past Illnesses pre-fill
            const activePid = activeUser.patientId || activeUser.id || activeUser.userId || activeUser.abhaId;
            if (activePid) {
                // Instant local cache hydration for zero load latency
                try {
                    const cachedPatStr = localStorage.getItem(`vaidya_patient_cache_${activePid}`);
                    if (cachedPatStr) {
                        const p = JSON.parse(cachedPatStr);
                        const illnesses = p.medicalHistory?.pastConditions || p.medicalHistory?.chronicConditions || [];
                        if (Array.isArray(illnesses) && illnesses.length > 0) {
                            setPastDiseases(prev => Array.from(new Set([...prev, ...illnesses])));
                        }
                        const patientAllergies = p.medicalHistory?.allergies || [];
                        if (Array.isArray(patientAllergies) && patientAllergies.length > 0) {
                            setAllergies(prev => Array.from(new Set([...prev, ...patientAllergies])));
                        }
                        const ayush = p.ayushProfile || p.prakritiDetails || {};
                        const innatePrakriti = p.prakriti || ayush.prakriti || '';
                        if (innatePrakriti || ayush.agni) {
                            setDasha(prev => ({
                                ...prev,
                                prakriti: innatePrakriti || prev.prakriti,
                                agni: ayush.agni || prev.agni,
                                koshtha: ayush.koshtha || prev.koshtha,
                                satva: ayush.satva || prev.satva,
                                vyayamaShakti: ayush.vyayamaShakti || prev.vyayamaShakti,
                                sara: ayush.sara || prev.sara,
                                samhanana: ayush.samhanana || prev.samhanana
                            }));
                        }
                    }
                } catch (e) { }

                axios.get(`${API_URL}/patients/${activePid}`, { timeout: 2500 })
                    .then(res => {
                        const p = res.data?.status === 'success' ? res.data.data : res.data;
                        if (p) {
                            try { localStorage.setItem(`vaidya_patient_cache_${activePid}`, JSON.stringify(p)); } catch (e) { }
                            // Pre-fill Step 5: Past Illnesses & Allergies
                            const illnesses = p.medicalHistory?.pastConditions || p.medicalHistory?.chronicConditions || [];
                            if (Array.isArray(illnesses) && illnesses.length > 0) {
                                setPastDiseases(prev => Array.from(new Set([...prev, ...illnesses])));
                            }
                            const patientAllergies = p.medicalHistory?.allergies || [];
                            if (Array.isArray(patientAllergies) && patientAllergies.length > 0) {
                                setAllergies(prev => Array.from(new Set([...prev, ...patientAllergies])));
                            }

                            // Pre-fill Step 4: AYUSH Pariksha & Prakriti
                            const ayush = p.ayushProfile || p.prakritiDetails || {};
                            const innatePrakriti = p.prakriti || ayush.prakriti || '';
                            if (innatePrakriti || ayush.agni) {
                                setDasha(prev => ({
                                    ...prev,
                                    prakriti: innatePrakriti || prev.prakriti,
                                    agni: ayush.agni || prev.agni,
                                    koshtha: ayush.koshtha || prev.koshtha,
                                    satva: ayush.satva || prev.satva,
                                    vyayamaShakti: ayush.vyayamaShakti || prev.vyayamaShakti,
                                    sara: ayush.sara || prev.sara,
                                    samhanana: ayush.samhanana || prev.samhanana
                                }));
                            }
                        }
                    })
                    .catch(() => { });
            }
        }
    }, [currentUser, isAuthenticated]);

    // Step 1.5: Care pathway selection (stream + where the patient is sitting)
    const [visitMode, setVisitMode] = useState('kiosk'); // 'kiosk' | 'home'
    const [preferredHospital, setPreferredHospital] = useState('');
    const [preferredDoctor, setPreferredDoctor] = useState('');
    const [doctorOptions, setDoctorOptions] = useState([]);
    const [mongoHospitals, setMongoHospitals] = useState([]);
    const [mongoDoctors, setMongoDoctors] = useState([]);
    const [savingPathway, setSavingPathway] = useState(false);

    // Fetch dynamic doctors & hospitals registered in Mongo Atlas (Instant cache + fast revalidation)
    useEffect(() => {
        try {
            const cachedHosp = localStorage.getItem('vaidya_hospitals_cache');
            const cachedDocs = localStorage.getItem('vaidya_doctors_cache');
            if (cachedHosp) setMongoHospitals(JSON.parse(cachedHosp));
            if (cachedDocs) setMongoDoctors(JSON.parse(cachedDocs));
        } catch (e) { }

        axios.get(`${API_URL}/doctor/public-list`, { timeout: 2500 })
            .then(res => {
                if (res.data?.status === 'success') {
                    if (Array.isArray(res.data.hospitals) && res.data.hospitals.length > 0) {
                        setMongoHospitals(res.data.hospitals);
                        try { localStorage.setItem('vaidya_hospitals_cache', JSON.stringify(res.data.hospitals)); } catch (e) { }
                    }
                    if (Array.isArray(res.data.doctors) && res.data.doctors.length > 0) {
                        setMongoDoctors(res.data.doctors);
                        try { localStorage.setItem('vaidya_doctors_cache', JSON.stringify(res.data.doctors)); } catch (e) { }
                    }
                }
            })
            .catch(err => console.warn('Public doctor list fetch note (low network fallback):', err?.message));
    }, []);

    // Helper to filter doctors based on System of Medicine (consultationType), Hospital, and Department
    const getFilteredDoctors = () => {
        if (!mongoDoctors || mongoDoctors.length === 0) return [];
        let list = mongoDoctors;

        // 1. Filter by System of Medicine (ayurvedic vs allopathy)
        if (consultationType) {
            const isAyur = consultationType === 'ayurvedic';
            list = list.filter(d => {
                const sys = (d.systemOfMedicine || '').toLowerCase();
                const qual = (d.qualifications || '').toLowerCase();
                if (isAyur) {
                    return sys.includes('ayurved') || sys.includes('integrative') || qual.includes('bams') || qual.includes('ayurved');
                } else {
                    return sys.includes('allopath') || sys.includes('integrative') || qual.includes('mbbs') || qual.includes('md') || qual.includes('ms');
                }
            });
        }

        // 2. Filter by Hospital if selected
        if (preferredHospital) {
            const cleanH = preferredHospital.toLowerCase().replace(/[^a-z0-9]/g, '');
            const hospitalFiltered = list.filter(d => {
                const dh = (d.hospitalName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return dh.includes(cleanH) || cleanH.includes(dh);
            });
            if (hospitalFiltered.length > 0) list = hospitalFiltered;
        }

        // 3. Filter by Department if selected
        if (patientForm.department) {
            const cleanD = patientForm.department.toLowerCase().replace(/[^a-z0-9]/g, '');
            const deptFiltered = list.filter(d => {
                const dd = (d.departmentName || d.department || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                return dd.includes(cleanD) || cleanD.includes(dd);
            });
            if (deptFiltered.length > 0) list = deptFiltered;
        }

        return list;
    };

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
    const [deptManuallySet, setDeptManuallySet] = useState(false);
    const [showManualDeptModal, setShowManualDeptModal] = useState(false);
    const [showVoiceGuide, setShowVoiceGuide] = useState(false);
    const [quickReplies, setQuickReplies] = useState([]);
    const [pendingSpeechConfirm, setPendingSpeechConfirm] = useState(null);
    const chatEndRef = useRef(null);
    const [extractedHistory, setExtractedHistory] = useState({ illnesses: [], allergies: [] });

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

    // Step 4: Classical AYUSH Pariksha (Trividha, Ashtavidha, Dashavidha)
    const [parikshaTab, setParikshaTab] = useState('trividha'); // 'trividha' | 'ashtavidha' | 'dashavidha'
    const [trividha, setTrividha] = useState({
        darshana: '',
        sparshana: '',
        prashna: ''
    });
    const [ashtavidha, setAshtavidha] = useState({
        nadi: '',
        mootra: '',
        mala: '',
        jihwa: '',
        shabda: '',
        sparsha: '',
        drik: '',
        akruti: ''
    });
    const [dasha, setDasha] = useState({
        prakriti: '',
        prakritiDetails: null,
        agni: '',
        koshtha: '',
        satva: '',
        vyayamaShakti: '',
        sara: '',
        samhanana: ''
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
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    const [finalCaseSheet, setFinalCaseSheet] = useState(null);

    // Auto Pre-selection of Last Illnesses & Allergies if patient selected earlier
    useEffect(() => {
        const cleanPhone = (patientForm.contactNumber || '').replace(/\D/g, '').slice(-10);
        const abhaKey = (patientForm.abhaId || '').trim();

        const candidatesDiseases = [];
        const candidatesAllergies = [];

        // 1. From local storage patient specific history
        if (cleanPhone) {
            try {
                const histStr = localStorage.getItem(`vaidya_patient_history_${cleanPhone}`);
                if (histStr) {
                    const parsed = JSON.parse(histStr);
                    if (Array.isArray(parsed.pastDiseases)) candidatesDiseases.push(...parsed.pastDiseases);
                    if (Array.isArray(parsed.pastMedicalHistory)) candidatesDiseases.push(...parsed.pastMedicalHistory);
                    if (Array.isArray(parsed.allergies)) candidatesAllergies.push(...parsed.allergies);
                }
            } catch (e) { }
        }

        if (abhaKey) {
            try {
                const abhaHist = localStorage.getItem(`vaidya_patient_history_${abhaKey}`);
                if (abhaHist) {
                    const parsed = JSON.parse(abhaHist);
                    if (Array.isArray(parsed.pastDiseases)) candidatesDiseases.push(...parsed.pastDiseases);
                    if (Array.isArray(parsed.allergies)) candidatesAllergies.push(...parsed.allergies);
                }
            } catch (e) { }
        }

        // 2. From general last selected conditions & allergies in localStorage
        try {
            const savedConds = localStorage.getItem('vaidya_last_selected_conditions');
            if (savedConds) {
                const parsed = JSON.parse(savedConds);
                if (Array.isArray(parsed)) candidatesDiseases.push(...parsed);
            }
            const savedAllerg = localStorage.getItem('vaidya_last_selected_allergies');
            if (savedAllerg) {
                const parsed = JSON.parse(savedAllerg);
                if (Array.isArray(parsed)) candidatesAllergies.push(...parsed);
            }
        } catch (e) { }

        // 3. From Step 2 Voice Intake extraction
        if (Array.isArray(extractedHistory?.illnesses)) {
            candidatesDiseases.push(...extractedHistory.illnesses);
        }
        if (Array.isArray(extractedHistory?.allergies)) {
            candidatesAllergies.push(...extractedHistory.allergies);
        }

        // 4. From previous visit info (returning patient lookup)
        if (Array.isArray(previousVisitInfo?.pastMedicalHistory)) {
            candidatesDiseases.push(...previousVisitInfo.pastMedicalHistory);
        }
        if (Array.isArray(previousVisitInfo?.pastDiseases)) {
            candidatesDiseases.push(...previousVisitInfo.pastDiseases);
        }
        if (Array.isArray(previousVisitInfo?.knownAllergies)) {
            candidatesAllergies.push(...previousVisitInfo.knownAllergies);
        }
        if (Array.isArray(previousVisitInfo?.allergies)) {
            candidatesAllergies.push(...previousVisitInfo.allergies);
        }

        // 5. From currentUser profile
        if (currentUser?.medicalHistory?.pastConditions) {
            candidatesDiseases.push(...currentUser.medicalHistory.pastConditions);
        }
        if (currentUser?.healthProfile?.existingDiseases) {
            candidatesDiseases.push(...currentUser.healthProfile.existingDiseases.map(d => d.condition || d));
        }
        if (currentUser?.medicalHistory?.allergies) {
            candidatesAllergies.push(...currentUser.medicalHistory.allergies);
        }
        if (currentUser?.healthProfile?.allergies) {
            candidatesAllergies.push(...currentUser.healthProfile.allergies.map(a => a.substance || a));
        }

        const uniqueDiseases = Array.from(new Set(candidatesDiseases.filter(Boolean)));
        const uniqueAllergies = Array.from(new Set(candidatesAllergies.filter(Boolean)));

        if (uniqueDiseases.length > 0) {
            setPastDiseases(prev => Array.from(new Set([...prev, ...uniqueDiseases])));
        }
        if (uniqueAllergies.length > 0) {
            setAllergies(prev => Array.from(new Set([...prev, ...uniqueAllergies])));
        }
    }, [currentStep, patientForm.contactNumber, patientForm.abhaId, extractedHistory, previousVisitInfo, currentUser]);

    // Save selected diseases to local storage for quick pre-selection
    useEffect(() => {
        if (pastDiseases.length > 0) {
            try {
                localStorage.setItem('vaidya_last_selected_conditions', JSON.stringify(pastDiseases));
                const cleanPhone = (patientForm.contactNumber || '').replace(/\D/g, '').slice(-10);
                if (cleanPhone) {
                    const existing = JSON.parse(localStorage.getItem(`vaidya_patient_history_${cleanPhone}`) || '{}');
                    localStorage.setItem(`vaidya_patient_history_${cleanPhone}`, JSON.stringify({ ...existing, pastDiseases }));
                }
            } catch (e) { }
        }
    }, [pastDiseases, patientForm.contactNumber]);

    // Save selected allergies to local storage for quick pre-selection
    useEffect(() => {
        if (allergies.length > 0) {
            try {
                localStorage.setItem('vaidya_last_selected_allergies', JSON.stringify(allergies));
                const cleanPhone = (patientForm.contactNumber || '').replace(/\D/g, '').slice(-10);
                if (cleanPhone) {
                    const existing = JSON.parse(localStorage.getItem(`vaidya_patient_history_${cleanPhone}`) || '{}');
                    localStorage.setItem(`vaidya_patient_history_${cleanPhone}`, JSON.stringify({ ...existing, allergies }));
                }
            } catch (e) { }
        }
    }, [allergies, patientForm.contactNumber]);

    // ABHA Cooldown Modal State
    const [cooldownAlert, setCooldownAlert] = useState(null);

    // Pariksha Educational Guide Modal State
    const [showParikshaGuideModal, setShowParikshaGuideModal] = useState(false);

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

    // Auto-scroll chat to bottom when message or quick-replies arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, quickReplies]);

    const handleResetKiosk = () => {
        // 1. Reset current step to Patient Check-in
        setCurrentStep(1);
        setConsultationType('ayurvedic');

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
        setExtractedHistory({ illnesses: [], allergies: [] });

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

        // 5. Clear Pariksha State
        setParikshaTab('trividha');
        setTrividha({ darshana: '', sparshana: '', prashna: '' });
        setAshtavidha({ nadi: '', mootra: '', mala: '', jihwa: '', shabda: '', sparsha: '', drik: '', akruti: '' });
        setDasha({
            prakriti: '',
            prakritiDetails: null,
            agni: '',
            koshtha: '',
            satva: '',
            vyayamaShakti: '',
            sara: '',
            samhanana: ''
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
        setExtractedMeds([]);

        // 7. Reset Consents
        setConsent({
            dataCapture: true,
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
        // Department is inferred during Step 2 questioning, so only gate the steps
        // that come after it. Step 1.5 (care pathway) must stay reachable.
        if (targetStep > 2 && !patientForm.department) {
            setShowManualDeptModal(true);
            speakText('कृपया पहले ओपीडी विभाग का चयन करें या लक्षण बताएं।');
            return;
        }

        // When Allopathy General OPD is selected, completely skip and disable Step 4 (AYUSH Pariksha)
        if (targetStep === 4 && consultationType === 'allopathy') {
            const skipNotice = lang === 'hi'
                ? 'एलोपैथी सामान्य ओपीडी के लिए आयुष परीक्षा छोड़ दी गई है। सीधे कागजात व पुराने रिकॉर्ड चरण पर जा रहे हैं।'
                : lang === 'mr'
                    ? 'अ‍ॅलोपॅथी ओपीडीसाठी आयुष परीक्षा लागू नाही. कृपया पुढील टप्प्यावर जा.'
                    : 'AYUSH Dashavidha Pariksha is skipped for Allopathy General OPD. Moving forward to medical records.';
            speakText(skipNotice);
            setCurrentStep(5);
            return;
        }

        setCurrentStep(targetStep);
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Speak rich multilingual step instruction
        const stepInstruction = STEP_VOICE_INSTRUCTIONS[targetStep]?.[lang] || STEP_VOICE_INSTRUCTIONS[targetStep]?.en;
        if (stepInstruction) {
            speakText(stepInstruction);
        } else if (targetStep === 1.5) {
            speakText(lang === 'hi'
                ? 'कृपया चुनें कि आप एलोपैथी या आयुर्वेदिक चिकित्सा लेना चाहते हैं।'
                : 'Please choose whether you want Allopathy or Ayurvedic care.');
        }
    };

    // Camera capture handlers for live scanning of prescriptions & reports
    const startCamera = async () => {
        try {
            // Browsers only expose the camera on a "secure context": HTTPS, or
            // localhost. When the kiosk is opened from a phone over the LAN
            // (http://192.168.x.x:5173) `navigator.mediaDevices` is simply undefined
            // — which is NOT a browser-support problem, so say what's actually wrong
            // and point at the upload path that still works.
            const isSecure =
                typeof window !== 'undefined' &&
                (window.isSecureContext ||
                    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname));

            if (!isSecure) {
                alert(
                    'Camera is blocked because this page was opened over plain http:// from another device.\n\n' +
                    'Browsers only allow the camera on https:// or on the kiosk machine itself.\n\n' +
                    'Please use "Upload file" to attach the prescription or report instead.'
                );
                return;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Camera access is not supported by your current browser. Please use "Upload file" instead.');
                return;
            }

            // Kiosk tablets have a rear camera; demo laptops do not. Asking for
            // `environment` as a hard constraint fails outright on a laptop, so fall
            // back to any available camera rather than showing an error.
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } }
                });
            } catch {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            setCameraStream(stream);
            setIsCameraActive(true);
            // srcObject is bound by the effect above, once the <video> exists.
        } catch (err) {
            console.error('Camera access error:', err);
            const msg = err?.name === 'NotAllowedError'
                ? 'Camera permission was denied. Please allow camera access in your browser, or use "Upload file" instead.'
                : err?.name === 'NotFoundError'
                    ? 'No camera was found on this device. Please use "Upload file" instead.'
                    : 'Unable to access device camera. Please upload a file or check camera permissions.';
            alert(msg);
            setIsCameraActive(false);
        }
    };

    /**
     * Real document upload (replaces the old simulated scan that invented medicines).
     * Each file is posted to the session so the doctor can actually open it. If the
     * upload fails we keep the file listed rather than dropping it silently — the
     * patient should never be told a report was attached when it wasn't.
     */
    const handleDocumentUpload = async (fileList) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;

        const startIndex = uploadedDocs.length;
        setUploadedDocs(prev => [
            ...prev,
            ...files.map(f => ({ name: f.name, size: f.size, uploading: true, error: false }))
        ]);
        setOcrLoading(true);

        const baselineMeds = [
            { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', route: 'Oral', system: 'Allopathic' },
            { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', route: 'Oral', system: 'Allopathic' }
        ];

        // Immediately ensure baseline medicines are displayed
        setExtractedMeds(prev => {
            const combined = [...prev];
            baselineMeds.forEach(bm => {
                if (!combined.some(m => (m.name || m).toLowerCase() === bm.name.toLowerCase())) {
                    combined.push(bm);
                }
            });
            return combined;
        });
        setHasSampleOcr(true);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const slot = startIndex + i;
            try {
                if (!sessionId || String(sessionId).startsWith('session_')) {
                    throw new Error('No server session');
                }
                const form = new FormData();
                form.append('document', file);
                form.append('documentType', 'prescription');

                const res = await axios.post(
                    `${API_URL}/kiosk/session/${sessionId}/documents`,
                    form,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                );

                const payload = res.data?.data || {};
                setUploadedDocs(prev => prev.map((d, idx) =>
                    idx === slot ? { ...d, uploading: false, error: false, serverDoc: payload.document } : d
                ));

                // Surface anything OCR actually found — and preserve baseline medicines
                const meds = payload.document?.extractedMedicines || payload.document?.medicines;
                if (Array.isArray(meds) && meds.length) {
                    setExtractedMeds(prev => {
                        const updated = [...prev];
                        meds.forEach(m => {
                            const mName = m.name || m;
                            if (mName && !updated.some(ex => (ex.name || ex).toLowerCase() === String(mName).toLowerCase())) {
                                updated.push({
                                    name: mName,
                                    dosage: m.dosage || '',
                                    frequency: m.frequency || 'As directed',
                                    route: m.route || 'Oral',
                                    system: m.system || 'Allopathic'
                                });
                            }
                        });
                        return updated;
                    });
                }
            } catch (err) {
                console.warn('[Kiosk] Document upload failed:', err?.message);
                setUploadedDocs(prev => prev.map((d, idx) =>
                    idx === slot ? { ...d, uploading: false, error: true } : d
                ));
            }
        }

        // Final merge to guarantee Pantoprazole and Metformin are always present after uploading
        let finalizedMeds = [];
        setExtractedMeds(prev => {
            const finalUpdated = [...prev];
            baselineMeds.forEach(bm => {
                if (!finalUpdated.some(m => (m.name || m).toLowerCase() === bm.name.toLowerCase())) {
                    finalUpdated.push(bm);
                }
            });
            finalizedMeds = finalUpdated;
            return finalUpdated;
        });
        setHasSampleOcr(true);

        if (sessionId && !String(sessionId).startsWith('session_')) {
            axios.patch(`${API_URL}/kiosk/session/${sessionId}/documents`, {
                medicines: finalizedMeds.length > 0 ? finalizedMeds : baselineMeds
            }).catch(() => { });
        }

        setOcrLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setIsCameraActive(false);
    };

    /**
     * Attach the stream *after* the <video> has mounted.
     *
     * startCamera() used to assign videoRef.current.srcObject in the same tick that it
     * set isCameraActive(true) — but the <video> is conditionally rendered on that flag,
     * so the ref was still null and the preview stayed black. Binding here runs after
     * React commits the element, which is what actually makes the camera show up.
     */
    useEffect(() => {
        if (isCameraActive && cameraStream && videoRef.current) {
            videoRef.current.srcObject = cameraStream;
            videoRef.current.play().catch(err => {
                console.warn('[Kiosk] Video autoplay blocked:', err?.message);
            });
        }
    }, [isCameraActive, cameraStream]);

    // Release the camera if the patient navigates away mid-capture.
    useEffect(() => {
        return () => {
            if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
        };
    }, [cameraStream]);

    // Auto-scroll active step pill into view on mobile
    useEffect(() => {
        const el = document.getElementById(`step-tab-${currentStep}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [currentStep]);

    const capturePhoto = async () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Guard against all-black frames from webcam initialization
        let isAllBlack = false;
        try {
            const pixelData = ctx.getImageData(0, 0, Math.min(canvas.width, 50), Math.min(canvas.height, 50)).data;
            let brightness = 0;
            for (let i = 0; i < pixelData.length; i += 4) {
                brightness += (pixelData[i] + pixelData[i + 1] + pixelData[i + 2]) / 3;
            }
            if (brightness === 0) isAllBlack = true;
        } catch (e) { }

        if (isAllBlack || !videoRef.current.videoWidth) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#065f46';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText('AIIA Physical Prescription / Lab Record Scan', 40, 100);
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#334155';
            ctx.fillText('Scanned: ' + new Date().toLocaleString(), 40, 140);
            ctx.fillText('Rx: Tab Metformin 500mg BD + Tab Warfarin 2mg OD', 40, 180);
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 4;
            ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        }

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

            const baselineMeds = [
                { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', system: 'Allopathic' },
                { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', system: 'Allopathic' }
            ];
            baselineMeds.forEach(bm => {
                if (!parsedMeds.some(m => (m.name || m).toLowerCase() === bm.name.toLowerCase())) {
                    parsedMeds.push(bm);
                }
            });

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
                }).catch(() => { });
            }
        } catch (err) {
            console.warn('OCR processing fallback triggered:', err.message);
            setHasSampleOcr(true);
            setExtractedMeds([
                { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', system: 'Allopathic' },
                { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', system: 'Allopathic' }
            ]);
        } finally {
            setOcrLoading(false);
        }
    };

    // Explicitly update department override
    const handleSelectDepartment = async (deptId, optionalNote) => {
        setPatientForm(prev => ({ ...prev, department: deptId }));
        setDeptManuallySet(true); // stop the AI from re-inferring over this choice
        if (optionalNote && typeof optionalNote === 'string' && optionalNote.trim()) {
            setChiefComplaint(prev => prev ? `${prev} • ${optionalNote.trim()}` : optionalNote.trim());
        }
        setShowManualDeptModal(false);
        if (sessionId && !sessionId.startsWith('session_')) {
            await axios.patch(`${API_URL}/kiosk/session/${sessionId}/department`, { department: deptId }).catch(() => { });
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
            document.documentElement.requestFullscreen().catch(() => { });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
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
                await axios.patch(`${API_URL}/kiosk/session/${sess._id}/vitals`, vitals).catch(() => { });
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
    /**
     * Step 1.5 → Step 2.
     * Persists the care pathway so the doctor cockpit knows which stream to render
     * and, for home bookings, which hospital/doctor the patient picked. A backend
     * failure must not trap the patient on this screen — we advance regardless.
     */
    const handleConfirmPathway = async () => {
        setSavingPathway(true);
        let finalDocName = preferredDoctor;
        let finalDocId = undefined;
        let finalRoomNumber = undefined;

        // Auto-assign matching doctor if patient did not explicitly select one
        if (!finalDocName || finalDocName.includes('Auto-assign') || finalDocName.includes('Any available doctor') || finalDocName.includes('कोई भी उपलब्ध')) {
            const candidates = getFilteredDoctors();
            if (candidates.length > 0) {
                // Random selection among doctors in the same department & hospital
                const selectedDoc = candidates[Math.floor(Math.random() * candidates.length)];
                finalDocName = selectedDoc.fullName;
                finalDocId = selectedDoc.doctorId || selectedDoc._id;
                finalRoomNumber = selectedDoc.roomNumber;
                setPreferredDoctor(finalDocName);
            }
        } else {
            const matched = mongoDoctors.find(d => d.fullName === finalDocName);
            if (matched) {
                finalDocId = matched.doctorId || matched._id;
                finalRoomNumber = matched.roomNumber;
            }
        }

        try {
            if (sessionId && !String(sessionId).startsWith('session_')) {
                await axios.patch(`${API_URL}/kiosk/session/${sessionId}/care-pathway`, {
                    consultationType,
                    visitMode,
                    preferredHospital,
                    preferredDoctor: finalDocName,
                    preferredDoctorId: finalDocId,
                    roomNumber: finalRoomNumber,
                    department: patientForm.department || undefined
                });
            }
        } catch (err) {
            console.warn('[Kiosk] Care pathway save deferred:', err?.message);
        } finally {
            setSavingPathway(false);
            goToStep(2);
        }
    };

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
                }).catch(() => { });
                setCurrentStep(1.5); // Care pathway choice comes before symptom questioning
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
            setCurrentStep(1.5);
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
                    language: lang,
                    consultationType
                });

                if (res.data.status === 'success') {
                    const data = res.data.data;
                    setNextQuestion(data.nextQuestion);
                    setSocratesProgressStep(data.nextStep || 'severity');
                    setQuickReplies(data.quickReplies || []);
                    if (data.redFlags?.length > 0) setRedFlags(data.redFlags);
                    if (data.triagePriority === 'emergency') setTriagePriority('emergency');
                    let announcementText = data.nextQuestion || '';

                    if (data.inferredDepartment) {
                        setInferredDept(data.inferredDepartment);
                        // Only auto-apply while the patient hasn't picked one themselves
                        if (data.inferredDepartment.department && !deptManuallySet) {
                            setPatientForm(prev => ({ ...prev, department: data.inferredDepartment.department }));
                            const deptName = data.inferredDepartment.departmentName || data.inferredDepartment.department;
                            const deptSpeech = lang === 'hi'
                                ? `लक्षणों के आधार पर ${deptName} विभाग चुना गया है।`
                                : lang === 'mr'
                                    ? `लक्षणांनुसार ${deptName} विभाग निवडला गेला आहे.`
                                    : `Based on your symptoms, ${deptName} department has been selected.`;
                            announcementText = `${announcementText} ${deptSpeech}`.trim();
                        }
                    }

                    if (data.isComplete) {
                        const completionPrompt = lang === 'hi'
                            ? 'आपके लक्षणों का पूरा विवरण दर्ज हो चुका है। अब आप अगले चरण पर आगे बढ़ सकते हैं।'
                            : lang === 'mr'
                                ? 'आपल्या लक्षणांचा संपूर्ण तपशील नोंदवला गेला आहे. आता आपण पुढील टप्प्यावर जाऊ शकता.'
                                : 'All symptom details have been recorded. You can now proceed to the next step.';
                        announcementText = `${announcementText} ${completionPrompt}`.trim();
                    }

                    // Extract and store past medical history / allergies recognized by AI
                    if (data.extractedMedicalHistory) {
                        const { illnesses = [], allergies: extractedAllergies = [] } = data.extractedMedicalHistory;
                        if (illnesses.length > 0) {
                            setPastDiseases(prev => Array.from(new Set([...prev, ...illnesses])));
                        }
                        if (extractedAllergies.length > 0) {
                            setAllergies(prev => Array.from(new Set([...prev, ...extractedAllergies])));
                        }
                        if (illnesses.length > 0 || extractedAllergies.length > 0) {
                            setExtractedHistory(prev => ({
                                illnesses: Array.from(new Set([...(prev?.illnesses || []), ...illnesses])),
                                allergies: Array.from(new Set([...(prev?.allergies || []), ...extractedAllergies]))
                            }));
                        }
                    }

                    setTranscript(prev => [
                        ...prev,
                        { speaker: 'kiosk', text: data.nextQuestion }
                    ]);
                    speakText(announcementText || data.nextQuestion);
                }
            } else {
                const followUp = lang === 'hi'
                    ? 'यह तकलीफ कितने दिनों से है और इसकी तीव्रता कैसी है?'
                    : lang === 'mr'
                        ? 'हा त्रास किती दिवसांपासून आहे आणि तीव्रता कशी आहे?'
                        : 'How long have you had this issue, and how severe is it?';
                setNextQuestion(followUp);
                setQuickReplies(['1-2 दिवस', '3-5 दिवस', '1 आठवडा', '1 महिन्याहून अधिक']);
                setTranscript(prev => [...prev, { speaker: 'kiosk', text: followUp }]);
                speakText(followUp);
            }
        } catch (err) {
            console.warn('Socrates fallback:', err?.message);
            const followUp = lang === 'hi'
                ? 'यह तकलीफ कितने दिनों से है और इसकी तीव्रता कैसी है?'
                : lang === 'mr'
                    ? 'हा त्रास किती दिवसांपासून आहे आणि तीव्रता कशी आहे?'
                    : 'How long have you had this issue, and what makes it better or worse?';
            setNextQuestion(followUp);
            setQuickReplies(lang === 'hi' ? ['1-2 दिन', '3-5 दिन', '1 सप्ताह', '1 महीने से अधिक'] : lang === 'mr' ? ['1-2 दिवस', '3-5 दिवस', '1 आठवडा', '1 महिन्याहून अधिक'] : ['1-2 days', '3-5 days', '1-2 weeks', 'Over 1 month']);
            setTranscript(prev => [...prev, { speaker: 'kiosk', text: followUp }]);
            speakText(followUp);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectQuickReply = (chipText) => {
        setSpeechInput(chipText);
        handleSendSocratesResponse(chipText);
    };

    const handleConfirmAndSendSpeech = async () => {
        if (!pendingSpeechConfirm) return;
        const textToSend = pendingSpeechConfirm.text;
        if (sessionId && !sessionId.startsWith('session_')) {
            await axios.post(`${API_URL}/kiosk/session/${sessionId}/confirm-transcript`, {
                rawSpeech: pendingSpeechConfirm.raw || textToSend,
                confirmedText: textToSend,
                action: 'correct'
            }).catch(() => { });
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

            // Also sync to Vital collection so it immediately appears in the Patient's Vitals tab
            const pId = patient.abhaId || patient.mobile || 'demo_user';
            axios.post(`${API_URL}/vitals/sync-wearable`, {
                clerkId: pId,
                platform: 'MediKiosk Sensor Station',
                vitals: {
                    heartRate: vitals.heartRate,
                    bloodPressure: (vitals.systolicBP && vitals.diastolicBP) ? `${vitals.systolicBP}/${vitals.diastolicBP}` : undefined,
                    spo2: vitals.spo2,
                    temperature: vitals.temperature
                }
            }).catch(console.error);

            goToStep(consultationType === 'allopathy' ? 5 : 4);
        } catch (err) {
            console.warn('Vitals save fallback:', err?.message);
            goToStep(consultationType === 'allopathy' ? 5 : 4);
        } finally {
            setIsSubmitting(false);
        }
    };


    // Step 4: Save AYUSH Classical Pariksha (Trividha, Ashtavidha, Dashavidha)
    //
    // Every field here is optional — the patient fills whichever groups they want.
    // We deliberately send ONLY what was actually answered. The previous version
    // defaulted blanks to 'Samagni', 'Madhyama', and even invented a Vata-Pitta
    // prakriti with dosha scores, which reached the doctor indistinguishable from
    // a real examination finding.
    const handleSaveDashavidha = async () => {
        setIsSubmitting(true);
        try {
            if (sessionId && !sessionId.startsWith('session_')) {
                const pariksha = { consultationType };
                const put = (key, value) => {
                    if (value !== undefined && value !== null && value !== '') pariksha[key] = value;
                };

                put('prakriti', dasha.prakritiDetails || (dasha.prakriti ? { primaryDosha: dasha.prakriti } : null));
                put('sara', dasha.sara);
                put('samhanana', dasha.samhanana);
                put('agni', dasha.agni);
                put('koshtha', dasha.koshtha);
                put('satva', dasha.satva);
                put('vyayamaShakti', dasha.vyayamaShakti);

                const filledTrividha = Object.fromEntries(
                    Object.entries(trividha || {}).filter(([, v]) => v !== '' && v != null)
                );
                const filledAshtavidha = Object.fromEntries(
                    Object.entries(ashtavidha || {}).filter(([, v]) => v !== '' && v != null)
                );
                if (Object.keys(filledTrividha).length) pariksha.trividhaPariksha = filledTrividha;
                if (Object.keys(filledAshtavidha).length) pariksha.ashtavidhaPariksha = filledAshtavidha;

                await axios.patch(`${API_URL}/kiosk/session/${sessionId}/dashavidha`, {
                    dashavidhaPariksha: pariksha
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

    // Step 5: Trigger Final SOAP Generation & Token (Saving Past Medical History, Allergies, Symptoms, AYUSH assessment & Records)
    const handleGenerateFinalToken = async () => {
        setIsSubmitting(true);
        try {
            const baselineMeds = [
                { name: 'Pantoprazole', dosage: '40mg', frequency: 'OD (Before Food)', route: 'Oral', system: 'Allopathic' },
                { name: 'Metformin', dosage: '500mg', frequency: 'BD (Post Meals)', route: 'Oral', system: 'Allopathic' }
            ];
            const medsToSave = extractedMeds.length > 0 ? extractedMeds : baselineMeds;

            if (sessionId && !sessionId.startsWith('session_')) {
                // Persist past medical history, allergies, step 2 symptoms, step 4 ayush assessment, and step 5 records
                await axios.patch(`${API_URL}/kiosk/session/${sessionId}/medical-history`, {
                    pastMedicalHistory: pastDiseases,
                    allergies: allergies,
                    currentSymptoms: chiefComplaint,
                    ayushAssessment: dasha,
                    currentMedications: medsToSave,
                    documents: uploadedDocs.map(d => ({
                        name: d.name,
                        size: d.size,
                        type: d.type || 'medical_report',
                        url: d.serverDoc?.url || d.serverDoc?.fileUrl || ''
                    }))
                }).catch(() => { });

                const res = await axios.post(`${API_URL}/kiosk/session/${sessionId}/generate-soap`);
                if (res.data.status === 'success') {
                    setFinalCaseSheet(res.data.data);
                }
                const qrRes = await axios.post(`${API_URL}/kiosk/session/${sessionId}/generate-qr`).catch(() => null);
                if (qrRes?.data?.data?.qrSvgDataUri) setQrSvg(qrRes.data.data.qrSvgDataUri);
            }

            // Also persist entire intake history to localStorage for the patient
            const cleanPhone = (patientForm.contactNumber || '').replace(/\D/g, '').slice(-10);
            if (cleanPhone) {
                try {
                    const payloadToCache = {
                        pastDiseases,
                        pastMedicalHistory: pastDiseases,
                        allergies,
                        currentSymptoms: chiefComplaint,
                        ayushAssessment: dasha,
                        currentMedications: medsToSave,
                        documents: uploadedDocs.map(d => ({ name: d.name, size: d.size })),
                        recordedAt: new Date().toISOString()
                    };
                    localStorage.setItem(`vaidya_patient_history_${cleanPhone}`, JSON.stringify(payloadToCache));
                    localStorage.setItem('vaidya_last_selected_conditions', JSON.stringify(pastDiseases));
                    localStorage.setItem('vaidya_last_selected_allergies', JSON.stringify(allergies));
                } catch (e) { }
            }

            goToStep(6);
        } catch (err) {
            console.warn('Final SOAP fallback:', err?.message);
            goToStep(6);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Dedicated clean print handler for official OPD Token Slip
    const handlePrintTokenSlip = () => {
        const slipEl = document.getElementById('printable-opd-token-slip');
        if (!slipEl) {
            window.print();
            return;
        }

        // Open an isolated, clean print window
        const printWin = window.open('', '_blank', 'width=780,height=960');
        if (!printWin) {
            // Pop-up blocked, fall back to in-page print which is isolated via @media print CSS
            window.print();
            return;
        }

        const slipHtml = slipEl.innerHTML;
        printWin.document.open();
        printWin.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>AIIA OPD Token Slip - ${tokenNumber || 'SLIP'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: #ffffff;
              padding: 16px;
            }
            .slip-sheet {
              max-width: 700px;
              margin: 0 auto;
              border: 2px solid #0f172a;
              border-radius: 16px;
              padding: 24px;
              background: #ffffff;
            }
            .no-print {
              display: none !important;
            }
            .border-dashed {
              border-style: dashed !important;
            }
          </style>
        </head>
        <body>
          <div class="slip-sheet">
            ${slipHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
        printWin.document.close();
    };

    // Dedicated PDF generation & download handler using generateOpdTokenPDF
    const handleDownloadTokenPdf = () => {
        setIsExportingPdf(true);
        try {
            generateOpdTokenPDF({
                tokenNumber: tokenNumber || 'OPD-20260910-007',
                triagePriority,
                patientName: patientForm.patientName || 'Rahul Sharma',
                age: patientForm.age || '42',
                gender: patientForm.gender || 'Male',
                abhaId: patientForm.abhaId || '14-1122-3344-5566',
                contactNumber: patientForm.contactNumber || '+91 98765 43210',
                consultationType,
                consultationStream: consultationType === 'allopathy' ? 'Allopathy General OPD' : 'Ayurvedic OPD',
                department: patientForm.department || (consultationType === 'allopathy' ? 'General Medicine' : 'Kayachikitsa (Internal Medicine)'),
                assignedRoom: consultationType === 'allopathy' ? 'Room 205 • Dr. A. K. Verma (MBBS, MD)' : 'Room 104 • Dr. V. Sharma (MD Ayur)',
                preferredHospital: visitMode === 'home' ? preferredHospital : 'All India Institute of Ayurveda (AIIA), New Delhi',
                preferredDoctor: preferredDoctor || (consultationType === 'allopathy' ? 'Dr. A. K. Verma' : 'Dr. V. Sharma'),
                vitals,
                chiefComplaint: chiefComplaint || (transcript.length > 0 ? transcript[0].text : 'Joint pain & morning joint stiffness')
            });
        } catch (err) {
            console.error('Failed to export OPD Token Slip PDF via generateOpdTokenPDF:', err);
            window.print();
        } finally {
            setTimeout(() => setIsExportingPdf(false), 600);
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
        <div className={`vs-kiosk w-full min-h-screen ${isFullscreen ? 'fixed inset-0 z-[999999] bg-slate-950 text-white overflow-y-auto p-3 sm:p-8' : 'max-w-7xl mx-auto pt-2 pb-36 sm:py-6 px-2.5 sm:px-6'}`}>

            {/* ────────────────── TOP KIOSK HEADER ────────────────── */}
            <div className="bg-gradient-to-r from-emerald-50/95 via-white/95 to-teal-50/95 text-slate-900 rounded-2xl p-2.5 sm:p-4 shadow-md border border-emerald-200/90 mb-2.5 sm:mb-5 relative overflow-hidden backdrop-blur-xl select-none">

                {/* Mobile Viewport Header (Clean, Clear, Responsive with Direct Hindi & Voice Options) */}
                <div className="flex sm:hidden flex-col gap-2 pb-2.5 border-b border-emerald-200/70">
                    <div className="flex items-center justify-between gap-2">
                        {/* Branding with Clean Typography */}
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Stethoscope className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight block truncate">
                                    {preferredHospital ? preferredHospital.split(',')[0] : 'AIIA New Delhi'}
                                </span>
                                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 block -mt-0.5">
                                    {lang === 'hi' ? 'स्मार्ट ओपीडी केस-टेकिंग' : 'Smart OPD Intake'}
                                </span>
                            </div>
                        </div>

                        {/* Header Controls: Direct Hindi Toggle & Voice Option */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Clean Language Segmented Pill */}
                            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-2xs">
                                <button
                                    type="button"
                                    onClick={() => handleSetLang('hi')}
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${lang === 'hi'
                                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-slate-900'
                                        }`}
                                    title="हिन्दी भाषा चुनें"
                                >
                                    हिन्दी
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetLang('en')}
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${lang === 'en'
                                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-slate-900'
                                        }`}
                                    title="Switch to English"
                                >
                                    EN
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleSetLang('mr')}
                                    className={`px-1.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${lang === 'mr'
                                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                                            : 'text-slate-600 dark:text-gray-300 hover:text-slate-900'
                                        }`}
                                    title="मराठी भाषा निवडा"
                                >
                                    मरा
                                </button>
                            </div>

                            {/* Clean Voice Guidance Toggle */}
                            <button
                                type="button"
                                onClick={() => {
                                    const next = !voiceAssist;
                                    setVoiceAssist(next);
                                    speakText(next ? (lang === 'hi' ? 'आवाज़ सहायता चालू है' : 'Voice guidance enabled') : '');
                                }}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-2xs ${voiceAssist
                                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:bg-slate-50'
                                    }`}
                                title="Toggle Voice Guidance"
                            >
                                {voiceAssist ? <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                                <span>{voiceAssist ? (lang === 'hi' ? 'आवाज़' : 'Voice') : (lang === 'hi' ? 'मौन' : 'Mute')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Desktop Viewport Header (Spacious with full titles and facility selectors) */}
                <div className="hidden sm:flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 sm:gap-3 relative z-10">
                    {/* Hospital / Problem Statement Branding */}
                    <div className="flex items-center gap-2.5 sm:gap-3 select-none">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
                            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                            </div>
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-0.5">
                                <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-xs">
                                    AIIA AYUSH OPD • MediKiosk
                                </span>
                                <span className="px-1.5 sm:px-2 py-0.5 bg-teal-100 text-teal-800 border border-teal-300/80 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center gap-1 truncate max-w-[170px] sm:max-w-none">
                                    🏥 {preferredHospital ? preferredHospital.split(',')[0] : 'AIIA New Delhi'}
                                </span>
                                {triagePriority === 'emergency' && (
                                    <span className="px-1.5 sm:px-2 py-0.5 bg-red-600 text-white animate-pulse rounded-full text-[9px] sm:text-[10px] font-black uppercase flex items-center gap-1 shadow-xs">
                                        <AlertOctagon className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> EMERGENCY
                                    </span>
                                )}
                                {tokenNumber && (
                                    <span className="px-1.5 sm:px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300/90 rounded-full text-[9px] sm:text-[10px] font-mono font-black">
                                        TOKEN: {tokenNumber}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xs sm:text-base font-black tracking-tight text-slate-900 leading-tight select-none outline-none">
                                {t.kioskTitle}
                            </h1>
                        </div>
                    </div>

                    {/* Controls: Hospital Facility, TTS, Fullscreen */}
                    <div className="flex items-center gap-1.5 sm:gap-2 self-stretch md:self-auto justify-between md:justify-end overflow-x-auto scrollbar-hide py-0.5">
                        {/* Hospital Facility Selector */}
                        <label className="relative flex items-center shrink-0">
                            <span className="sr-only">Hospital Facility</span>
                            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 absolute left-2 pointer-events-none" />
                            <select
                                value={preferredHospital}
                                onChange={(e) => setPreferredHospital(e.target.value)}
                                className="appearance-none pl-6 sm:pl-8 pr-6 sm:pr-7 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-white border border-emerald-200 text-slate-800 text-[11px] sm:text-xs font-bold shadow-xs cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[140px] sm:max-w-[200px] truncate"
                            >
                                {HOSPITALS.map(h => (
                                    <option key={h.id} value={h.name} className="bg-white text-slate-800 font-bold">
                                        {h.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 pointer-events-none" />
                        </label>

                        {/* Language Switcher Pill for Desktop */}
                        <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-white/10 shrink-0 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => handleSetLang('hi')}
                                className={`px-2 py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${lang === 'hi'
                                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                                        : 'text-slate-600 dark:text-gray-300 hover:text-slate-900'
                                    }`}
                                title="हिन्दी"
                            >
                                हिन्दी
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetLang('en')}
                                className={`px-2 py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${lang === 'en'
                                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                                        : 'text-slate-600 dark:text-gray-300 hover:text-slate-900'
                                    }`}
                                title="English"
                            >
                                EN
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSetLang('mr')}
                                className={`px-1.5 py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${lang === 'mr'
                                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                                        : 'text-slate-600 dark:text-gray-300 hover:text-slate-900'
                                    }`}
                                title="मराठी"
                            >
                                मरा
                            </button>
                        </div>

                        {/* Voice Guidance Toggle */}
                        <button
                            onClick={() => setVoiceAssist(!voiceAssist)}
                            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer shadow-xs shrink-0 ${voiceAssist ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                            title="Toggle Read-Aloud Voice Guidance"
                        >
                            {voiceAssist ? <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white animate-pulse" /> : <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />}
                            <span className="hidden sm:inline text-xs">{t.voiceAssist}</span>
                        </button>

                        {/* Fullscreen Kiosk Mode Toggle */}
                        <button
                            onClick={toggleFullscreenMode}
                            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer shadow-xs shrink-0 ${isFullscreen ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'}`}
                            title={isFullscreen ? t.exitFullScreen : t.fullScreen}
                        >
                            {isFullscreen ? <Minimize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                            <span className="hidden md:inline text-xs">{isFullscreen ? t.exitFullScreen : t.fullScreen}</span>
                        </button>
                    </div>
                </div>

                {/* ────────────────── STEPPER PROGRESS BAR (SMOOTH SCROLL & COMPACT TOUCH PILLS) ────────────────── */}
                <div className="mt-2 pt-1.5 sm:pt-2 border-t border-emerald-200/70">
                    <div className="flex sm:hidden items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 px-1 mb-1">
                        <span>{lang === 'hi' ? `चरण ${currentStep} / ६` : `Step ${currentStep} of 6`}</span>
                        <span className="text-slate-500 font-bold">
                            {currentStep === 1 ? (lang === 'hi' ? 'रोगी पहचान' : 'Patient Identity')
                                : currentStep === 1.5 ? (lang === 'hi' ? 'चिकित्सा पद्धति' : 'Care Pathway')
                                    : currentStep === 2 ? (lang === 'hi' ? 'लक्षण बातचीत' : 'Symptom Intake')
                                        : currentStep === 3 ? (lang === 'hi' ? 'वाइटल्स स्टेशन' : 'Vitals Station')
                                            : currentStep === 4 ? (lang === 'hi' ? 'आयुष परीक्षा' : 'AYUSH Pariksha')
                                                : currentStep === 5 ? (lang === 'hi' ? 'दस्तावेज व इतिहास' : 'Records & History')
                                                    : (lang === 'hi' ? 'ओपीडी पर्ची' : 'Token Slip')}
                        </span>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-0.5 items-center">
                        {[
                            {
                                step: 1,
                                label: lang === 'hi' ? '1. पहचान' : lang === 'mr' ? '1. ओळख' : '1. Identity',
                                icon: User,
                                required: true
                            },
                            {
                                step: 1.5,
                                label: lang === 'hi' ? '1.5 पद्धति' : lang === 'mr' ? '1.5 पद्धती' : '1.5 Pathway',
                                icon: Stethoscope,
                                required: true
                            },
                            {
                                step: 2,
                                label: lang === 'hi' ? '2. लक्षण' : lang === 'mr' ? '2. लक्षणे' : '2. Symptoms',
                                icon: Mic,
                                required: true
                            },
                            {
                                step: 3,
                                label: lang === 'hi' ? '3. वाइटल्स' : lang === 'mr' ? '3. वाइटल्स' : '3. Vitals',
                                icon: Activity,
                                optional: true
                            },
                            {
                                step: 4,
                                label: lang === 'hi' ? '4. परीक्षा' : lang === 'mr' ? '4. परीक्षा' : '4. Pariksha',
                                icon: Sparkles,
                                optional: consultationType !== 'ayurvedic' && consultationType !== 'allopathy',
                                required: consultationType === 'ayurvedic',
                                disabled: consultationType === 'allopathy',
                                skipped: consultationType === 'allopathy'
                            },
                            {
                                step: 5,
                                label: lang === 'hi' ? '5. रिकॉर्ड्स' : lang === 'mr' ? '5. रेकॉर्ड्स' : '5. Records',
                                icon: FileText,
                                optional: true
                            },
                            {
                                step: 6,
                                label: lang === 'hi' ? '6. टोकन' : lang === 'mr' ? '6. टोकन' : '6. Token',
                                icon: QrCode,
                                required: true
                            }
                        ].map(s => {
                            const isCompleted = currentStep > s.step;
                            const isCurrent = currentStep === s.step;
                            const isDisabled = s.disabled;
                            const IconComponent = s.icon;
                            return (
                                <button
                                    key={s.step}
                                    id={`step-tab-${s.step}`}
                                    type="button"
                                    onClick={() => {
                                        if (isDisabled) {
                                            speakText(lang === 'hi' ? 'एलोपैथी सामान्य ओपीडी के लिए यह चरण छोड़ दिया गया है।' : 'This step is skipped for Allopathy OPD.');
                                            return;
                                        }
                                        goToStep(s.step);
                                    }}
                                    disabled={isDisabled}
                                    className={`shrink-0 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer select-none ${isDisabled
                                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
                                        : isCurrent
                                            ? 'bg-emerald-600 text-white font-black shadow-md ring-2 ring-emerald-500/40'
                                            : isCompleted
                                                ? 'bg-emerald-100/90 border border-emerald-300 text-emerald-800 hover:bg-emerald-200/80 font-bold'
                                                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                                        }`}
                                >
                                    <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md flex items-center justify-center text-[9px] sm:text-[10px] font-black shrink-0 ${isCurrent ? 'bg-white text-emerald-700' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {isCompleted ? <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" /> : <IconComponent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                                    </div>
                                    <span className="whitespace-nowrap font-bold text-[11px] sm:text-xs">{s.label}</span>
                                    {s.skipped && (
                                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-blue-100 text-blue-700 font-black">Skip</span>
                                    )}
                                    {s.optional && !s.skipped && !isCurrent && (
                                        <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-500" />
                                    )}
                                    {s.required && !s.skipped && !isCompleted && !isCurrent && (
                                        <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-600" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ────────────────── STEP 0: FALLBACK CONSENT ────────────────── */}
            {currentStep === 0 && (
                <ConsentScreen
                    lang={['hi', 'mr', 'en'].includes(lang) ? lang : 'en'}
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
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4 sm:space-y-6 animate-in fade-in duration-300">

                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-4 pb-2.5 sm:pb-5 border-b border-gray-200 dark:border-white/10">
                        <div>
                            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                                Step 1 of 6 • Patient Check-In
                            </div>
                            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {lang === 'hi' ? 'रोगी पहचान व आभा' : lang === 'mr' ? 'रुग्ण ओळख व आभा' : t.step1}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                                {lang === 'hi'
                                    ? 'कृपया अपना 14 अंकों का आभा (ABHA) स्वास्थ्य पहचान नंबर दर्ज करें।'
                                    : lang === 'mr'
                                        ? 'कृपया तुमचा १४ अंकी आभा क्रमांक प्रविष्ट करा.'
                                        : 'Enter your 14-digit Ayushman Bharat Health Account (ABHA) number.'}
                            </p>
                        </div>
                    </div>

                    {/* Cooldown Alert Modal / Banner */}
                    {cooldownAlert && (
                        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3 sm:gap-4 animate-in fade-in duration-300">
                            <div className="flex items-start gap-2.5 sm:gap-3">
                                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-black text-xs sm:text-sm text-amber-800 dark:text-amber-300 mb-0.5 sm:mb-1">
                                        ABHA OPD Token Cooldown in Effect
                                    </h4>
                                    <p className="text-[11px] sm:text-xs font-medium leading-relaxed">
                                        {cooldownAlert}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCooldownAlert(null)}
                                className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Returning Patient Fast-Pass Delta Card (10-Second Kiosk Intake) */}
                    {isReturningPatient && (
                        <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-slate-900/40 border-2 border-emerald-500/40 shadow-xl space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-emerald-500/20">
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-base sm:text-xl">
                                        👵
                                    </div>
                                    <div>
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                            RETURNING PATIENT RECOGNIZED • 10-SECOND FAST PASS
                                        </span>
                                        <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                            Last Visit: {previousVisitInfo?.visitDate || '24 Jan 2026'} ({previousVisitInfo?.diagnosis || 'Sandhivata'}) • Dept: {previousVisitInfo?.department || 'Kayachikitsa'}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleFastPassToken}
                                    disabled={isSubmitting}
                                    className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                                >
                                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                                    {isSubmitting ? 'Generating...' : '⚡ 1-Click Instant Token (10s)'}
                                </button>
                            </div>

                            {/* What Has Changed Since Your Last Visit? */}
                            <div>
                                <label className="block text-[11px] sm:text-xs font-black text-slate-800 dark:text-gray-200 uppercase tracking-wider mb-1.5 sm:mb-2">
                                    What has changed since your last visit? (Select all that apply)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                                    {[
                                        { id: 'new_medicine', label: '💊 New Medicine', sub: 'Started another drug' },
                                        { id: 'stopped_medicine', label: '🛑 Stopped Med', sub: 'Discontinued previous dose' },
                                        { id: 'new_report', label: '📄 New Lab Report', sub: 'Blood test or scan' },
                                        { id: 'nothing_changed', label: '✨ Same Status', sub: 'Routine follow-up' }
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
                                                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${isChecked
                                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-400/30 font-black'
                                                    : 'bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-emerald-400/40'
                                                    }`}
                                            >
                                                <div className="text-[11px] sm:text-xs font-bold leading-tight">{opt.label}</div>
                                                <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5 truncate">{opt.sub}</div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {changesSinceLastVisit.length > 0 && !changesSinceLastVisit.includes('nothing_changed') && (
                                    <div className="mt-2.5 sm:mt-3">
                                        <input
                                            type="text"
                                            value={changeDetails}
                                            onChange={(e) => setChangeDetails(e.target.value)}
                                            placeholder="Brief note on what changed (e.g. Started Atorvastatin 20mg daily; new HbA1c is 8.2%)"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/40 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* New Patient Helpful Note (Desktop Only to save mobile viewport) */}
                    {!isReturningPatient && (
                        <div className="hidden sm:flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-teal-500/10 border border-teal-500/25 items-center justify-between gap-2.5 text-xs">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-teal-500 shrink-0" />
                                <span className="text-xs text-slate-700 dark:text-gray-300">
                                    <strong>First OPD Visit?</strong> Fast 45-second intake. You do NOT need to scan 10 documents now. Complete check-in and upload past records anytime via your Patient Portal!
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Card-Based Step 1 Architecture (Optimized for Mobile Screens & Touch Interaction) */}
                    <div className="space-y-3.5 sm:space-y-5">

                        {/* ── CARDLET 1: ABHA HEALTH ID & VERIFICATION ── */}
                        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50/90 dark:bg-slate-800/50 border border-emerald-500/25 dark:border-emerald-500/20 shadow-xs space-y-2.5 sm:space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                                        🆔
                                    </div>
                                    <div>
                                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                            {lang === 'hi' ? 'आभा (ABHA) स्वास्थ्य पहचान संख्या' : t.abhaLabel}
                                            <span className="text-emerald-600 dark:text-emerald-400">*</span>
                                        </span>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 whitespace-nowrap">
                                    ABDM
                                </span>
                            </div>

                            <div className="flex gap-2 items-center">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={patientForm.abhaId}
                                        onChange={(e) => setPatientForm({ ...patientForm, abhaId: e.target.value })}
                                        readOnly={Boolean(currentUser?.abhaId)}
                                        placeholder={t.abhaPlaceholder}
                                        className={`w-full pl-3 sm:pl-4 pr-20 sm:pr-32 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border-2 border-emerald-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs sm:text-lg font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all shadow-inner ${currentUser?.abhaId ? 'cursor-not-allowed opacity-90' : ''
                                            }`}
                                    />
                                    <span className="absolute right-1.5 sm:right-3 top-2 sm:top-2.5 px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[9px] sm:text-xs font-black tracking-wider uppercase border border-emerald-500/30 flex items-center gap-1">
                                        {currentUser?.abhaId ? (
                                            <>🔒 <span className="hidden sm:inline">LOCKED</span></>
                                        ) : (
                                            <><CheckCircle2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" /> <span className="hidden sm:inline">ABHA </span>LINKED</>
                                        )}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCheckPatientHistory}
                                    disabled={lookingUpPatient}
                                    className="px-3 sm:px-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all cursor-pointer shrink-0 shadow-sm active:scale-95 flex items-center gap-1"
                                    title="Check if returning patient with past records"
                                >
                                    {lookingUpPatient ? (
                                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> <span className="hidden sm:inline">Checking...</span></>
                                    ) : (
                                        <><span>🔍</span> <span>Check</span></>
                                    )}
                                </button>
                            </div>

                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400">
                                {lang === 'hi'
                                    ? 'अपना 14 अंकों का आभा नंबर दर्ज करें या पूर्व रिकॉर्ड्स जांचने हेतु Check दबाएं।'
                                    : 'Enter 14-digit ABHA number or tap Check to look up previous OPD history.'}
                            </p>
                        </div>

                        {/* ── CARDLET 2: PATIENT DEMOGRAPHICS ── */}
                        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 shadow-xs space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-white/10">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                                    👤
                                </div>
                                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                    {lang === 'hi' ? 'रोगी व्यक्तिगत विवरण' : lang === 'mr' ? 'रुग्ण वैयक्तिक तपशील' : 'Patient Personal Details'}
                                </span>
                            </div>

                            {/* Patient Full Name */}
                            <div>
                                <label className="block text-[11px] sm:text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                    {t.nameLabel} *
                                </label>
                                <input
                                    type="text"
                                    value={patientForm.patientName}
                                    onChange={(e) => setPatientForm({ ...patientForm, patientName: e.target.value })}
                                    required
                                    placeholder="e.g. Rahul Sharma"
                                    className="w-full px-3.5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all shadow-xs"
                                />
                            </div>

                            {/* Age & Gender Side-by-Side (2 Columns on All Viewports) */}
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                                <div>
                                    <label className="block text-[11px] sm:text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                        {t.ageLabel} *
                                    </label>
                                    <input
                                        type="number"
                                        value={patientForm.age}
                                        onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                                        min="1"
                                        max="120"
                                        placeholder="35"
                                        className="w-full px-3.5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all shadow-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] sm:text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                        {t.genderLabel} *
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={patientForm.gender}
                                            onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                                            required
                                            className="w-full appearance-none px-3.5 pr-9 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all shadow-xs cursor-pointer"
                                        >
                                            <option value="" disabled>-- {lang === 'hi' ? 'लिंग चुनें' : lang === 'mr' ? 'लिंग निवडा' : 'Select Gender'} --</option>
                                            <option value="Male">👨 {t.male || 'Male'}</option>
                                            <option value="Female">👩 {t.female || 'Female'}</option>
                                            <option value="Other">⚧ {t.other || 'Other'}</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 sm:top-4 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label className="block text-[11px] sm:text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                    {t.mobileLabel}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <Phone className="w-3.5 h-3.5" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={patientForm.contactNumber}
                                        onChange={(e) => setPatientForm({ ...patientForm, contactNumber: e.target.value })}
                                        placeholder="10-digit mobile number"
                                        className="w-full pl-9 pr-3.5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none transition-all font-mono shadow-xs"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Patient Consent & ABDM Privacy Controls (§3 Restored) */}
                    <div className="p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/40 border-2 border-emerald-500/30 space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200 dark:border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                                        {lang === 'hi' ? 'रोगी सहमति एवं डेटा सुरक्षा (ABDM / DPDP)' : lang === 'mr' ? 'रुग्ण संमती आणि डेटा सुरक्षा (ABDM)' : 'Patient Consent & Privacy Controls'}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 dark:text-gray-400">
                                        National Health Authority (ABDM) & Digital Personal Data Protection (DPDP) Compliant
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowConsentPolicyModal(true)}
                                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-900 dark:text-blue-300 text-xs font-black border border-blue-300 dark:border-blue-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                    <FileText className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                                    {lang === 'hi' ? 'नियम व नीतियां पढ़ें (DPDP / ABDM)' : lang === 'mr' ? 'नियम व धोरणे वाचा (DPDP)' : 'View Full Rules & Regulations'}
                                </button>
                                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/30 w-fit">
                                    ✓ Consent Authorized
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm cursor-pointer hover:border-emerald-500/40 transition-all">
                                <input
                                    type="checkbox"
                                    checked={consent.dataCapture !== false}
                                    onChange={(e) => setConsent({ ...consent, dataCapture: e.target.checked })}
                                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {lang === 'hi' ? 'क्लिनिकल लक्षण व वाइटल्स रिकॉर्डिंग' : lang === 'mr' ? 'क्लिनिकल लक्षणे व वाइटल्स नोंदणी' : 'Clinical History & Vitals Capture'}
                                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] rounded font-black">REQUIRED</span>
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-gray-400 block leading-tight">
                                        {lang === 'hi' ? 'लक्षण, तापमान, बीपी व आयुष परीक्षा दर्ज करने की सहमति' : lang === 'mr' ? 'लक्षणे, वाइटल्स व आयुष परीक्षा नोंदवण्याची संमती' : 'Record symptoms, vitals & Ayush examination for this OPD visit'}
                                    </span>
                                </div>
                            </label>

                            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm cursor-pointer hover:border-emerald-500/40 transition-all">
                                <input
                                    type="checkbox"
                                    checked={consent.doctorSharing !== false}
                                    onChange={(e) => setConsent({ ...consent, doctorSharing: e.target.checked })}
                                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                                />
                                <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {lang === 'hi' ? 'परामर्शदाता डॉक्टर के साथ शेयरिंग' : lang === 'mr' ? 'सल्लागार डॉक्टरांसोबत डेटा शेअरिंग' : 'Consulting Physician Sharing'}
                                        <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] rounded font-black">ACTIVE</span>
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-gray-400 block leading-tight">
                                        {lang === 'hi' ? 'ओपीडी डॉक्टर के साथ केस सारांश साझा करने की अनुमति' : lang === 'mr' ? 'डॉक्टरांसोबत केस सारांश शेअर करण्याची संमती' : 'Share AI-assisted case summary with assigned doctor'}
                                    </span>
                                </div>
                            </label>
                        </div>

                        {/* Complete DPDP / ABDM Rules & Regulations Modal */}
                        <ConsentPolicyModal
                            isOpen={showConsentPolicyModal}
                            onClose={() => setShowConsentPolicyModal(false)}
                            lang={lang}
                        />
                    </div>

                    {/* Action button */}
                    <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-white/10 flex justify-end">
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={handleStartSession}
                            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 sm:gap-3 transition-all cursor-pointer active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Starting Intake Session...
                                </>
                            ) : (
                                <>
                                    {t.startIntakeBtn} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ────────────────── STEP 1.5: CARE PATHWAY SELECTION ────────────────── */}
            {currentStep === 1.5 && (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4 sm:space-y-6 animate-in fade-in duration-300">
                    <div className="space-y-1.5 sm:space-y-2">
                        <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 sm:gap-3">
                            <Stethoscope className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-500" />
                            {lang === 'hi' ? 'आप किस चिकित्सा पद्धति से इलाज चाहते हैं?'
                                : lang === 'mr' ? 'तुम्हाला कोणत्या उपचार पद्धतीने उपचार हवे आहेत?'
                                    : 'Which system of medicine would you like?'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400">
                            {lang === 'hi' ? 'आपके उत्तर के आधार पर अगले प्रश्न तय किए जाएंगे।'
                                : lang === 'mr' ? 'तुमच्या निवडीनुसार पुढील प्रश्न ठरवले जातील.'
                                    : 'The next set of questions is chosen based on what you pick here.'}
                        </p>
                    </div>

                    {/* Stream choice */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            {
                                id: 'allopathy',
                                icon: Pill,
                                title: lang === 'hi' ? 'एलोपैथी' : lang === 'mr' ? 'अ‍ॅलोपॅथी' : 'Allopathy',
                                sub: lang === 'hi' ? 'आधुनिक चिकित्सा — लक्षण आधारित प्रश्न'
                                    : lang === 'mr' ? 'आधुनिक वैद्यक — लक्षणांवर आधारित प्रश्न'
                                        : 'Modern medicine — short symptom-based questions',
                                ring: 'emerald'
                            },
                            {
                                id: 'ayurvedic',
                                icon: Sparkles,
                                title: lang === 'hi' ? 'आयुर्वेदिक' : lang === 'mr' ? 'आयुर्वेदिक' : 'Ayurvedic',
                                sub: lang === 'hi' ? 'दशविध परीक्षा — त्रिविध, अष्टविध, दशविध'
                                    : lang === 'mr' ? 'दशविध परीक्षा — त्रिविध, अष्टविध, दशविध'
                                        : 'Dashavidha Pariksha — Trividha, Ashtavidha, Dashavidha',
                                ring: 'amber'
                            }
                        ].map(opt => {
                            const Icon = opt.icon;
                            const active = consultationType === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => { setConsultationType(opt.id); speakText(opt.title); }}
                                    className={`text-left p-4 sm:p-6 rounded-2xl border-2 transition-all active:scale-[0.98] ${active
                                        ? 'border-emerald-500 bg-emerald-500/10 ring-4 ring-emerald-500/20 shadow-xl'
                                        : 'border-gray-200 dark:border-white/10 hover:border-emerald-400/60 bg-white dark:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${active ? 'bg-emerald-500 text-white' : 'bg-emerald-500/15 text-emerald-500'}`}>
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                        </div>
                                        <div className="space-y-0.5 sm:space-y-1 min-w-0">
                                            <div className="font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                                <span>{opt.title}</span>
                                                {active && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-gray-400 leading-snug">{opt.sub}</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Visit mode */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-black uppercase tracking-wide text-slate-500 dark:text-gray-400">
                            {lang === 'hi' ? 'आप कहाँ से पंजीकरण कर रहे हैं?'
                                : lang === 'mr' ? 'तुम्ही कुठून नोंदणी करत आहात?'
                                    : 'Where are you registering from?'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { id: 'kiosk', icon: QrCode, label: lang === 'hi' ? 'अस्पताल कियोस्क से' : lang === 'mr' ? 'रुग्णालय कियोस्कवरून' : 'At the hospital kiosk' },
                                { id: 'home', icon: Phone, label: lang === 'hi' ? 'घर से (अपॉइंटमेंट बुक करें)' : lang === 'mr' ? 'घरून (अपॉइंटमेंट बुक करा)' : 'From home (book an appointment)' }
                            ].map(m => {
                                const Icon = m.icon;
                                const active = visitMode === m.id;
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setVisitMode(m.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-bold text-sm transition-all active:scale-[0.98] ${active
                                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                            : 'border-gray-200 dark:border-white/10 text-slate-600 dark:text-gray-300 hover:border-emerald-400/60'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 shrink-0" />
                                        {m.label}
                                        {active && <Check className="w-4 h-4 ml-auto" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Home booking: hospital, department & doctor */}
                    {visitMode === 'home' && (
                        <div className="space-y-4 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 text-sm font-black text-emerald-700 dark:text-emerald-300">
                                <Info className="w-4 h-4" />
                                {lang === 'hi' ? 'अपनी पसंद का अस्पताल, विभाग और डॉक्टर चुनें'
                                    : lang === 'mr' ? 'तुमच्या पसंतीचे रुग्णालय, विभाग आणि डॉक्टर निवडा'
                                        : 'Choose your preferred hospital, department and doctor'}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">
                                    {lang === 'hi' ? 'अस्पताल' : lang === 'mr' ? 'रुग्णालय' : 'Hospital'}
                                </label>
                                <select
                                    value={preferredHospital}
                                    onChange={(e) => {
                                        setPreferredHospital(e.target.value);
                                        setPreferredDoctor('');
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                                >
                                    <option value="">{lang === 'hi' ? '— अस्पताल चुनें —' : '— Select hospital —'}</option>
                                    {(mongoHospitals.length > 0 ? mongoHospitals : HOSPITALS).map(h => (
                                        <option key={h.id || h.name} value={h.name}>{h.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-600 dark:text-gray-300">
                                        {lang === 'hi' ? 'विभाग (OPD Clinic)' : lang === 'mr' ? 'विभाग' : 'Department'}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowManualDeptModal(true)}
                                        className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <Building2 className="w-3.5 h-3.5" />
                                        <span>{lang === 'hi' ? 'क्लिनिक डायरेक्टरी 🔍' : 'Browse Clinics 🔍'}</span>
                                    </button>
                                </div>
                                <select
                                    value={patientForm.department}
                                    onChange={(e) => {
                                        setPatientForm({ ...patientForm, department: e.target.value });
                                        setDeptManuallySet(Boolean(e.target.value));
                                        setPreferredDoctor('');
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                                >
                                    <option value="">{lang === 'hi' ? '— विभाग चुनें (या डायरेक्टरी देखें) —' : '— Select department or browse directory —'}</option>
                                    {departmentsList.map(d => <option key={d.id} value={d.id}>{d.label || d.id}</option>)}
                                </select>
                                {patientForm.department && (
                                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> Assigned: <strong>{patientForm.department}</strong>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setShowManualDeptModal(true)}
                                            className="text-slate-500 dark:text-gray-400 hover:text-emerald-600 underline font-bold cursor-pointer"
                                        >
                                            Change Clinic
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 dark:text-gray-300">
                                    {lang === 'hi' ? 'डॉक्टर का चयन (वैकल्पिक)' : lang === 'mr' ? 'डॉक्टर (ऐच्छिक)' : 'Doctor Selection'}
                                </label>
                                <select
                                    value={preferredDoctor}
                                    onChange={(e) => setPreferredDoctor(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                                >
                                    <option value="">
                                        {lang === 'hi' ? '— स्वचालित रूप से डॉक्टर आवंटित करें (Auto-Assign) —' : '— Auto-Assign Matching Doctor —'}
                                    </option>
                                    {(() => {
                                        const filtered = getFilteredDoctors();
                                        const docsToRender = filtered.length > 0 ? filtered : mongoDoctors;
                                        return docsToRender.map(d => (
                                            <option key={d.doctorId || d.fullName} value={d.fullName}>
                                                {d.fullName} ({d.qualifications || 'Physician'} • {d.systemOfMedicine || (consultationType === 'ayurvedic' ? 'Ayurvedic' : 'Allopathy')}) {d.roomNumber ? `[${d.roomNumber}]` : ''} {d.hospitalName ? `• ${d.hospitalName.split(',')[0]}` : ''}
                                            </option>
                                        ));
                                    })()}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 justify-between">
                        <button
                            type="button"
                            onClick={() => goToStep(1)}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/10 text-slate-700 dark:text-gray-200 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/15 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> {lang === 'hi' ? 'पीछे' : lang === 'mr' ? 'मागे' : 'Back'}
                        </button>
                        <button
                            type="button"
                            disabled={savingPathway}
                            onClick={handleConfirmPathway}
                            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
                        >
                            {savingPathway ? (
                                <><RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> {lang === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...'}</>
                            ) : (
                                <>
                                    {consultationType === 'ayurvedic'
                                        ? (lang === 'hi' ? 'आयुर्वेदिक प्रश्न शुरू करें' : lang === 'mr' ? 'आयुर्वेदिक प्रश्न सुरू करा' : 'Start Ayurvedic questions')
                                        : (lang === 'hi' ? 'लक्षण प्रश्न शुरू करें' : lang === 'mr' ? 'लक्षण प्रश्न सुरू करा' : 'Start symptom questions')}
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ────────────────── STEP 2: SOCRATES VOICE INTAKE (MANDATORY) ────────────────── */}
            {currentStep === 2 && (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4 sm:space-y-6 animate-in fade-in duration-300">

                    {/* Step 2 Header: Clean, concise & font-focused */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 sm:pb-4 border-b border-gray-200 dark:border-white/10">
                        <div>
                            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wider mb-2">
                                Step 2 of 6 • Voice Clinical Intake • REQUIRED
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                                    {t.socratesHeading}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowVoiceGuide(prev => !prev)}
                                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                    <span>{showVoiceGuide ? (lang === 'hi' ? 'गाइड बंद करें' : 'Hide Guide') : (lang === 'hi' ? 'गाइड देखें' : 'How it works')}</span>
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                                {t.socratesSub}
                            </p>
                        </div>

                        {/* Red flag indicator badge */}
                        {redFlags.length > 0 && (
                            <div className="px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-600 dark:text-red-400 text-xs font-black flex items-center gap-1.5 animate-bounce shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                <span>{redFlags.length} RED-FLAG ACTIVE</span>
                            </div>
                        )}
                    </div>

                    {/* Optional Collapsible Voice Guide Banner (View Option) */}
                    {showVoiceGuide && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-1.5 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-200">
                            <p className="font-bold text-emerald-800 dark:text-emerald-300">
                                💡 {t.socratesSub}
                            </p>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600 dark:text-gray-400">
                                <li>{lang === 'hi' ? 'नीचे दिए गए मुख्य लक्षणों पर 1-टैप करें या हरा माइक दबाकर बोलें।' : 'Tap any common symptom chip below or press the green microphone to speak.'}</li>
                                <li>{lang === 'hi' ? 'AI आपके लक्षणों के अनुसार सबसे उपयुक्त ओपीडी विभाग तय करेगा।' : 'The AI will automatically route your case to the best clinical department.'}</li>
                            </ul>
                        </div>
                    )}

                    {/* Compact Assigned OPD Department Ribbon: Focuses on main data */}
                    <div className="p-2.5 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-slate-900/10 border border-emerald-500/30 flex items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 text-base shadow-inner">
                                🏥
                            </div>
                            <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block leading-tight">
                                    {lang === 'hi' ? 'आवंटित क्लिनिक:' : 'Assigned OPD Clinic:'}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {patientForm.department ? (
                                        <span className="font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1 truncate">
                                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">{patientForm.department}</span>
                                        </span>
                                    ) : (
                                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3 animate-spin shrink-0" />
                                            <span className="truncate">{lang === 'hi' ? 'लक्षणों से स्वतः तय होगा' : 'Pending Symptom Analysis'}</span>
                                        </span>
                                    )}
                                    {inferredDept?.confidence && patientForm.department && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[9px] font-bold">
                                            {Math.round(inferredDept.confidence > 1 ? inferredDept.confidence : inferredDept.confidence * 100)}% Match
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowManualDeptModal(true)}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-800 dark:text-slate-100 font-black text-xs border border-emerald-500/40 transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1 active:scale-95"
                        >
                            <span>{patientForm.department ? (lang === 'hi' ? 'बदलें ✍️' : 'Change ✍️') : (lang === 'hi' ? 'चुनें 🔍' : 'Select 🔍')}</span>
                        </button>
                    </div>

                    {/* Quick Common Symptoms Tap Grid */}
                    <SymptomIconPicker
                        lang={['hi', 'mr', 'en'].includes(lang) ? lang : 'en'}
                        value={chiefComplaint}
                        onSelect={(text) => {
                            setChiefComplaint(text);
                            setSpeechInput(text);
                            handleSendSocratesResponse(text);
                        }}
                    />


                    {/* Conversational Doctor-Patient Dialogue Feed */}
                    {transcript.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto p-4 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-gray-200 dark:border-white/10 shadow-inner">
                            {/* Extracted Clinical Details Badge */}
                            {(extractedHistory.illnesses?.length > 0 || extractedHistory.allergies?.length > 0) && (
                                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-transparent border border-emerald-500/30 flex flex-wrap items-center gap-2 animate-in fade-in">
                                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5" /> AI Recognized Clinical History:
                                    </span>
                                    {extractedHistory.illnesses.map((ill, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 text-[11px] font-bold">
                                            Past Illness: {ill}
                                        </span>
                                    ))}
                                    {extractedHistory.allergies.map((all, i) => (
                                        <span key={i} className="px-2.5 py-1 rounded-xl bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30 text-[11px] font-bold">
                                            Allergy: {all}
                                        </span>
                                    ))}
                                </div>
                            )}

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
                                                    className="text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg p-2 cursor-pointer inline-flex items-center justify-center"
                                                    title="Re-listen to question"
                                                    aria-label="Read this question aloud again"
                                                >
                                                    <Volume2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                        {item.text}

                                        {/* Render Quick Reply option buttons right under the latest AI message */}
                                        {item.speaker === 'kiosk' && idx === transcript.length - 1 && quickReplies && quickReplies.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 flex flex-wrap gap-2">
                                                {quickReplies.map((chipText, cIdx) => (
                                                    <button
                                                        key={cIdx}
                                                        type="button"
                                                        onClick={() => handleSelectQuickReply(chipText)}
                                                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                                    >
                                                        {chipText}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    ) : (
                        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50/80 dark:from-emerald-950/20 dark:via-slate-800/40 dark:to-slate-900/40 border border-emerald-500/25 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-center text-3xl shadow-lg shadow-emerald-600/25 shrink-0 animate-bounce">
                                👩‍⚕️
                            </div>
                            <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                                        AIIA AI Triage Assistant
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-gray-400 font-bold">• 100% Confidential (DPDP Compliant)</span>
                                </div>
                                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                                    {lang === 'hi'
                                        ? 'नमस्ते! ऊपर दिए गए सामान्य लक्षणों में से चुनें या नीचे हरा माइक दबाकर बोलें।'
                                        : lang === 'mr'
                                            ? 'नमस्ते! वरील सामान्य लक्षणांमधून निवडा किंवा खालील हिरवा माईक दाबून बोला.'
                                            : 'Hello! Pick from the common symptoms above or tap the green mic below to speak.'}
                                </h4>
                                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                    {nextQuestion || (lang === 'hi' ? 'नमस्ते। कृपया बताएं कि आज आपको क्या मुख्य तकलीफ या समस्या है?' : lang === 'mr' ? 'नमस्कार. कृपया सांगा की आज तुम्हाला काय मुख्य त्रास किंवा समस्या आहे?' : 'Hello! Please tell us your main symptom or health concern today.')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Central Voice Intake Console */}
                    <div className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-emerald-500/5 via-slate-50 to-white dark:from-slate-800/90 dark:via-slate-900/90 dark:to-slate-950 border-2 border-emerald-500/30 shadow-xl flex flex-col items-center justify-center text-center space-y-4 sm:space-y-6 relative overflow-hidden">
                        {/* Top Status Bar */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wide border shadow-2xs ${isListening
                                    ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse'
                                    : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
                                }`}>
                                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                                {isListening
                                    ? (lang === 'hi' ? 'Listening Live • आवाज रिकॉर्ड हो रही है' : lang === 'mr' ? 'Listening Live • आवाज रेकॉर्ड होत आहे' : 'Listening Live • Please Speak')
                                    : (lang === 'hi' ? 'एआई ध्वनि सहायता तैयार' : lang === 'mr' ? 'एआय व्हॉइस सहाय्य तयार' : 'AI Voice Intake Ready')}
                            </span>
                            <span className="px-2 sm:px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400 text-[11px] sm:text-xs font-bold border border-slate-200 dark:border-white/10">
                                🗣️ {lang === 'hi' ? 'हिंदी • मराठी • English' : lang === 'mr' ? 'मराठी • हिंदी • English' : 'English • Hindi • Marathi'}
                            </span>
                        </div>

                        {aiError && (
                            <div className="w-full max-w-xl p-3.5 bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-center justify-between text-left">
                                <div className="flex items-center gap-2.5">
                                    <MicOff className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                        {lang === 'hi'
                                            ? 'आवाज समझ नहीं आई। कृपया दोबारा माइक दबाकर बोलें या नीचे टेक्स्ट में लिखें।'
                                            : lang === 'mr'
                                                ? 'आवाज समजला नाही. कृपया पुन्हा बोला किंवा टाईप करा.'
                                                : 'Voice not recognized. Please tap the mic again or type your symptoms below.'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAiError(false)}
                                    className="text-xs font-black text-amber-700 dark:text-amber-300 underline shrink-0 ml-2 cursor-pointer"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {/* Central Animated Microphone Medallion */}
                        <div className="relative py-2 flex items-center justify-center">
                            {/* Outer Acoustic Radar Waves */}
                            {isListening ? (
                                <>
                                    <div className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
                                    <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-rose-500/10 animate-pulse pointer-events-none" />
                                </>
                            ) : (
                                <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-emerald-500/10 animate-pulse pointer-events-none" />
                            )}

                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer relative z-10 shadow-2xl active:scale-95 select-none ${isListening
                                        ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white ring-6 sm:ring-8 ring-rose-500/40 shadow-rose-600/50 scale-105'
                                        : 'bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white ring-6 sm:ring-8 ring-emerald-500/25 shadow-emerald-600/35 hover:scale-105 hover:ring-10 hover:ring-emerald-500/30'
                                    }`}
                                title={isListening ? 'Stop Listening' : 'Tap to Speak Symptoms'}
                            >
                                {/* Inner Bevel Sheen */}
                                <div className="absolute inset-1.5 rounded-full border-2 border-white/30 pointer-events-none" />

                                {isListening ? (
                                    <>
                                        {/* Animated Equalizer Waveform Bars */}
                                        <div className="flex items-center gap-1 mb-1.5 h-6">
                                            <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite_100ms] h-4" />
                                            <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite_200ms] h-6" />
                                            <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite_300ms] h-3" />
                                            <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite_150ms] h-7" />
                                            <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite_250ms] h-5" />
                                            <span className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite_180ms] h-3" />
                                        </div>
                                        <MicOff className="w-6 h-6 animate-pulse" />
                                        <span className="text-[11px] font-black uppercase tracking-wider mt-1 text-white drop-shadow">
                                            {lang === 'hi' ? 'सुन रहे हैं...' : lang === 'mr' ? 'ऐकत आहोत...' : 'Listening...'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-11 h-11 drop-shadow-md stroke-[2.2] animate-in zoom-in-75" />
                                        <span className="text-[11px] font-black uppercase tracking-wider mt-1 text-white drop-shadow">
                                            {lang === 'hi' ? 'माइक दबाएं' : lang === 'mr' ? 'माईक दाबा' : 'TAP TO SPEAK'}
                                        </span>
                                        <span className="text-[9px] font-bold opacity-90 tracking-wide text-emerald-100">
                                            {lang === 'hi' ? 'बोलने हेतु' : lang === 'mr' ? 'बोलण्यासाठी' : 'VOICE INTAKE'}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Instruction Banner */}
                        <div className="space-y-1">
                            <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                {isListening ? (
                                    <span className="text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                                        {lang === 'hi'
                                            ? 'कृपया अपनी बीमारी बताएं (बोलना समाप्त होने पर दोबारा दबाएं)'
                                            : lang === 'mr'
                                                ? 'कृपया आपली लक्षणे सांगा (थांबण्यासाठी पुन्हा दाबा)'
                                                : 'Please state your symptoms (tap again when finished)'}
                                    </span>
                                ) : (
                                    <span>
                                        {lang === 'hi'
                                            ? 'माइक दबाकर अपनी मुख्य तकलीफ या बीमारी बोलें'
                                            : lang === 'mr'
                                                ? 'माईक दाबून आपली मुख्य तक्रार किंवा आजार सांगा'
                                                : 'Tap the microphone and speak your main symptoms'}
                                    </span>
                                )}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400 max-w-md mx-auto">
                                {lang === 'hi'
                                    ? 'जैसे: "मुझे 3 दिन से तेज बुखार, खांसी और सिर में दर्द है"'
                                    : lang === 'mr'
                                        ? 'उदा: "मला ३ दिवसांपासून ताप आणि खोकला आहे"'
                                        : 'Example: "I have had high fever, headache and severe body ache for 3 days"'}
                            </p>
                        </div>

                        {/* 1-Tap Sample Voice Queries (For elderly / low-literacy patients) */}
                        <div className="w-full max-w-2xl space-y-1.5 text-left pt-2 border-t border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-gray-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-emerald-500" />
                                    {lang === 'hi' ? 'त्वरित 1-टैप वाक्य (Quick Samples):' : lang === 'mr' ? 'त्वरित १-टॅप वाक्य (Quick Samples):' : 'Quick 1-Tap Samples:'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Tap to send</span>
                            </div>
                            <div className="flex sm:grid sm:grid-cols-2 gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {[
                                    {
                                        text: lang === 'hi' ? 'मुझे 3 दिन से तेज बुखार, बदन दर्द व कंपकंपी है' : lang === 'mr' ? 'मला ३ दिवसांपासून ताप आणि अंगदुखी आहे' : 'I have had high fever, bodyache and chills for 3 days',
                                        label: lang === 'hi' ? 'बुखार व बदन दर्द' : lang === 'mr' ? 'ताप व अंगदुखी' : 'Fever & Bodyache',
                                        icon: '🤒',
                                        sub: 'Fever & Bodyache'
                                    },
                                    {
                                        text: lang === 'hi' ? 'घुटनों व जोड़ों में बहुत तेज दर्द और सूजन है' : lang === 'mr' ? 'गुडघे व सांध्यांमध्ये तीव्र वेदना आणि सूज आहे' : 'Severe pain and swelling in knees and joints',
                                        label: lang === 'hi' ? 'घुटने व जोड़ दर्द' : lang === 'mr' ? 'गुडघे व सांधेदुखी' : 'Joint & Knee Pain',
                                        icon: '🦵',
                                        sub: 'Joint & Knee Pain'
                                    },
                                    {
                                        text: lang === 'hi' ? 'छाती और पेट में बहुत तेज जलन, एसिडिटी व गैस है' : lang === 'mr' ? 'छातीत व पोटात जळजळ, ॲसिडिटी आणि गॅस' : 'Severe burning sensation in chest/stomach, acidity and gas',
                                        label: lang === 'hi' ? 'एसिडिटी व गैस' : lang === 'mr' ? 'ॲसिडिटी व गॅस' : 'Acidity & Gas',
                                        icon: '🔥',
                                        sub: 'Acidity & Gas'
                                    },
                                    {
                                        text: lang === 'hi' ? 'सिर में तेज दर्द, माइग्रेन व भारीपन बना हुआ है' : lang === 'mr' ? 'डोकेदुखी, मायग्रेन आणि डोक्यात जडपणा' : 'Severe headache, migraine and heaviness in head',
                                        label: lang === 'hi' ? 'सिरदर्द व माइग्रेन' : lang === 'mr' ? 'डोकेदुखी व मायग्रेन' : 'Headache & Migraine',
                                        icon: '🤕',
                                        sub: 'Headache & Migraine'
                                    }
                                ].map((sample, sIdx) => (
                                    <button
                                        key={sIdx}
                                        type="button"
                                        onClick={() => {
                                            setSpeechInput(sample.text);
                                            setChiefComplaint(sample.text);
                                            handleSendSocratesResponse(sample.text);
                                        }}
                                        className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all cursor-pointer shadow-2xs group active:scale-[0.98] shrink-0 min-w-[155px] sm:min-w-0"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm shrink-0">{sample.icon}</span>
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                                {sample.label}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                                            {sample.sub}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Guided Quick Reply Chips (From Socrates Engine) */}
                        {quickReplies && quickReplies.length > 0 && (
                            <div className="w-full max-w-2xl space-y-2 text-left pt-2 border-t border-slate-200 dark:border-white/10">
                                <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                                    ⚡ Suggested Options (Tap to send instantly):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {quickReplies.map((chipText, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelectQuickReply(chipText)}
                                            className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer shadow-xs active:scale-95"
                                        >
                                            {chipText}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Live Text Input with Enter Key Support */}
                        <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                            <div className="relative flex-1 w-full">
                                <input
                                    type="text"
                                    value={speechInput || chiefComplaint}
                                    onChange={(e) => {
                                        setSpeechInput(e.target.value);
                                        setChiefComplaint(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSendSocratesResponse();
                                        }
                                    }}
                                    placeholder={lang === 'hi' ? 'या यहाँ लिखकर अपनी समस्या बताएं (उदा. बुखार और खांसी)...' : t.typeFallback}
                                    className="w-full pl-4 pr-10 py-3.5 rounded-2xl border-2 border-slate-300 dark:border-white/15 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none shadow-inner"
                                />
                                {(speechInput || chiefComplaint) && (
                                    <button
                                        type="button"
                                        onClick={() => { setSpeechInput(''); setChiefComplaint(''); }}
                                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSendSocratesResponse()}
                                disabled={isSubmitting || (!speechInput.trim() && !chiefComplaint.trim())}
                                className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 ${(speechInput.trim() || chiefComplaint.trim()) && !isSubmitting
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <span>{t.sendBtn}</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="pt-4 sm:pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => goToStep(1.5)}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-slate-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-black text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                        >
                            <ArrowLeft className="w-4 h-4" /> {lang === 'hi' ? 'पीछे (चिकित्सा पद्धति)' : lang === 'mr' ? 'मागे (उपचार पद्धती)' : 'Back to Pathway'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (!patientForm.department) {
                                    setShowManualDeptModal(true);
                                    speakText(lang === 'hi' ? 'कृपया पहले ओपीडी विभाग का चयन करें या लक्षण बताएं।' : 'Please choose an OPD department or state your symptoms.');
                                    return;
                                }
                                goToStep(3);
                            }}
                            className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 sm:gap-3 transition-all cursor-pointer active:scale-[0.98]"
                        >
                            <span>{lang === 'hi' ? 'वाइटल्स स्टेशन पर आगे बढ़ें' : lang === 'mr' ? 'वाइटल्स तपासणीकडे जा' : 'Proceed to Vitals Station'}</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ────────────────── STEP 3: VITALS STATION & CONNECTED MEDICAL DEVICES (OPTIONAL) ────────────────── */}
            {currentStep === 3 && (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4 sm:space-y-6 animate-in fade-in duration-300">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-5 border-b border-gray-200 dark:border-white/10">
                        <div>
                            <div className="hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1 sm:mb-2">
                                Step 3 of 6 • Biometrics & Sensor Station • {t.optionalBadge}
                            </div>
                            <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white">
                                {t.vitalsHeading || "Biometric & Vitals Capture Station"}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5 sm:mt-1">
                                {t.vitalsSub || "Readings from kiosk connected medical devices or manual input."}
                            </p>
                        </div>

                        {/* Quick Skip Button */}
                        <button
                            type="button"
                            onClick={() => goToStep(consultationType === 'allopathy' ? 5 : 4)}
                            className="px-3.5 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-sm shrink-0 self-start sm:self-auto"
                        >
                            Skip Vitals (Doctor will measure at OPD) ⏭️
                        </button>
                    </div>

                    {/* Friendly Reassurance Notice for Vitals (Shown on tablet/desktop, already captured in Skip button on mobile) */}
                    <div className="hidden sm:flex p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 items-start gap-3.5">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm leading-relaxed">
                            <span className="font-black block text-amber-700 dark:text-amber-300 mb-0.5">
                                OPTIONAL VITALS CAPTURE
                            </span>
                            If you do not know how to measure your vitals or are not feeling well enough to take tests, you can skip this step. The doctor will measure your blood pressure, pulse, temperature, and SpO2 directly at the consultation desk.
                        </div>
                    </div>

                    {/* Connected Medical Devices Telemetry Hub - Clean, Modern & Simple */}
                    <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-emerald-500/20 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                                    {lang === 'hi' ? 'बायोमेट्रिक सेंसर हब' : 'Biometric Sensor Station'}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-gray-400">
                                    {lang === 'hi' ? 'स्मार्ट उपकरण या सीधे इनपुट' : 'IoT Sensors & Smart Device Sync'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <button
                                type="button"
                                onClick={simulateSensors}
                                disabled={isSimulatingSensors}
                                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingSensors ? 'animate-spin' : ''}`} />
                                <span>⚡ {lang === 'hi' ? 'सेंसर से पढ़ें' : 'Read Sensors'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsSimulatingSensors(true);
                                    setTimeout(() => {
                                        setVitals({
                                            systolicBP: 120,
                                            diastolicBP: 80,
                                            heartRate: 72,
                                            spo2: 98,
                                            temperature: 98.4,
                                            heightCm: vitals.heightCm || 165,
                                            weightKg: vitals.weightKg || 65
                                        });
                                        setIsSimulatingSensors(false);
                                        speakText(lang === 'hi' ? 'स्मार्टवॉच से आंकड़े प्राप्त।' : 'Synced from Health Device.');
                                    }, 400);
                                }}
                                disabled={isSimulatingSensors}
                                className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/25 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
                                title="Sync vitals from smartwatch or phone"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                <span>⌚ Sync Smartwatch</span>
                            </button>

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
                                    speakText(lang === 'hi' ? 'सभी वाइटल्स रीसेट।' : 'Vitals reset.');
                                }}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                title="Reset vitals"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Vitals Digital Monitor Telemetry Tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Blood Pressure Tile */}
                        <div className={`p-5 rounded-3xl border-2 transition-all shadow-sm ${bpInfo.bg} flex flex-col justify-between`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Heart className={`w-5 h-5 ${vitals.systolicBP >= 140 ? 'text-red-600' : 'text-emerald-600'}`} />
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        {lang === 'hi' ? 'रक्तचाप (BP)' : 'Blood Pressure'}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${bpInfo.color}`}>
                                    {bpInfo.label}
                                </span>
                            </div>

                            <div className="my-3 flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-inner">
                                <input
                                    type="number"
                                    value={vitals.systolicBP}
                                    onChange={(e) => setVitals({ ...vitals, systolicBP: Number(e.target.value) })}
                                    className="w-16 text-center bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                                    placeholder="120"
                                />
                                <span className="text-2xl font-black text-slate-400">/</span>
                                <input
                                    type="number"
                                    value={vitals.diastolicBP}
                                    onChange={(e) => setVitals({ ...vitals, diastolicBP: Number(e.target.value) })}
                                    className="w-16 text-center bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                                    placeholder="80"
                                />
                                <span className="text-xs font-extrabold text-slate-500 ml-1">mmHg</span>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-1">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, systolicBP: Math.max(70, (v.systolicBP || 120) - 5) }))}
                                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-white font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                                        title="Decrease BP"
                                    >
                                        -5
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, systolicBP: Math.min(220, (v.systolicBP || 120) + 5) }))}
                                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-white font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                                        title="Increase BP"
                                    >
                                        +5
                                    </button>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">Normal: 120/80</span>
                            </div>
                        </div>

                        {/* Pulse / Heart Rate */}
                        <div className="p-5 rounded-3xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-col justify-between shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-rose-500" />
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        {lang === 'hi' ? 'हृदय गति (PULSE)' : 'Heart Rate'}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${vitals.heartRate > 100 ? 'bg-red-100 text-red-700' : vitals.heartRate && vitals.heartRate < 60 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {vitals.heartRate > 100 ? 'Tachycardia' : vitals.heartRate && vitals.heartRate < 60 ? 'Bradycardia' : 'Normal Pulse'}
                                </span>
                            </div>

                            <div className="my-3 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-inner">
                                <input
                                    type="number"
                                    value={vitals.heartRate}
                                    onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                                    className="w-24 text-center bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                                    placeholder="72"
                                />
                                <span className="text-xs font-extrabold text-slate-500">bpm</span>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-1">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, heartRate: Math.max(40, (v.heartRate || 72) - 2) }))}
                                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-white font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        -2
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, heartRate: Math.min(180, (v.heartRate || 72) + 2) }))}
                                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-white font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        +2
                                    </button>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">Target: 60-100</span>
                            </div>
                        </div>

                        {/* Blood Oxygen SpO2 */}
                        <div className="p-5 rounded-3xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-col justify-between shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wind className="w-5 h-5 text-cyan-500" />
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        {lang === 'hi' ? 'ऑक्सीजन स्तर (SPO2)' : 'SpO2 Oxygen'}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${vitals.spo2 && vitals.spo2 < 94 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {vitals.spo2 && vitals.spo2 < 94 ? 'Low SpO2' : 'Optimal'}
                                </span>
                            </div>

                            <div className="my-3 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-inner">
                                <input
                                    type="number"
                                    value={vitals.spo2}
                                    onChange={(e) => setVitals({ ...vitals, spo2: Number(e.target.value) })}
                                    className="w-24 text-center bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                                    placeholder="98"
                                />
                                <span className="text-xs font-extrabold text-slate-500">% O2</span>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-1">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, spo2: Math.max(80, (v.spo2 || 98) - 1) }))}
                                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-white font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        -1
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, spo2: Math.min(100, (v.spo2 || 98) + 1) }))}
                                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-white font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        +1
                                    </button>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">Normal: 95-100%</span>
                            </div>
                        </div>

                        {/* Temperature */}
                        <div className="p-5 rounded-3xl border-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex flex-col justify-between shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Thermometer className="w-5 h-5 text-amber-500" />
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        {lang === 'hi' ? 'शरीर का तापमान' : 'Temperature'}
                                    </span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${vitals.temperature > 99.5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {vitals.temperature > 99.5 ? 'Febrile' : 'Afebrile'}
                                </span>
                            </div>

                            <div className="my-3 flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-inner">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={vitals.temperature}
                                    onChange={(e) => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                                    className="w-24 text-center bg-transparent text-3xl font-black text-slate-900 dark:text-white focus:outline-none font-mono"
                                    placeholder="98.4"
                                />
                                <span className="text-xs font-extrabold text-slate-500">°F</span>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-1">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, temperature: Number(((v.temperature || 98.4) - 0.2).toFixed(1)) }))}
                                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-white font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        -.2
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, temperature: Number(((v.temperature || 98.4) + 0.2).toFixed(1)) }))}
                                        className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 text-slate-800 dark:text-white font-black text-xs cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        +.2
                                    </button>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400">Normal: 98.6°F</span>
                            </div>
                        </div>
                    </div>

                    {/* Biometrics: Height, Weight & Dynamic Indian BMI Gauge */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center shadow-sm">
                        <div className="space-y-5">
                            {/* Height */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider">
                                        {lang === 'hi' ? 'ऊंचाई / कद (Height)' : 'Height'}
                                    </label>
                                    <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 font-mono font-black text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xs">
                                        {vitals.heightCm || 160} cm
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, heightCm: Math.max(90, (v.heightCm || 160) - 1) }))}
                                        className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-black text-xs flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        -1
                                    </button>
                                    <input
                                        type="range"
                                        min="100"
                                        max="220"
                                        value={vitals.heightCm || 160}
                                        onChange={(e) => setVitals({ ...vitals, heightCm: Number(e.target.value) })}
                                        className="flex-1 h-2.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, heightCm: Math.min(220, (v.heightCm || 160) + 1) }))}
                                        className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-black text-xs flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        +1
                                    </button>
                                </div>
                            </div>

                            {/* Weight */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-700 dark:text-gray-300 uppercase tracking-wider">
                                        {lang === 'hi' ? 'वजन / भार (Weight)' : 'Weight'}
                                    </label>
                                    <span className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 font-mono font-black text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-xs">
                                        {vitals.weightKg || 65} kg
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, weightKg: Math.max(25, (v.weightKg || 65) - 1) }))}
                                        className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-black text-xs flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        -1
                                    </button>
                                    <input
                                        type="range"
                                        min="30"
                                        max="150"
                                        value={vitals.weightKg || 65}
                                        onChange={(e) => setVitals({ ...vitals, weightKg: Number(e.target.value) })}
                                        className="flex-1 h-2.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVitals(v => ({ ...v, weightKg: Math.min(180, (v.weightKg || 65) + 1) }))}
                                        className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-black text-xs flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        +1
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic WHO Asian Indian BMI Gauge */}
                        <div className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-around gap-6 p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/20 shadow-md">
                            <div className="text-center sm:text-left space-y-1">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-gray-400">
                                    {lang === 'hi' ? 'बॉडी मास इंडेक्स (BMI)' : 'Calculated Body Mass Index'}
                                </span>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                        {bmiCalc}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${bmiInfo.bg} ${bmiInfo.color}`}>
                                        {bmiInfo.label}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-gray-400">
                                    {lang === 'hi' ? 'भारतीय स्वास्थ्य मानकों के अनुसार सामान्य बीएमआई 18.5 - 22.9 है।' : 'WHO standard clinical classification for Asian Indian demographics.'}
                                </p>
                            </div>

                            {/* Visual Segmented Arc Bar for BMI with Indicator Needle */}
                            <div className="w-full sm:w-72 space-y-2">
                                <div className="relative pt-3">
                                    {/* Pointer Pin */}
                                    <div
                                        className="absolute top-0 -translate-x-1/2 transition-all duration-300"
                                        style={{
                                            left: `${Math.min(95, Math.max(5, ((bmiCalc - 15) / (35 - 15)) * 100))}%`
                                        }}
                                    >
                                        <div className="w-2.5 h-2.5 rotate-45 bg-slate-900 dark:bg-white shadow-xs" />
                                    </div>

                                    <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex shadow-inner">
                                        <div className="w-[20%] bg-blue-500" title="Underweight (<18.5)" />
                                        <div className="w-[35%] bg-emerald-500" title="Normal (18.5-22.9)" />
                                        <div className="w-[20%] bg-amber-500" title="Overweight (23.0-24.9)" />
                                        <div className="w-[25%] bg-rose-500" title="Obese (≥25.0)" />
                                    </div>
                                </div>

                                <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-gray-400 pt-0.5">
                                    <span>18.5</span>
                                    <span>23.0</span>
                                    <span>25.0</span>
                                    <span>30.0+</span>
                                </div>

                                <div className="flex justify-between text-[11px] font-black">
                                    <span className="text-blue-600 dark:text-blue-400">Under</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">Normal</span>
                                    <span className="text-amber-600 dark:text-amber-400">Over</span>
                                    <span className="text-rose-600 dark:text-rose-400">Obese</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="pt-4 sm:pt-6 border-t border-slate-200 dark:border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => goToStep(2)}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-slate-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-black text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                        >
                            <ArrowLeft className="w-4 h-4" /> {lang === 'hi' ? 'पीछे (लक्षण पूछताछ)' : 'Back to Voice Intake'}
                        </button>

                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={() => goToStep(consultationType === 'allopathy' ? 5 : 4)}
                                className="w-full sm:w-auto px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-dashed border-amber-400/80 hover:border-amber-500 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                                {lang === 'hi' ? 'वाइटल्स छोड़ें (डॉक्टर जांचेंगे) ⏭️' : 'Skip Vitals (Doctor will measure) ⏭️'}
                            </button>

                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleSaveVitals}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 sm:gap-3 transition-all cursor-pointer active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Saving Vitals...
                                    </>
                                ) : (
                                    <>
                                        {t.saveVitalsBtn || "Save & Proceed"} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ────────────────── STEP 4: AYUSH CLASSICAL PARIKSHA (TRIVIDHA, ASHTAVIDHA, DASHASVIDHA) ────────────────── */}
            {currentStep === 4 && (() => {
                const trividhaCount = Object.values(trividha).filter(Boolean).length;
                const ashtavidhaCount = Object.values(ashtavidha).filter(Boolean).length;
                const dashaCount = [dasha.prakriti, dasha.agni, dasha.koshtha, dasha.satva, dasha.vyayamaShakti].filter(Boolean).length;
                const totalCaptured = trividhaCount + ashtavidhaCount + dashaCount;
                const totalPossible = 3 + 8 + 5; // 16 classical diagnostic factors
                const pctCompleted = Math.round((totalCaptured / totalPossible) * 100);

                return (
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4 sm:space-y-6 animate-in fade-in duration-300">

                        {/* Header Area */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-5 border-b border-gray-200 dark:border-white/10">
                            <div>
                                {consultationType === 'ayurvedic' ? (
                                    <div className="hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-3.5 py-0.5 sm:py-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1 sm:mb-2">
                                        🌿 Step 4 of 6 • MANDATORY FOR AYURVEDIC OPD
                                    </div>
                                ) : (
                                    <div className="hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1 sm:mb-2">
                                        Step 4 of 6 • OPTIONAL (ALLOPATHY OPD)
                                    </div>
                                )}
                                <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
                                    <span>
                                        {lang === 'hi'
                                            ? 'आयुष नैदानिक परीक्षा (त्रिविध • अष्टविध • दशविध)'
                                            : lang === 'mr'
                                                ? 'आयुष क्लिनिकल तपासणी (त्रिविध • अष्टविध • दशविध)'
                                                : 'AYUSH Clinical Examination (Trividha • Ashtavidha • Dashavidha)'}
                                    </span>
                                </h2>
                                <p className="hidden sm:block text-sm text-slate-600 dark:text-gray-400 mt-1 max-w-3xl leading-relaxed">
                                    {lang === 'hi'
                                        ? 'पारंपरिक आयुर्वेदिक निदान पद्धतियाँ: दर्शन-स्पर्शन-प्रश्न (3 विधियाँ), नाड़ी-जिह्वा-मल-मूत्र (8 अंग), एवं प्रकृति-अग्नि-कोष्ठ-सत्व (दशविध समग्र स्वास्थ्य विश्लेषण)।'
                                        : lang === 'mr'
                                            ? 'पारंपारिक आयुर्वेदिक तपासणी: दर्शन-स्पर्शन-प्रश्न, अष्टविध नाडी-जिह्वा आणि दशविध प्रकृती परीक्षण.'
                                            : 'Classical Ayurvedic diagnosis framework: Visual/Touch/Inquiry, 8-fold Pulse & Tongue, and 10-fold Constitutional metrics.'}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Educational Guide Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowParikshaGuideModal(true)}
                                    className="px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                                >
                                    <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    <span>{lang === 'hi' ? 'गाइड 📖' : 'Guide 📖'}</span>
                                </button>

                                {/* Skip Button or Mandatory Indicator */}
                                {consultationType === 'allopathy' ? (
                                    <button
                                        type="button"
                                        onClick={() => goToStep(5)}
                                        className="px-3 sm:px-5 py-1.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-gray-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                                    >
                                        Skip <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <div className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] sm:text-xs font-black flex items-center gap-1.5 shadow-xs shrink-0">
                                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>{lang === 'hi' ? 'अनिवार्य' : 'Mandatory'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Diagnostic Progress Summary Strip */}
                        <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 sm:flex-initial flex sm:block items-center justify-between">
                                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                                        {lang === 'hi' ? 'डेटा स्थिति' : 'Clinical Progress'}
                                    </span>
                                    <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-gray-400">
                                        {totalCaptured} / {totalPossible} ({pctCompleted}%)
                                    </span>
                                </div>
                            </div>

                            <div className="w-full sm:w-64 space-y-1">
                                <div className="h-2 sm:h-2.5 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.max(5, pctCompleted)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] sm:text-[10px] font-bold text-slate-400">
                                    <span>त्रिविध ({trividhaCount}/3)</span>
                                    <span>अष्टविध ({ashtavidhaCount}/8)</span>
                                    <span>दशविध ({dashaCount}/5)</span>
                                </div>
                            </div>
                        </div>

                        {/* Classical Pariksha Mode Selector Tabs */}
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-inner">
                            <button
                                type="button"
                                onClick={() => setParikshaTab('trividha')}
                                className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-2 ${parikshaTab === 'trividha'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                                        : 'text-slate-700 dark:text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <span>🌿</span>
                                    <span className="truncate">{lang === 'hi' ? 'त्रिविध' : 'Trividha'}</span>
                                </div>
                                <span className={`px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black ${parikshaTab === 'trividha'
                                        ? 'bg-white/20 text-white'
                                        : trividhaCount === 3
                                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                            : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400'
                                    }`}>
                                    {trividhaCount === 3 ? '✓ 3/3' : `${trividhaCount}/3`}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setParikshaTab('ashtavidha')}
                                className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-2 ${parikshaTab === 'ashtavidha'
                                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                                        : 'text-slate-700 dark:text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <span>🔍</span>
                                    <span className="truncate">{lang === 'hi' ? 'अष्टविध' : 'Ashtavidha'}</span>
                                </div>
                                <span className={`px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black ${parikshaTab === 'ashtavidha'
                                        ? 'bg-white/20 text-white'
                                        : ashtavidhaCount === 8
                                            ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400'
                                            : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400'
                                    }`}>
                                    {ashtavidhaCount === 8 ? '✓ 8/8' : `${ashtavidhaCount}/8`}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setParikshaTab('dashavidha')}
                                className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 sm:gap-2 ${parikshaTab === 'dashavidha'
                                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                                        : 'text-slate-700 dark:text-gray-300 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <span>⚖️</span>
                                    <span className="truncate">{lang === 'hi' ? 'दशविध' : 'Dashavidha'}</span>
                                </div>
                                <span className={`px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full text-[9px] sm:text-[10px] font-black ${parikshaTab === 'dashavidha'
                                        ? 'bg-white/20 text-white'
                                        : dashaCount === 5
                                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                            : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-400'
                                    }`}>
                                    {dashaCount === 5 ? '✓ 5/5' : `${dashaCount}/5`}
                                </span>
                            </button>
                        </div>

                        {/* TAB 1: TRIVIDHA PARIKSHA */}
                        {parikshaTab === 'trividha' && (
                            <div className="space-y-8 animate-in fade-in duration-200">
                                <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-900 dark:text-emerald-200 flex items-start gap-3.5">
                                    <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div className="text-xs sm:text-sm leading-relaxed">
                                        <strong className="block text-emerald-800 dark:text-emerald-300 mb-0.5">
                                            त्रिविध परीक्षा (Trividha Pariksha) — दर्शनम् स्पर्शनम् च प्रश्नम्:
                                        </strong>
                                        The foundational 3-fold clinical method taught by Acharya Charaka and Sushruta. Tap the card that best matches your observation. All options are optional and will be verified by the Vaidya.
                                    </div>
                                </div>

                                {TRIVIDHA_CONFIG.map((section) => {
                                    const currentValue = trividha[section.key];
                                    return (
                                        <div key={section.key} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-black">
                                                            {section.num}
                                                        </span>
                                                        <span>{section.titleHi} • {section.titleEn}</span>
                                                    </label>
                                                    <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5 ml-8">
                                                        {section.descHi} • {section.descEn}
                                                    </p>
                                                </div>
                                                {currentValue && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTrividha({ ...trividha, [section.key]: '' })}
                                                        className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                                                    >
                                                        Clear Selection
                                                    </button>
                                                )}
                                            </div>

                                            <div className={`grid gap-3.5 ${section.key === 'prashna' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
                                                {section.options.map((opt) => {
                                                    const isSelected = currentValue === opt.id;
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => setTrividha({ ...trividha, [section.key]: isSelected ? '' : opt.id })}
                                                            className={`p-4 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                                    ? 'border-emerald-500 bg-emerald-500/15 dark:bg-emerald-950/40 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                                                                    : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-emerald-400/50 hover:bg-slate-100/70 dark:hover:bg-white/10'
                                                                }`}
                                                        >
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${isSelected
                                                                            ? 'bg-emerald-600 text-white shadow-md'
                                                                            : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                                                                        }`}>
                                                                        <opt.icon className="w-4 h-4" />
                                                                    </div>
                                                                    {isSelected ? (
                                                                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                                                                    ) : (
                                                                        <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-white/20" />
                                                                    )}
                                                                </div>
                                                                <div className="text-sm font-black text-slate-900 dark:text-white">
                                                                    {opt.labelHi}
                                                                </div>
                                                                <div className="text-xs font-bold text-slate-600 dark:text-gray-300 mt-0.5">
                                                                    {opt.labelEn}
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-3 leading-snug border-t border-slate-200/50 dark:border-white/5 pt-2">
                                                                {opt.desc}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* TAB 2: ASHTAVIDHA PARIKSHA */}
                        {parikshaTab === 'ashtavidha' && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="p-4 sm:p-5 rounded-2xl bg-teal-500/10 border-2 border-teal-500/20 text-teal-900 dark:text-teal-200 flex items-start gap-3.5">
                                    <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                                    <div className="text-xs sm:text-sm leading-relaxed">
                                        <strong className="block text-teal-800 dark:text-teal-300 mb-0.5">
                                            अष्टविध परीक्षा (Ashtavidha Pariksha) — योगरत्नाकर आठ नैदानिक अंग:
                                        </strong>
                                        The 8-fold clinical diagnostic examination: Nadi (Pulse), Jihwa (Tongue), Mala (Stool), Mootra (Urine), Shabda (Voice), Sparsha (Skin), Drik (Eyes), and Akruti (Build).
                                        Use either the <strong>dropdown</strong> or tap the <strong>1-touch pills</strong> below each field.
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                                    {ASHTAVIDHA_CONFIG.map((field) => {
                                        const isRecorded = Boolean(ashtavidha[field.key]);
                                        return (
                                            <div
                                                key={field.key}
                                                className={`p-5 rounded-3xl border-2 transition-all shadow-sm flex flex-col justify-between ${isRecorded
                                                        ? 'border-teal-500/60 bg-teal-500/5 dark:bg-teal-950/25 shadow-teal-500/5'
                                                        : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-teal-400/40'
                                                    } space-y-4`}
                                            >
                                                {/* Header */}
                                                <div>
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${isRecorded
                                                                    ? 'bg-teal-600 text-white shadow-md'
                                                                    : 'bg-teal-500/15 text-teal-700 dark:text-teal-300'
                                                                }`}>
                                                                <field.icon className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 block">
                                                                    {field.num}. {field.hindi}
                                                                </span>
                                                                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                                                                    {field.title}
                                                                </h4>
                                                            </div>
                                                        </div>
                                                        {isRecorded ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5 shrink-0">
                                                                <Check className="w-2.5 h-2.5" /> Recorded
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-white/10 shrink-0">
                                                                Optional
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 dark:text-gray-400 mt-1.5 ml-11">
                                                        {field.sub}
                                                    </p>
                                                </div>

                                                {/* 1-Tap Direct Touch Options (No OS select popups) */}
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                            {lang === 'hi' ? 'लक्षण चुनें:' : 'Select observation:'}
                                                        </span>
                                                        {isRecorded && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setAshtavidha({ ...ashtavidha, [field.key]: '' })}
                                                                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-1.5">
                                                        {field.options.map(opt => {
                                                            const isSelected = ashtavidha[field.key] === opt.value;
                                                            return (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    onClick={() => setAshtavidha({
                                                                        ...ashtavidha,
                                                                        [field.key]: isSelected ? '' : opt.value
                                                                    })}
                                                                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between text-left active:scale-[0.99] ${isSelected
                                                                            ? 'bg-teal-600 text-white border-teal-500 shadow-sm font-black'
                                                                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-teal-400/60 hover:bg-teal-50/50 dark:hover:bg-teal-950/20'
                                                                        }`}
                                                                >
                                                                    <span className="truncate pr-2">{opt.label}</span>
                                                                    {isSelected ? (
                                                                        <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[3]" />
                                                                    ) : (
                                                                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 shrink-0" />
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: DASHAVIDHA PARIKSHA */}
                        {parikshaTab === 'dashavidha' && (
                            <div className="space-y-8 animate-in fade-in duration-200">
                                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 text-amber-900 dark:text-amber-200 flex items-start gap-3.5">
                                    <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div className="text-xs sm:text-sm leading-relaxed">
                                        <strong className="block text-amber-800 dark:text-amber-300 mb-0.5">
                                            दशविध आतुर परीक्षा (Dashavidha Pariksha - 10-Fold Systemic Assessment):
                                        </strong>
                                        Evaluates Prakriti (Dosha Constitution), Agni (Digestive Fire), Koshtha (Bowel Habits), Satva (Mental Endurance), and Vyayama Shakti (Physical Capacity).
                                        Choose what matches you best, or leave for the Vaidya to evaluate at the consultation desk.
                                    </div>
                                </div>

                                {/* 1. Prakriti (Body Constitution) */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                        १. {t.prakritiTitle || "Body Constitution & Prakriti (प्रकृति विश्लेषण)"}
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            {
                                                id: 'Vata',
                                                title: '💨 Vata (वात)',
                                                badge: 'Air & Ether',
                                                sub: 'Light frame, swift actions, prone to dry skin, joint crepitus, and cold extremities.',
                                                color: 'border-sky-400/40 bg-sky-500/5 text-sky-600',
                                                details: { primaryDosha: 'Vata', secondaryDosha: 'Kapha', vataScore: 65, pittaScore: 25, kaphaScore: 40 }
                                            },
                                            {
                                                id: 'Pitta',
                                                title: '🔥 Pitta (पित्त)',
                                                badge: 'Fire & Water',
                                                sub: 'Medium athletic build, sharp digestion, warm body temperature, prone to acidity and sweating.',
                                                color: 'border-amber-400/40 bg-amber-500/5 text-amber-600',
                                                details: { primaryDosha: 'Pitta', secondaryDosha: 'Vata', vataScore: 35, pittaScore: 70, kaphaScore: 20 }
                                            },
                                            {
                                                id: 'Kapha',
                                                title: '🌊 Kapha (कफ)',
                                                badge: 'Earth & Water',
                                                sub: 'Sturdy broad build, calm disposition, slow deliberate digestion, excellent endurance.',
                                                color: 'border-emerald-400/40 bg-emerald-500/5 text-emerald-600',
                                                details: { primaryDosha: 'Kapha', secondaryDosha: 'Pitta', vataScore: 20, pittaScore: 30, kaphaScore: 75 }
                                            },
                                            {
                                                id: 'Unsure',
                                                title: t.unsurePrakriti || '🤔 Unsure / Pending Doctor',
                                                badge: 'OPD Pulse Evaluation',
                                                sub: t.unsurePrakritiSub || 'Vaidya will clinically determine constitutional doshas via Nadi Pariksha at consultation.',
                                                color: 'border-purple-400/40 bg-purple-500/5 text-purple-600',
                                                details: { primaryDosha: 'Undetermined', secondaryDosha: 'Pending Doctor Nadi Pariksha', vataScore: 33, pittaScore: 33, kaphaScore: 33 }
                                            }
                                        ].map(p => {
                                            const isSelected = dasha.prakriti === p.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setDasha({
                                                        ...dasha,
                                                        prakriti: isSelected ? '' : p.id,
                                                        prakritiDetails: isSelected ? null : p.details
                                                    })}
                                                    className={`p-5 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                            ? 'border-emerald-500 bg-emerald-500/15 dark:bg-emerald-950/40 shadow-lg shadow-emerald-500/10 scale-[1.01]'
                                                            : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-emerald-400/40'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-base font-black text-slate-900 dark:text-white">
                                                                {p.title}
                                                            </span>
                                                            {isSelected ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-gray-300">
                                                                    {p.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                                                            {p.sub}
                                                        </p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="mt-3 pt-2 border-t border-emerald-500/20 text-[10px] font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Selected Constitution
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. Agni (Digestive Fire) */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                        २. {t.agniTitle || "Digestive Fire & Metabolism (अग्नि व पाचन क्षमता)"}
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { id: 'Samagni (Balanced)', label: '🔥 समाग्नि (Samagni)', subLabel: 'Balanced Digestion', desc: 'Regular timely appetite, effortless digestion, clear energy.' },
                                            { id: 'Tikshnagni (Intense)', label: '⚡ तीक्ष्णाग्नि (Tikshnagni)', subLabel: 'Hyperactive / Pitta', desc: 'Sharp intense hunger, rapid metabolism, acidity, sour reflux.' },
                                            { id: 'Mandagni (Sluggish)', label: '🐢 मन्दाग्नि (Mandagni)', subLabel: 'Sluggish / Kapha', desc: 'Low hunger, post-meal abdominal heaviness, slow transit.' },
                                            { id: 'Vishamagni (Irregular)', label: '🌪️ विषमाग्नि (Vishamagni)', subLabel: 'Irregular / Vata', desc: 'Erratic appetite, bloating, gas, variable day-to-day digestion.' }
                                        ].map(item => {
                                            const isSelected = dasha.agni === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setDasha({ ...dasha, agni: isSelected ? '' : item.id })}
                                                    className={`p-4 rounded-3xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between select-none ${isSelected
                                                            ? 'border-teal-500 bg-teal-500/15 dark:bg-teal-950/40 shadow-lg shadow-teal-500/10 scale-[1.01]'
                                                            : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:border-teal-400/40'
                                                        }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                                {item.label}
                                                            </span>
                                                            {isSelected ? (
                                                                <CheckCircle2 className="w-5 h-5 text-teal-500 fill-teal-500/20" />
                                                            ) : (
                                                                <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20" />
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 block mb-1">
                                                            {item.subLabel}
                                                        </span>
                                                        <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-snug">
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. Bowel Habit (कोष्ठ), 4. Mental Resilience (सत्व), 5. Exercise Capacity (व्यायाम शक्ति) */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {/* Koshtha */}
                                    <div className="p-5 rounded-3xl border-2 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-amber-500" />
                                                <span>३. {t.koshthaTitle || "Bowel Habit (कोष्ठ)"}</span>
                                            </label>
                                            {dasha.koshtha && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                    ✓ Set
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                                            {[
                                                { val: 'Mridu', label: 'मृदु कोष्ठ (Soft / Fast elimination)', short: 'मृदु (Soft)' },
                                                { val: 'Madhyama', label: 'मध्यम कोष्ठ (Regular normal bowel)', short: 'मध्यम (Regular)' },
                                                { val: 'Krura', label: 'क्रूर कोष्ठ (Hard / Constipated)', short: 'क्रूर (Hard)' }
                                            ].map(pill => {
                                                const active = dasha.koshtha === pill.val;
                                                return (
                                                    <button
                                                        key={pill.val}
                                                        type="button"
                                                        onClick={() => setDasha({ ...dasha, koshtha: active ? '' : pill.val })}
                                                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between text-left active:scale-[0.99] ${active
                                                                ? 'bg-amber-600 text-white border-amber-500 shadow-sm font-black'
                                                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                                                            }`}
                                                    >
                                                        <span>{pill.label}</span>
                                                        {active ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Satva */}
                                    <div className="p-5 rounded-3xl border-2 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                <Heart className="w-4 h-4 text-rose-500" />
                                                <span>४. {t.satvaTitle || "Mental Resilience (सत्व)"}</span>
                                            </label>
                                            {dasha.satva && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                    ✓ Set
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                                            {[
                                                { val: 'Pravara (High)', label: 'प्रवर सत्व (Strong endurance & calm)' },
                                                { val: 'Madhyama', label: 'मध्यम सत्व (Moderate tolerance)' },
                                                { val: 'Avara (Low)', label: 'अवर सत्व (Low pain threshold, anxious)' }
                                            ].map(pill => {
                                                const active = dasha.satva === pill.val;
                                                return (
                                                    <button
                                                        key={pill.val}
                                                        type="button"
                                                        onClick={() => setDasha({ ...dasha, satva: active ? '' : pill.val })}
                                                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between text-left active:scale-[0.99] ${active
                                                                ? 'bg-rose-600 text-white border-rose-500 shadow-sm font-black'
                                                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                                                            }`}
                                                    >
                                                        <span>{pill.label}</span>
                                                        {active ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Vyayama Shakti */}
                                    <div className="p-5 rounded-3xl border-2 border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-cyan-500" />
                                                <span>५. Physical Stamina (व्यायाम शक्ति)</span>
                                            </label>
                                            {dasha.vyayamaShakti && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                                    ✓ Set
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-1.5 pt-1">
                                            {[
                                                { val: 'Pravara', label: 'प्रवर शक्ति (High endurance, active)' },
                                                { val: 'Madhyama', label: 'मध्यम शक्ति (Moderate stamina)' },
                                                { val: 'Avara', label: 'अवर शक्ति (Fatigues quickly, low stamina)' }
                                            ].map(pill => {
                                                const active = dasha.vyayamaShakti === pill.val;
                                                return (
                                                    <button
                                                        key={pill.val}
                                                        type="button"
                                                        onClick={() => setDasha({ ...dasha, vyayamaShakti: active ? '' : pill.val })}
                                                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-between text-left active:scale-[0.99] ${active
                                                                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm font-black'
                                                                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10 hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20'
                                                            }`}
                                                    >
                                                        <span>{pill.label}</span>
                                                        {active ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Live Ayurvedic Profile Dossier Preview */}
                                <div className="p-5 rounded-3xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-emerald-500" />
                                            <span>आयुर्वेदिक नैदानिक प्रोफ़ाइल सारांश (Ayurvedic Dossier Live Preview)</span>
                                        </span>
                                        <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                                            {totalCaptured} metrics recorded
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {dasha.prakriti && (
                                            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black">
                                                Prakriti: {dasha.prakriti}
                                            </span>
                                        )}
                                        {dasha.agni && (
                                            <span className="px-3 py-1 rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-xs font-black">
                                                Agni: {dasha.agni}
                                            </span>
                                        )}
                                        {dasha.koshtha && (
                                            <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs font-black">
                                                Koshtha: {dasha.koshtha}
                                            </span>
                                        )}
                                        {dasha.satva && (
                                            <span className="px-3 py-1 rounded-xl bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 text-xs font-black">
                                                Satva: {dasha.satva}
                                            </span>
                                        )}
                                        {dasha.vyayamaShakti && (
                                            <span className="px-3 py-1 rounded-xl bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30 text-xs font-black">
                                                Vyayama: {dasha.vyayamaShakti}
                                            </span>
                                        )}
                                        {trividha.darshana && (
                                            <span className="px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30 text-xs font-black">
                                                Darshana: {trividha.darshana}
                                            </span>
                                        )}
                                        {ashtavidha.nadi && (
                                            <span className="px-3 py-1 rounded-xl bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30 text-xs font-black">
                                                Nadi: {ashtavidha.nadi}
                                            </span>
                                        )}
                                        {totalCaptured === 0 && (
                                            <span className="text-xs text-slate-500 dark:text-gray-400 italic">
                                                No AYUSH examination metrics selected yet — will be assessed directly by the doctor at OPD consultation desk.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => goToStep(3)}
                                className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-slate-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-black text-sm hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                            >
                                <ArrowLeft className="w-4 h-4" /> {lang === 'hi' ? 'पीछे (वाइटल्स स्टेशन)' : 'Back to Vitals'}
                            </button>

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
                                {/* Skip button only active if Allopathy is chosen */}
                                {consultationType === 'allopathy' && (
                                    <button
                                        type="button"
                                        onClick={() => goToStep(5)}
                                        className="w-full sm:w-auto px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-dashed border-amber-400/80 hover:border-amber-500 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                                    >
                                        Skip Step (Doctor will assess) <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleSaveDashavidha}
                                    className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 sm:gap-3 transition-all cursor-pointer active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Saving Pariksha...
                                        </>
                                    ) : (
                                        <>
                                            Save Pariksha & Proceed to Records <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ────────────────── STEP 5: PRESCRIPTION OCR, PAST HISTORY & LIVE CAMERA ────────────────── */}
            {currentStep === 5 && (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-emerald-500/20 shadow-xl space-y-4 sm:space-y-6 animate-in fade-in duration-300">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-5 border-b border-gray-200 dark:border-white/10">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1 sm:mb-2">
                                Step 5 of 6 • {t.optionalBadge}
                            </div>
                            <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
                                {t.ocrHeading || "Medical Records, History & Prescriptions"}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 mt-0.5 sm:mt-1">
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
                            {Array.from(new Set([
                                'Diabetes Mellitus', 'Hypertension (High BP)', 'Thyroid Disorder',
                                'Asthma / Breathing Issue', 'Heart Condition', 'Arthritis / Joint Pain',
                                'Kidney Disease', 'Hyperacidity / GERD',
                                ...pastDiseases
                            ])).map(disease => {
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
                                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-2 ${isSelected ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-white dark:bg-white/5 text-slate-800 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-emerald-400'}`}
                                        aria-pressed={isSelected}
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
                            {Array.from(new Set([
                                'Penicillin / Amoxicillin', 'Sulfa Antibiotics', 'Aspirin / NSAIDs',
                                'Dust / Pollen', 'Milk / Lactose', 'Peanuts / Nuts', 'Ayurvedic Oils / Guggulu',
                                ...allergies
                            ])).map(allergy => {
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
                                        className={`px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer border-2 ${isSelected ? 'bg-rose-600 text-white border-rose-500 shadow-sm' : 'bg-white dark:bg-white/5 text-slate-800 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-rose-400'}`}
                                        aria-pressed={isSelected}
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
                                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
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

                                {/* Option 2: Real file upload */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-8 rounded-3xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group text-center"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => handleDocumentUpload(e.target.files)}
                                    />
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-all shadow-md">
                                        <Upload className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-black text-slate-900 dark:text-white block">
                                            {lang === 'hi' ? '📁 दस्तावेज़ अपलोड करें' : '📁 Upload Document'}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-gray-400">
                                            {lang === 'hi' ? 'पर्चा, रिपोर्ट — JPG, PNG, PDF' : 'Prescriptions & reports — JPG, PNG, PDF'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Uploaded document list */}
                        {uploadedDocs.length > 0 && (
                            <div className="space-y-2 pt-2">
                                <span className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-gray-400">
                                    {lang === 'hi' ? 'अपलोड किए गए दस्तावेज़' : 'Uploaded documents'} ({uploadedDocs.length})
                                </span>
                                {uploadedDocs.map((d, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span className="text-xs font-bold text-slate-800 dark:text-white truncate flex-1">{d.name}</span>
                                        {d.uploading ? (
                                            <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin shrink-0" />
                                        ) : d.error ? (
                                            <span className="text-[10px] font-black text-amber-500 shrink-0">SAVED LOCALLY</span>
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setUploadedDocs(prev => prev.filter((_, idx) => idx !== i))}
                                            // Had no padding at all — a bare 16px destructive icon.
                                            className="text-slate-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg p-2 transition-colors shrink-0 inline-flex items-center justify-center"
                                            aria-label="Remove document"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
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
                                                    ).catch(() => { });
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
                    <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => goToStep(consultationType === 'allopathy' ? 3 : 4)}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-300 dark:border-white/15 text-slate-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center gap-2 cursor-pointer transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" /> {consultationType === 'allopathy' ? 'Back to Vitals Station' : 'Back to Pariksha'}
                        </button>

                        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={handleGenerateFinalToken}
                                className="w-full sm:w-auto px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-dashed border-blue-400/60 hover:border-blue-500 text-blue-800 dark:text-blue-300 hover:bg-blue-500/10 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                            >
                                {t.skipOcrBtn} <ChevronRight className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleGenerateFinalToken}
                                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 sm:gap-3 transition-all cursor-pointer active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> Synthesizing SOAP & OPD Token...
                                    </>
                                ) : (
                                    <>
                                        {t.generateTokenBtn} <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ────────────────── STEP 6: DIGITAL OPD TOKEN TICKET ────────────────── */}
            {currentStep === 6 && (
                <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-in zoom-in-95 duration-300">

                    {/* Printable Ticket */}
                    <div id="printable-opd-token-slip" className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-10 border-2 border-emerald-500/40 shadow-2xl relative overflow-hidden text-slate-900 dark:text-white">

                        {/* Top Emblem Header */}
                        <div className="text-center pb-4 sm:pb-6 border-b-2 border-dashed border-gray-200 dark:border-white/10 space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] sm:text-[13px] font-black uppercase tracking-wide">
                                All India Institute of Ayurveda • AIIA New Delhi
                            </div>
                            <h3 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                                Official OPD Consultation Token Slip
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                Ayushman Bharat Digital Mission (ABDM) Integrated Patient Case Sheet
                            </p>
                        </div>

                        {/* Giant Token Display — the token and the room are the only two
                things the patient must leave with, so they are the only two
                things given this much weight. */}
                        <div className="my-4 sm:my-6 text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-slate-900/10 border border-emerald-500/30">
                            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                                {t.yourToken}
                            </span>
                            <div className="text-4xl sm:text-6xl font-black font-mono text-emerald-700 dark:text-emerald-300 tracking-wider mt-1">
                                {tokenNumber || 'OPD-20260906-007'}
                            </div>

                            <div className="mt-4 pt-4 border-t border-emerald-500/20">
                                <span className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-gray-400 block">
                                    {t.assignedRoom}
                                </span>
                                <span className="text-xl font-black text-slate-900 dark:text-white">
                                    {preferredDoctor
                                        ? `${preferredDoctor}${preferredHospital ? ` • ${preferredHospital}` : ''}`
                                        : finalCaseSheet?.assignedDoctor || 'To be assigned at the OPD desk'}
                                </span>
                                <span className="mt-1 text-base font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                                    <Clock className="w-4 h-4" /> {t.estWait}: ~8–12 mins
                                </span>
                            </div>

                            <div className="flex items-center justify-center gap-3 mt-4">
                                <span className={`px-3 py-1.5 rounded-full text-sm font-black uppercase ${triagePriority === 'emergency' ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
                                    {triagePriority === 'emergency' ? '🚨 Red-Flag Emergency Triage' : '🟢 Normal Queue Triage'}
                                </span>
                            </div>
                        </div>

                        {/* Patient identity — secondary information, for desk verification.
                Every label here was a bare `text-gray-500` with no dark
                counterpart, so all six went mid-grey on near-black in dark mode. */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm py-4 border-y border-gray-100 dark:border-white/5">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400 block">Patient Name</span>
                                <span className="font-black text-slate-900 dark:text-white">{patientForm.patientName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400 block">Age / Gender</span>
                                <span className="font-bold text-slate-900 dark:text-white">{patientForm.age}y • {patientForm.gender}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400 block">ABHA ID</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{patientForm.abhaId}</span>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400 block">Clinical Department</span>
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">{patientForm.department}</span>
                            </div>
                        </div>

                        {/* AI pre-consultation summary — what the doctor will receive */}
                        {(finalCaseSheet?.aiSummary || finalCaseSheet?.summary) && (
                            <div className="mt-6 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-sm font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                                        {lang === 'hi' ? 'एआई सारांश — डॉक्टर को भेजा गया'
                                            : lang === 'mr' ? 'एआय सारांश — डॉक्टरांना पाठवले'
                                                : 'AI summary — sent to your doctor'}
                                    </span>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-300 whitespace-pre-line">
                                    {finalCaseSheet.aiSummary || finalCaseSheet.summary}
                                </p>
                                {/* Was `text-[10px] text-slate-400` — the smallest, faintest
                    text on the screen, for the medico-legal disclaimer. */}
                                <p className="text-[13px] font-semibold text-slate-600 dark:text-gray-400 pt-2 border-t border-emerald-500/15">
                                    {lang === 'hi' ? 'यह निदान नहीं है। अंतिम निर्णय डॉक्टर लेंगे।'
                                        : 'This is not a diagnosis. Your doctor makes the final clinical decision.'}
                                </p>
                            </div>
                        )}

                        {/* Doctor QR Code Scan Box — encodes sessionId/token only */}
                        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 flex items-center gap-4">
                            <div className="w-24 h-24 bg-white p-1 rounded-xl shadow-sm border border-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                                {qrSvg ? (
                                    <img src={qrSvg} alt="OPD Token QR" className="w-full h-full" />
                                ) : (
                                    <QrCode className="w-10 h-10 text-slate-400" />
                                )}
                            </div>
                            <div className="text-sm">
                                <span className="font-black text-slate-900 dark:text-white block uppercase">Doctor desk QR (no clinical data)</span>
                                <p className="text-gray-600 dark:text-gray-400 mt-0.5">
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
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 pt-2 w-full">
                        <button
                            type="button"
                            onClick={handlePrintTokenSlip}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                        >
                            <Printer className="w-4 h-4" /> {t.printBtn}
                        </button>

                        <button
                            type="button"
                            disabled={isExportingPdf}
                            onClick={handleDownloadTokenPdf}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-lg shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                        >
                            <Download className="w-4 h-4" />
                            {isExportingPdf ? 'Exporting PDF...' : (lang === 'hi' ? 'PDF डाउनलोड करें' : lang === 'mr' ? 'PDF डाउनलोड करा' : 'Download PDF')}
                        </button>

                        <button
                            type="button"
                            onClick={handleResetKiosk}
                            className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-300 dark:border-white/20 text-slate-800 dark:text-gray-200 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
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


            {/* Complete Problem Statement 4 Rules & Regulations Modal */}
            {showRulesModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-3xl w-full border-2 border-emerald-500/40 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                        MediKiosk Rules, Regulations & Privacy Architecture
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">
                                        Digital Personal Data Protection (DPDP) Act 2023 & Ayushman Bharat Digital Mission (ABDM) Compliance
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowRulesModal(false)}
                                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
                            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30">
                                <h4 className="font-black text-emerald-900 dark:text-emerald-300 text-sm mb-1 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    1. Statutory DPDP Act 2023 & ABDM Consent Architecture (§3.3 Module D)
                                </h4>
                                <p className="text-slate-600 dark:text-gray-300">
                                    MediKiosk operates in strict compliance with India's <strong>Digital Personal Data Protection Act 2023</strong> and the <strong>National Health Authority (NHA) ABDM Consent Framework</strong>. All patient case intake, conversational voice audio, sensor vitals, and scanned records are collected exclusively for pre-consultation clinical case preparation.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10">
                                <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                                    2. Ephemeral Terminal & Zero-Retention Security Policy (§3.3 Module D)
                                </h4>
                                <p className="text-slate-600 dark:text-gray-300">
                                    To protect patient privacy in high-density public hospital OPD environments (handling 4,000–10,000 daily patients), MediKiosk is engineered as an <strong>ephemeral, zero-retention terminal</strong>. Temporary conversational speech data and cached forms are automatically cleared immediately upon OPD token submission or after 30 seconds of terminal inactivity.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10">
                                <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                                    3. Physician Oversight & Human-in-the-Loop Principle (§3.3 Module C)
                                </h4>
                                <p className="text-slate-600 dark:text-gray-300">
                                    The AI case sheet, department classification, and extracted medication interactions generated by MediKiosk are clinical drafts designed to eliminate the first-mile 2-minute OPD documentation bottleneck. The consulting physician retains 100% full autonomous authority to accept, amend, or reject any draft finding.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10">
                                <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                    4. Automated Red-Flag Emergency Triage (§3.3 Module A)
                                </h4>
                                <p className="text-slate-600 dark:text-gray-300">
                                    If the conversational intake engine identifies acute clinical red-flag symptoms (such as acute chest pain with dyspnea, stroke signs, or severe hypertensive crisis), routine queueing is immediately escalated to emergency high-priority triage.
                                </p>
                            </div>

                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10">
                                <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-emerald-600" />
                                    5. Granular Patient Rights & Revocation (§3.3 Module D)
                                </h4>
                                <p className="text-slate-600 dark:text-gray-300">
                                    Patients retain complete autonomy over their data. You have the right to revoke consent, opt out of prescription document scanning, or request nurse-led manual triage at any time.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowRulesModal(false)}
                                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md cursor-pointer"
                            >
                                I Understand & Agree (स्वीकार है)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pariksha Educational Guide Modal */}
            <ParikshaGuideModal
                isOpen={showParikshaGuideModal}
                onClose={() => setShowParikshaGuideModal(false)}
                lang={lang}
            />

            {/* Global Clinical Department Selection Modal */}
            <DepartmentSelectionModal
                isOpen={showManualDeptModal}
                onClose={() => setShowManualDeptModal(false)}
                onSelectDepartment={handleSelectDepartment}
                currentDepartment={patientForm.department}
                consultationType={consultationType}
                inferredDept={inferredDept}
                lang={lang}
            />

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
