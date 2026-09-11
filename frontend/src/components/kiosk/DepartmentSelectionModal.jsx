import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Stethoscope, Activity, Zap, Heart, Sparkles, Droplets,
  Search, X, CheckCircle2, ShieldCheck, ArrowRight, Building2,
  AlertTriangle, Clock, User, Plus, Check,
  Layers, Wind, Pill, LayoutGrid, Table,
  MapPin, Calendar, ArrowUpDown, ChevronDown, ChevronUp, Info,
  Eye, HelpCircle, CheckCircle
} from 'lucide-react';

/**
 * Enhanced Clinical Department Data Matrix (AYUSH & Allopathy)
 * High-density clinical directory with complete doctor credentials,
 * rooms, floors, specialized procedures, and real-time wait telemetry.
 */
const AYUSH_DEPARTMENTS = [
  {
    id: 'Kayachikitsa',
    stream: 'ayush',
    system: 'Ayurveda (आयुर्वेद)',
    nameHi: 'कायचिकित्सा (Kayachikitsa)',
    nameEn: 'Internal Medicine & General Care',
    nameMr: 'कायचिकित्सा (अंतर्गत औषधोपचार)',
    tag: 'General Medicine',
    doctor: 'Dr. Vaidya R. K. Sharma',
    doctorDegree: 'BAMS, MD (Ayu - Kayachikitsa)',
    room: 'Room 104',
    floor: 'Ground Floor (भूतल)',
    block: 'Main OPD Block A',
    timings: '08:30 AM - 02:00 PM',
    days: 'Mon - Sat',
    queueCount: 3,
    waitTime: '~8-10m',
    waitMinutes: 9,
    waitStatus: 'low',
    symptomTags: ['बुखार (Fever)', 'गैस / अपच (Acidity)', 'मधुमेह (Diabetes)', 'कमजोरी (Fatigue)', 'खांसी (Cough)'],
    symptoms: 'Viral Fever, Hyperacidity, Diabetes, Chronic Fatigue, Cough, Metabolic Issues (बुखार, गैस, कमजोरी, मधुमेह, खांसी)',
    procedures: ['नाड़ी परीक्षा', 'दशविध परीक्षा', 'रसायन चिकित्सा', 'आम-पाचन प्रोटोकॉल'],
    keySymptoms: ['बुखार', 'fever', 'गैस', 'acidity', 'मधुमेह', 'diabetes', 'कमजोरी', 'खांसी', 'अपच', 'शुगर'],
    icon: Stethoscope,
    gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'Shalya',
    stream: 'ayush',
    system: 'Ayurveda (आयुर्वेद)',
    nameHi: 'शल्य तंत्र (Shalya Tantra)',
    nameEn: 'Musculoskeletal, Joints & Anorectal',
    nameMr: 'शल्य तंत्र (सांधे व शस्त्रक्रिया)',
    tag: 'Bones & Joints',
    doctor: 'Dr. Vaidya S. K. Joshi',
    doctorDegree: 'BAMS, MS (Ayu - Shalya Tantra)',
    room: 'Room 106',
    floor: 'Ground Floor (भूतल)',
    block: 'Surgical OPD Block',
    timings: '08:30 AM - 02:00 PM',
    days: 'Mon - Sat',
    queueCount: 5,
    waitTime: '~12-15m',
    waitMinutes: 14,
    waitStatus: 'medium',
    symptomTags: ['जोड़ों का दर्द', 'घुटने (Knee Pain)', 'कमर दर्द (Sciatica)', 'बवासीर (Piles/Fissure)', 'गठिया (Arthritis)'],
    symptoms: 'Knee & Joint Pain, Arthritis, Sciatica, Piles/Fissure, Sprain (घुटने व जोड़ों का दर्द, गठिया, कमर दर्द, बवासीर, मोच)',
    procedures: ['क्षारसूत्र चिकित्सा', 'अग्निकर्म', 'जलौकावचारण (Leech Therapy)', 'मर्म चिकित्सा'],
    keySymptoms: ['जोड़ों का दर्द', 'joint pain', 'घुटने', 'knee', 'गठिया', 'कमर दर्द', 'बवासीर', 'sciatica', 'मस्सा'],
    icon: Activity,
    gradient: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    id: 'Shalakya',
    stream: 'ayush',
    system: 'Ayurveda (आयुर्वेद)',
    nameHi: 'शालाक्य तंत्र (Shalakya Tantra)',
    nameEn: 'ENT, Eye, Head & Neck Care',
    nameMr: 'शालाक्य तंत्र (कान, नाक, डोळे व घसा)',
    tag: 'ENT & Eye Care',
    doctor: 'Dr. Vaidya Ananya Mishra',
    doctorDegree: 'BAMS, MS (Ayu - Shalakya Tantra)',
    room: 'Room 108',
    floor: 'First Floor (प्रथम तल)',
    block: 'Specialty Block B',
    timings: '08:30 AM - 02:00 PM',
    days: 'Mon - Sat',
    queueCount: 2,
    waitTime: '~5-8m',
    waitMinutes: 6,
    waitStatus: 'low',
    symptomTags: ['सिरदर्द (Headache)', 'माइग्रेन (Migraine)', 'साइनस (Sinus)', 'आंखों में जलन', 'कान बहना'],
    symptoms: 'Headache, Migraine, Sinusitis, Ear Discharge, Eye Strain, Tonsillitis (सिरदर्द, माइग्रेन, साइनस, कान बहना, आंखों में जलन)',
    procedures: ['नेत्र तर्पण', 'नस्य कर्म', 'कर्णपूरण', 'अंजन क्रिया'],
    keySymptoms: ['सिरदर्द', 'headache', 'माइग्रेन', 'साइनस', 'आंख', 'eye', 'कान', 'ear', 'गला', 'गले में खराश'],
    icon: Zap,
    gradient: 'from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  {
    id: 'Prasuti',
    stream: 'ayush',
    system: 'Ayurveda (आयुर्वेद)',
    nameHi: 'प्रसूति व स्त्री रोग (Prasuti Tantra)',
    nameEn: "Women's Health, Maternity & Gynaecology",
    nameMr: 'प्रसूती व स्त्री रोग विभाग',
    tag: "Women's Health",
    doctor: 'Dr. Vaidya Sunita Deshmukh',
    doctorDegree: 'BAMS, MD (Ayu - Stri Roga)',
    room: 'Room 110',
    floor: 'First Floor (प्रथम तल)',
    block: 'Mother & Child Block',
    timings: '08:30 AM - 02:00 PM',
    days: 'Mon - Sat',
    queueCount: 4,
    waitTime: '~10-12m',
    waitMinutes: 11,
    waitStatus: 'medium',
    symptomTags: ['अनियमित माहवारी', 'PCOD / PCOS', 'गर्भावस्था परिचर्या', 'सफेद पानी (Leucorrhea)', 'हार्मोनल असंतुलन'],
    symptoms: 'Pregnancy Care, PCOD/PCOS, Irregular Periods, Leucorrhoea, Hormonal Balance (गर्भावस्था, अनियमित माहवारी, पीसीओडी, सफेद पानी)',
    procedures: ['गर्भिणी परिचर्या', 'उत्तरबस्ती', 'योनि धावन / पिचू', 'ऋतुचर्या परामर्श'],
    keySymptoms: ['महिला', 'women', 'माहवारी', 'periods', 'पीसीओडी', 'pcod', 'pcos', 'गर्भावस्था', 'हार्मोनल'],
    icon: Heart,
    gradient: 'from-pink-500/20 to-rose-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30'
  },
  {
    id: 'Kaumarbhritya',
    stream: 'ayush',
    system: 'Ayurveda (आयुर्वेद)',
    nameHi: 'कौमारभृत्य (Kaumarbhritya)',
    nameEn: 'Pediatrics, Child Wellness & Immunity',
    nameMr: 'कौमारभृत्य (बालरोग विभाग)',
    tag: 'Pediatrics',
    doctor: 'Dr. Vaidya Manish Verma',
    doctorDegree: 'BAMS, MD (Ayu - Kaumarbhritya)',
    room: 'Room 112',
    floor: 'Ground Floor (भूतल)',
    block: 'Mother & Child Block',
    timings: '08:30 AM - 02:00 PM',
    days: 'Mon - Sat',
    queueCount: 2,
    waitTime: '~6-8m',
    waitMinutes: 7,
    waitStatus: 'low',
    symptomTags: ['शिशु बुखार / सर्दी', 'कुपोषण / कम वजन', 'रोग प्रतिरोधक क्षमता', 'स्वर्णप्राशन', 'पेट दर्द / कीड़े'],
    symptoms: 'Child Fever, Low Immunity, Delayed Milestones, Pediatric Cough/Cold (बच्चों का बुखार, सुस्ती, वृद्धि व विकास, भूख न लगना)',
    procedures: ['स्वर्णप्राशन संस्कार', 'बाल संस्कार', 'पोषण परामर्श', 'शिशु अभ्यंग'],
    keySymptoms: ['बच्चे', 'child', 'बाल रोग', 'pediatric', 'बच्चों का बुखार', 'swarna prashana', 'शिशु'],
    icon: Sparkles,
    gradient: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    id: 'Panchakarma',
    stream: 'ayush',
    system: 'Ayurveda (आयुर्वेद)',
    nameHi: 'पंचकर्म चिकित्सा (Panchakarma)',
    nameEn: 'Bio-Purification, Detox & Physical Rehab',
    nameMr: 'पंचकर्म चिकित्सा (शुद्धीकरण)',
    tag: 'Detox & Therapy',
    doctor: 'Dr. Vaidya Ramanathan Iyer',
    doctorDegree: 'BAMS, MD (Ayu - Panchakarma)',
    room: 'Room 115',
    floor: 'Ground Floor (भूतल)',
    block: 'Panchakarma Specialty Wing',
    timings: '08:00 AM - 03:00 PM',
    days: 'Mon - Sat',
    queueCount: 3,
    waitTime: '~15m',
    waitMinutes: 15,
    waitStatus: 'medium',
    symptomTags: ['शिरोधरा (Shirodhara)', 'बस्ती कर्म (Basti)', 'पक्षाघात (Paralysis)', 'अनिद्रा / तनाव', 'कायाकल्प (Detox)'],
    symptoms: 'Shirodhara, Basti, Chronic Joint Pain, Paralysis Rehab, Severe Stress/Insomnia (शिरोधरा, बस्ती, पक्षाघात, तनाव, स्पास्टिसिटी)',
    procedures: ['स्नेहन-स्वेदन', 'शिरोधरा', 'कटीबस्ती / जानुबस्ती', 'वमन / विरेचन'],
    keySymptoms: ['पंचकर्म', 'panchakarma', 'डिटॉक्स', 'detox', 'शिरोधरा', 'बस्ती', 'पक्षाघात', 'paralysis', 'अनिद्रा'],
    icon: Droplets,
    gradient: 'from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30'
  },
  {
    id: 'Swasthavritta',
    stream: 'ayush',
    system: 'Ayurveda (आयुर्वेद)',
    nameHi: 'स्वस्थवृत्त एवं योग (Swasthavritta & Yoga)',
    nameEn: 'Preventive Health, Dietetics & Lifestyle',
    nameMr: 'स्वस्थवृत्त आणि योग विभाग',
    tag: 'Lifestyle & Diet',
    doctor: 'Dr. Vaidya Priya Saxena',
    doctorDegree: 'BAMS, MD (Ayu - Swasthavritta)',
    room: 'Room 118',
    floor: 'Ground Floor (भूतल)',
    block: 'Wellness & Yoga Centre',
    timings: '08:30 AM - 02:00 PM',
    days: 'Mon - Sat',
    queueCount: 1,
    waitTime: '~5m',
    waitMinutes: 5,
    waitStatus: 'low',
    symptomTags: ['मोटापा (Obesity)', 'आहार तालिका (Diet Plan)', 'योग थेरेपी', 'तनाव प्रबंधन', 'जीवनशैली रोग'],
    symptoms: 'Obesity, Diet Planning, Hypertension Lifestyle, Yoga Therapy, Stress Management (मोटापा, आहार योजना, तनाव मुक्ति, उच्च रक्तचाप)',
    procedures: ['दिनचर्या परामर्श', 'योग चिकित्सा', 'पथ्यापथ्य योजना', 'प्राणायाम सत्र'],
    keySymptoms: ['योग', 'yoga', 'मोटापा', 'obesity', 'आहार', 'diet', 'वजन', 'जीवनशैली', 'तनाव'],
    icon: ShieldCheck,
    gradient: 'from-emerald-500/20 to-cyan-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'AgadaTantra',
    stream: 'ayush',
    system: 'Ayurveda (आयुर्वेद)',
    nameHi: 'अगद तंत्र व चर्म रोग (Agada & Skin)',
    nameEn: 'Ayurvedic Dermatology, Allergies & Toxins',
    nameMr: 'अगद तंत्र व त्वचारोग विभाग',
    tag: 'Skin & Allergies',
    doctor: 'Dr. Vaidya Harish Chandra',
    doctorDegree: 'BAMS, MD (Ayu - Agada Tantra)',
    room: 'Room 120',
    floor: 'First Floor (प्रथम तल)',
    block: 'Specialty Block B',
    timings: '08:30 AM - 02:00 PM',
    days: 'Mon - Sat',
    queueCount: 2,
    waitTime: '~7m',
    waitMinutes: 7,
    waitStatus: 'low',
    symptomTags: ['खुजली (Itching)', 'दाद / एक्जिमा (Eczema)', 'सोरायसिस (Psoriasis)', 'शीतपित्त (Urticaria)', 'कीट दंश (Allergy)'],
    symptoms: 'Chronic Eczema, Psoriasis, Urticaria/Itching, Food Allergies, Rashes (दाद, खाज, खुजली, सोरायसिस, चकत्ते, एलर्जी)',
    procedures: ['रक्तमोक्षण', 'लेप चिकित्सा', 'धूपन कर्म', 'शोधन योग'],
    keySymptoms: ['खुजली', 'itching', 'त्वचा', 'skin', 'सोरायसिस', 'psoriasis', 'एलर्जी', 'दाद', 'एक्जिमा'],
    icon: Pill,
    gradient: 'from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
  }
];

const ALLOPATHY_DEPARTMENTS = [
  {
    id: 'General Medicine',
    stream: 'allopathy',
    system: 'Modern Medicine (एलोपैथी)',
    nameHi: 'जनरल मेडिसिन (General Medicine)',
    nameEn: 'Internal Medicine, Fevers & Infection',
    nameMr: 'जनरल मेडिसिन (सर्वसाधारण तपासणी)',
    tag: 'General Medicine',
    doctor: 'Dr. Amit Khanna',
    doctorDegree: 'MBBS, MD (General Medicine)',
    room: 'Room 201',
    floor: 'Second Floor (द्वितीय तल)',
    block: 'Main Hospital Tower',
    timings: '08:30 AM - 02:30 PM',
    days: 'Mon - Sat',
    queueCount: 4,
    waitTime: '~10-12m',
    waitMinutes: 11,
    waitStatus: 'medium',
    symptomTags: ['बुखार (Viral/Typhoid)', 'उच्च रक्तचाप (BP)', 'मधुमेह (Diabetes)', 'संक्रमण (Infection)', 'कमजोरी'],
    symptoms: 'Viral Fever, High BP, Diabetes, Infections, Weakness (बुखार, बीपी, शुगर, कमजोरी, संक्रमण)',
    procedures: ['ब्लड शुगर जांच', 'आईवी ड्रिप ट्राइएज', 'रैपिड मलेरिया/डेंगू किट', 'ईसीजी समीक्षा'],
    keySymptoms: ['बुखार', 'fever', 'बीपी', 'bp', 'शुगर', 'diabetes', 'कमजोरी', 'संक्रमण'],
    icon: Stethoscope,
    gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'Orthopaedics',
    stream: 'allopathy',
    system: 'Modern Medicine (एलोपैथी)',
    nameHi: 'हड्डी व जोड़ रोग (Orthopaedics)',
    nameEn: 'Bones, Joint Replacement & Trauma',
    nameMr: 'अस्थिरोग व सांधे विभाग',
    tag: 'Orthopaedics',
    doctor: 'Dr. Vikram Patel',
    doctorDegree: 'MBBS, MS (Orthopaedics)',
    room: 'Room 204',
    floor: 'Second Floor (द्वितीय तल)',
    block: 'Surgical Block',
    timings: '08:30 AM - 02:30 PM',
    days: 'Mon - Sat',
    queueCount: 6,
    waitTime: '~15-18m',
    waitMinutes: 16,
    waitStatus: 'medium',
    symptomTags: ['हड्डी फ्रैक्चर', 'घुटने का दर्द (Knee)', 'कमर दर्द (Spine)', 'लिगामेंट चोट (Sprain)', 'गठिया (Arthritis)'],
    symptoms: 'Fractures, Severe Joint Pain, Back Sprain, Knee Swelling, Trauma (हड्डी टूटना, जोड़ों में सूजन, कमर दर्द)',
    procedures: ['डिजिटल एक्स-रे', 'प्लास्टर / स्प्लिंट', 'जॉइंट एस्पिरेशन', 'फिजियोथेरेपी परामर्श'],
    keySymptoms: ['हड्डी', 'fracture', 'जोड़ों का दर्द', 'joint pain', 'घुटने', 'knee', 'कमर दर्द'],
    icon: Activity,
    gradient: 'from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
  },
  {
    id: 'Cardiology',
    stream: 'allopathy',
    system: 'Modern Medicine (एलोपैथी)',
    nameHi: 'हृदय रोग विभाग (Cardiology)',
    nameEn: 'Heart Care, ECG & Chest Pain',
    nameMr: 'हृदयरोग विभाग',
    tag: 'Cardiology',
    doctor: 'Dr. Neha Kapoor',
    doctorDegree: 'MBBS, MD, DM (Cardiology)',
    room: 'Room 206',
    floor: 'Second Floor (द्वितीय तल)',
    block: 'Cardiac Centre',
    timings: '08:30 AM - 02:30 PM',
    days: 'Mon - Sat',
    queueCount: 3,
    waitTime: '~10m',
    waitMinutes: 10,
    waitStatus: 'low',
    symptomTags: ['छाती में दर्द (Chest Pain)', 'घबराहट (Palpitations)', 'उच्च रक्तचाप (High BP)', 'धड़कन तेज', 'सांस चढ़ना'],
    symptoms: 'Chest Discomfort, Palpitations, High BP, Breathlessness, ECG (छाती में दबाव, घबराहट, धड़कन तेज होना)',
    procedures: ['12-लीड ईसीजी', '24h बीपी मॉनिटरिंग', 'ट्रोपोनिन-टी रैपिड टेस्ट', 'इकोकार्डियोग्राफी (Echo)'],
    keySymptoms: ['छाती में दर्द', 'chest pain', 'दिल', 'heart', 'घबराहट', 'palpitations', 'बीपी'],
    icon: Heart,
    gradient: 'from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
  },
  {
    id: 'Paediatrics',
    stream: 'allopathy',
    system: 'Modern Medicine (एलोपैथी)',
    nameHi: 'बाल रोग विभाग (Paediatrics)',
    nameEn: 'Infant, Child Care & Vaccinations',
    nameMr: 'बालरोग व लसीकरण विभाग',
    tag: 'Paediatrics',
    doctor: 'Dr. Priya Nambiar',
    doctorDegree: 'MBBS, MD (Paediatrics)',
    room: 'Room 208',
    floor: 'Second Floor (द्वितीय तल)',
    block: 'Child Care Wing',
    timings: '08:30 AM - 02:30 PM',
    days: 'Mon - Sat',
    queueCount: 3,
    waitTime: '~8m',
    waitMinutes: 8,
    waitStatus: 'low',
    symptomTags: ['शिशु खांसी / जुकाम', 'उल्टी व दस्त (Diarrhea)', 'टीकाकरण (Vaccines)', 'शिशु बुखार', 'कमजोरी'],
    symptoms: 'Childhood Viral, Routine Vaccines, Dehydration, Infant Cough (बच्चों की खांसी, उल्टी-दस्त, टीका)',
    procedures: ['नियमित टीकाकरण', 'ओआरएस ट्राइएज', 'बाल विकास चार्टिंग', 'नेब्युलाइजर थेरेपी'],
    keySymptoms: ['बच्चे', 'child', 'टीका', 'vaccine', 'उल्टी', 'vomiting', 'दस्त'],
    icon: Sparkles,
    gradient: 'from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
  },
  {
    id: 'ENT',
    stream: 'allopathy',
    system: 'Modern Medicine (एलोपैथी)',
    nameHi: 'कान, नाक व गला (ENT)',
    nameEn: 'Ear, Nose, Throat & Sinuses',
    nameMr: 'कान, नाक व घसा विभाग',
    tag: 'ENT Clinic',
    doctor: 'Dr. Harshwardhan Rao',
    doctorDegree: 'MBBS, MS (ENT)',
    room: 'Room 210',
    floor: 'Second Floor (द्वितीय तल)',
    block: 'Specialty Block',
    timings: '08:30 AM - 02:30 PM',
    days: 'Mon - Sat',
    queueCount: 2,
    waitTime: '~6m',
    waitMinutes: 6,
    waitStatus: 'low',
    symptomTags: ['कान दर्द / बहना', 'आवाज बैठना (Hoarse)', 'टॉन्सिल (Tonsils)', 'नाक बंद (Sinus)', 'कम सुनाई देना'],
    symptoms: 'Ear Discharge, Hearing Loss, Throat Infection, Tonsils, Sinus (कान बहना, आवाज बैठना, टॉन्सिल दर्द)',
    procedures: ['ऑटो-एंडोस्कोपी', 'ईयर वैक्स रिमूवल', 'ऑडियोमेट्री जांच', 'नेजल एंडोस्कोपी'],
    keySymptoms: ['कान', 'ear', 'नाक', 'nose', 'गला', 'throat', 'टॉन्सिल', 'tonsils'],
    icon: Zap,
    gradient: 'from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
  },
  {
    id: 'Dermatology',
    stream: 'allopathy',
    system: 'Modern Medicine (एलोपैथी)',
    nameHi: 'त्वचा रोग विभाग (Dermatology)',
    nameEn: 'Skin, Allergies, Rashes & Hair',
    nameMr: 'त्वचारोग विभाग',
    tag: 'Dermatology',
    doctor: 'Dr. Shweta Singhania',
    doctorDegree: 'MBBS, MD (Dermatology)',
    room: 'Room 212',
    floor: 'Second Floor (द्वितीय तल)',
    block: 'Specialty Block',
    timings: '08:30 AM - 02:30 PM',
    days: 'Mon - Sat',
    queueCount: 3,
    waitTime: '~9m',
    waitMinutes: 9,
    waitStatus: 'low',
    symptomTags: ['दाद (Fungal)', 'खुजली (Severe Itching)', 'चकत्ते (Allergic Rash)', 'मुंहासे (Acne)', 'बाल झड़ना'],
    symptoms: 'Eczema, Fungal Rashes, Severe Itching, Urticaria, Hair Loss (दाद, खुजली, एलर्जी, लाल चकत्ते)',
    procedures: ['स्किन स्क्रैपिंग KOH टेस्ट', 'वुड्स लैंप जांच', 'क्रायोथेरेपी', 'एलर्जी पैच टेस्ट'],
    keySymptoms: ['त्वचा', 'skin', 'खुजली', 'itching', 'चकत्ते', 'rash', 'बाल झड़ना', 'hair fall'],
    icon: Droplets,
    gradient: 'from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'Pulmonology',
    stream: 'allopathy',
    system: 'Modern Medicine (एलोपैथी)',
    nameHi: 'श्वसन व फेफड़े रोग (Pulmonology)',
    nameEn: 'Chest Medicine, Asthma & Lungs',
    nameMr: 'श्वसन व फुफ्फुस रोग विभाग',
    tag: 'Pulmonology',
    doctor: 'Dr. Alok Sengupta',
    doctorDegree: 'MBBS, MD (Pulmonary Medicine)',
    room: 'Room 214',
    floor: 'Second Floor (द्वितीय तल)',
    block: 'Respiratory Wing',
    timings: '08:30 AM - 02:30 PM',
    days: 'Mon - Sat',
    queueCount: 2,
    waitTime: '~7m',
    waitMinutes: 7,
    waitStatus: 'low',
    symptomTags: ['दमा (Asthma)', 'लगातार पुरानी खांसी', 'सांस फूलना (Dyspnea)', 'घरघराहट (Wheezing)', 'फेफड़े संक्रमण'],
    symptoms: 'Chronic Cough, Bronchial Asthma, Breathlessness, Wheezing (लगातार खांसी, दमा, सांस फूलना)',
    procedures: ['स्पाइरोमेट्री (PFT)', 'ऑक्सीजन सैचुरेशन जांच', 'नेब्युलाइज़र थेरेपी', 'चेस्ट फिजियोथेरेपी'],
    keySymptoms: ['सांस फूलना', 'breathlessness', 'दमा', 'asthma', 'खांसी', 'cough', 'फेफड़े'],
    icon: Wind,
    gradient: 'from-teal-500/20 to-sky-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30'
  },
  {
    id: 'Gastroenterology',
    stream: 'allopathy',
    system: 'Modern Medicine (एलोपैथी)',
    nameHi: 'उदर व पेट रोग (Gastroenterology)',
    nameEn: 'Digestive System, Liver & Stomach',
    nameMr: 'पचनसंस्था व यकृत रोग विभाग',
    tag: 'Gastroenterology',
    doctor: 'Dr. Rajeshwari Nair',
    doctorDegree: 'MBBS, MD, DM (Gastroenterology)',
    room: 'Room 216',
    floor: 'Second Floor (द्वितीय तल)',
    block: 'Digestive Health Wing',
    timings: '08:30 AM - 02:30 PM',
    days: 'Mon - Sat',
    queueCount: 4,
    waitTime: '~12m',
    waitMinutes: 12,
    waitStatus: 'medium',
    symptomTags: ['तीव्र एसिडिटी / GERD', 'पेट दर्द (Abdominal Pain)', 'फैटी लिवर (Fatty Liver)', 'पीलिया (Jaundice)', 'पुरानी कब्ज'],
    symptoms: 'Severe Acidity, GERD, Chronic Constipation, Liver Issues, Jaundice (अत्यधिक एसिडिटी, पेट दर्द, पीलिया)',
    procedures: ['अल्ट्रासाउंड पेट', 'लिवर फंक्शन प्रोफाइल', 'अपर जीआई एंडोस्कोपी शेड्यूलिंग', 'डाइट प्रोटोकॉल'],
    keySymptoms: ['पेट दर्द', 'stomach pain', 'एसिडिटी', 'acidity', 'लिवर', 'liver', 'पीलिया', 'कब्ज'],
    icon: Layers,
    gradient: 'from-amber-500/20 to-emerald-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
  }
];

const QUICK_SYMPTOM_PILLS = [
  { label: '🔥 बुखार / ठंड (Fever)', query: 'बुखार', deptId: 'Kayachikitsa' },
  { label: '🦴 जोड़ों व कमर दर्द (Joint/Back)', query: 'जोड़ों का दर्द', deptId: 'Shalya' },
  { label: '🫀 सीने में दर्द / बीपी (Heart / BP)', query: 'छाती में दर्द', deptId: 'Cardiology' },
  { label: '👶 बच्चों की बीमारी (Pediatric)', query: 'बच्चे', deptId: 'Kaumarbhritya' },
  { label: '👁️ आंख, कान व गला (ENT / Eyes)', query: 'आंख', deptId: 'Shalakya' },
  { label: '🌸 महिला स्वास्थ्य (Women)', query: 'महिला', deptId: 'Prasuti' },
  { label: '🌿 पंचकर्म / कायाकल्प (Detox)', query: 'पंचकर्म', deptId: 'Panchakarma' },
  { label: '✨ त्वचा व खुजली (Skin / Allergy)', query: 'त्वचा', deptId: 'AgadaTantra' },
  { label: '🌬️ सांस फूलना / दमा (Asthma)', query: 'सांस फूलना', deptId: 'Pulmonology' },
  { label: '⚡ एसिडिटी / पेट दर्द (Acidity)', query: 'एसिडिटी', deptId: 'Gastroenterology' }
];

export default function DepartmentSelectionModal({
  isOpen,
  onClose,
  onSelectDepartment,
  currentDepartment,
  consultationType = 'ayurvedic',
  inferredDept = null,
  lang = 'hi'
}) {
  const [activeTab, setActiveTab] = useState(
    consultationType === 'allopathy' ? 'allopathy' : 'ayush'
  );
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return 'cards';
    return 'grid';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'wait' | 'name' | 'room'
  const [selectedId, setSelectedId] = useState(currentDepartment || '');
  const [visitNote, setVisitNote] = useState('');
  const [customDeptInput, setCustomDeptInput] = useState('');
  const [showCustomField, setShowCustomField] = useState(false);
  const [inspectDept, setInspectDept] = useState(null); // Dept for View Details Modal

  // On mobile devices, ensure cards mode is used when opening
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('cards');
    }
  }, [isOpen]);

  const allDepartments = useMemo(() => {
    return [...AYUSH_DEPARTMENTS, ...ALLOPATHY_DEPARTMENTS];
  }, []);

  const filteredDepartments = useMemo(() => {
    let list = allDepartments;
    if (activeTab === 'ayush') {
      list = list.filter(d => d.stream === 'ayush');
    } else if (activeTab === 'allopathy') {
      list = list.filter(d => d.stream === 'allopathy');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(d =>
        d.nameHi.toLowerCase().includes(q) ||
        d.nameEn.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.doctor.toLowerCase().includes(q) ||
        d.room.toLowerCase().includes(q) ||
        d.floor.toLowerCase().includes(q) ||
        d.symptoms.toLowerCase().includes(q) ||
        d.tag.toLowerCase().includes(q) ||
        d.procedures?.some(p => p.toLowerCase().includes(q)) ||
        d.keySymptoms?.some(s => s.toLowerCase().includes(q))
      );
    }

    // Sort order
    if (sortBy === 'wait') {
      return [...list].sort((a, b) => a.waitMinutes - b.waitMinutes);
    } else if (sortBy === 'name') {
      return [...list].sort((a, b) => a.nameHi.localeCompare(b.nameHi));
    } else if (sortBy === 'room') {
      return [...list].sort((a, b) => a.room.localeCompare(b.room));
    }

    return list;
  }, [allDepartments, activeTab, searchQuery, sortBy]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalDept = customDeptInput.trim() || selectedId;
    if (finalDept) {
      onSelectDepartment(finalDept, visitNote.trim());
    }
  };

  const handleQuickSymptomClick = (pill) => {
    setSearchQuery(pill.query);
    setSelectedId(pill.deptId);
  };

  const selectedDetails = allDepartments.find(d => d.id === selectedId);

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200 select-none overflow-hidden font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-500/30 dark:border-teal-500/20 shadow-2xl w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden text-slate-900 dark:text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ────────────────── TOP CONTROLS & SEARCH HEADER ────────────────── */}
        <div className="p-3 sm:p-4 md:p-5 border-b border-slate-100 dark:border-white/10 bg-gradient-to-r from-teal-50/60 via-emerald-50/40 to-transparent dark:from-teal-950/20 dark:via-slate-900 dark:to-transparent shrink-0 space-y-3">
          {/* Top Bar: Title + Badges + Close */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                    {lang === 'hi' ? 'ओपीडी क्लिनिक निर्देशिका' : lang === 'mr' ? 'ओपीडी क्लिनिक निर्देशिका' : 'OPD Clinic Directory'}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold border border-teal-500/20 shrink-0">
                    {filteredDepartments.length} {lang === 'hi' ? 'क्लिनिक' : 'Clinics'}
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                    <ShieldCheck className="w-3.5 h-3.5" /> AIIA Smart Triage
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate mt-0.5">
                  {lang === 'hi' ? 'आयुष व आधुनिक ओपीडी क्लिनिक, परामर्श चिकित्सक, कक्ष व प्रतीक्षा समय' : 'AYUSH & Modern OPD clinics, physicians, room numbers and real-time wait times'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Grid / Table View Switcher */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'grid'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                  title="Table Data Grid View"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span className="text-xs">{lang === 'hi' ? 'तालिका (Table)' : 'Table Grid'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${viewMode === 'cards'
                    ? 'bg-teal-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                  title="Card Directory View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-xs">{lang === 'hi' ? 'कार्ड्स (Cards)' : 'Cards'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls Bar: Stream Filter Tabs + Search + Modern Custom Sort Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Stream Filter Tabs */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => { setActiveTab('ayush'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'ayush'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
              >
                <span>🌿 आयुष (AYUSH) ({AYUSH_DEPARTMENTS.length})</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('allopathy'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'allopathy'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
              >
                <span>💊 आधुनिक (Allopathy) ({ALLOPATHY_DEPARTMENTS.length})</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${activeTab === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10'
                  }`}
              >
                सभी ({allDepartments.length})
              </button>
            </div>

            {/* Instant Search Bar + Custom Themed Sort Dropdown */}
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-teal-600/70 dark:text-teal-400 absolute left-3.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'hi' ? 'लक्षण, बीमारी, डॉक्टर या कमरा खोजें...' : 'Search symptoms, doctor, room...'}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/15 shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Native Themed Sort Selector */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-8 pr-7 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs cursor-pointer hover:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="default">{lang === 'hi' ? 'डिफ़ॉल्ट क्रम' : 'Default Sorting'}</option>
                  <option value="wait">{lang === 'hi' ? 'कम प्रतीक्षा समय' : 'Shortest Wait'}</option>
                  <option value="name">{lang === 'hi' ? 'नाम अनुसार (A-Z)' : 'Name (A-Z)'}</option>
                  <option value="room">{lang === 'hi' ? 'कमरा संख्या' : 'Room Number'}</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 1-Tap Quick Symptom Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs scroll-smooth">
            <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1 mr-0.5">
              <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              1-Tap:
            </span>
            {QUICK_SYMPTOM_PILLS.map(pill => {
              const isActive = searchQuery === pill.query;
              return (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => handleQuickSymptomClick(pill)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border flex items-center gap-1 active:scale-95 ${isActive
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs font-semibold'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-teal-400/60 hover:bg-teal-50/50 dark:hover:bg-teal-950/20'
                    }`}
                >
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ────────────────── SCROLLABLE DATA BODY ────────────────── */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {filteredDepartments.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {lang === 'hi' ? `"${searchQuery}" से मेल खाता कोई क्लिनिक नहीं मिला` : `No matching clinics found for "${searchQuery}"`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold cursor-pointer hover:bg-teal-500 shadow-xs"
                >
                  {lang === 'hi' ? 'सभी क्लिनिक देखें' : 'Show All Clinics'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCustomField(true); setCustomDeptInput(searchQuery); }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/20 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  {lang === 'hi' ? `"${searchQuery}" को कस्टम विभाग बनाएं` : `Assign "${searchQuery}" as Custom`}
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* ─────────────────────────────────────────────────────────────
               STREAMLINED CLEAN TABLE DIRECTORY VIEW
               Clean, high-legibility layout focusing on main data.
               Full details/procedures shifted to View Details modal.
            ───────────────────────────────────────────────────────────── */
            <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-white/10 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-4 w-[28%]">विभाग व क्लिनिक (Clinic)</th>
                      <th className="py-3 px-3.5 w-[22%]">चिकित्सक (Physician)</th>
                      <th className="py-3 px-3.5 w-[24%]">मुख्य लक्षण (Key Symptoms)</th>
                      <th className="py-3 px-3 w-[14%] text-center">कमरा व कतार (Location & Queue)</th>
                      <th className="py-3 px-4 w-[12%] text-center">कार्रवाई (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                    {filteredDepartments.map((dept) => {
                      const isSelected = selectedId === dept.id;
                      const IconComp = dept.icon;
                      const isAiMatch = inferredDept?.department === dept.id;

                      return (
                        <tr
                          key={dept.id}
                          onClick={() => {
                            setSelectedId(dept.id);
                            setCustomDeptInput('');
                            setShowCustomField(false);
                          }}
                          className={`group transition-all cursor-pointer select-none ${isSelected
                            ? 'bg-teal-500/10 dark:bg-teal-950/40 border-l-4 border-l-teal-600'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                        >
                          {/* Col 1: Clinic Name & Stream */}
                          <td className="py-3.5 px-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${dept.gradient}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${dept.stream === 'ayush'
                                    ? 'bg-teal-500/15 text-teal-800 dark:text-teal-300'
                                    : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                                    }`}>
                                    {dept.stream === 'ayush' ? '🌿 AYUSH' : '💊 Modern'}
                                  </span>
                                  {isAiMatch && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-teal-600 text-white flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5" /> AI Match
                                    </span>
                                  )}
                                </div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                  {dept.nameHi}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                  {dept.nameEn}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Attending Physician & Timings */}
                          <td className="py-3.5 px-3.5 align-middle">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                              {dept.doctor}
                            </div>
                            <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{dept.timings}</span>
                            </div>
                          </td>

                          {/* Col 3: Key Symptoms tags with Clean Badge Layout */}
                          <td className="py-3.5 px-3.5 align-middle">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {dept.symptomTags?.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-white/10 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                                >
                                  {tag}
                                </span>
                              ))}
                              {dept.symptomTags?.length > 3 && (
                                <span className="px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-teal-700 dark:text-teal-400">
                                  +{dept.symptomTags.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Col 4: Location & Live Queue */}
                          <td className="py-3.5 px-3 align-middle text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/10">
                                📍 {dept.room}
                              </span>
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${dept.waitStatus === 'low'
                                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                                : dept.waitStatus === 'medium'
                                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
                                  : 'bg-red-500/10 text-red-800 dark:text-red-300 border-red-500/20'
                                }`}>
                                <Clock className="w-2.5 h-2.5" />
                                <span>{dept.waitTime} ({dept.queueCount})</span>
                              </div>
                            </div>
                          </td>

                          {/* Col 5: Selection Button & View Details Modal Trigger */}
                          <td className="py-3.5 px-4 align-middle text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectDept(dept);
                                }}
                                className="p-1.5 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 dark:text-slate-400 dark:hover:text-teal-300 transition-colors cursor-pointer"
                                title={lang === 'hi' ? 'विस्तृत जानकारी देखें' : 'View Full Details'}
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {isSelected ? (
                                <span className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>{lang === 'hi' ? 'चयनित' : 'Selected'}</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(dept.id);
                                  }}
                                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                >
                                  {lang === 'hi' ? 'चुनें' : 'Select'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
               SECONDARY CARDS VIEW
            ───────────────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDepartments.map((dept) => {
                const isSelected = selectedId === dept.id;
                const IconComp = dept.icon;
                const isAiMatch = inferredDept?.department === dept.id;

                return (
                  <div
                    key={dept.id}
                    onClick={() => {
                      setSelectedId(dept.id);
                      setCustomDeptInput('');
                      setShowCustomField(false);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 active:scale-[0.99] select-none ${isSelected
                      ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-950/40 shadow-sm ring-2 ring-teal-500/20'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/60 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${dept.gradient}`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wide">
                              {dept.stream === 'ayush' ? '🌿 AYUSH' : '💊 Modern'} • {dept.tag}
                            </span>
                            {isAiMatch && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-teal-600 text-white flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> AI Pick
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                            {dept.nameHi}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                            {dept.nameEn}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 mt-0.5">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                        )}
                      </div>
                    </div>

                    {/* Physician & Location info */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 text-xs">
                      <div className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                          <span className="truncate">{dept.doctor}</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          📍 {dept.room}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-teal-700 dark:text-teal-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          {dept.timings}
                        </span>
                        <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {dept.waitTime} ({dept.queueCount} in queue)
                        </span>
                      </div>
                    </div>

                    {/* View Details modal trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectDept(dept);
                      }}
                      className="w-full mt-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200/60 dark:border-white/5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{lang === 'hi' ? 'विस्तृत जानकारी देखें' : 'View Full Details'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Clinic Input Option */}
          <div className="pt-1">
            {!showCustomField ? (
              <button
                type="button"
                onClick={() => setShowCustomField(true)}
                className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-400 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white/40 dark:bg-white/5"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === 'hi' ? 'सूची में आपका विभाग नहीं है? यहां सीधे नाम दर्ज करें (Custom Clinic) ✍️' : 'Clinic not listed? Enter custom clinic name here ✍️'}</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-in fade-in">
                <input
                  type="text"
                  value={customDeptInput}
                  onChange={(e) => {
                    setCustomDeptInput(e.target.value);
                    setSelectedId('');
                  }}
                  placeholder={lang === 'hi' ? 'उदा. ऑन्कोलॉजी, न्यूरोलॉजी, आयुर्वेदिक नेत्र चिकित्सा...' : 'e.g. Oncology, Neurology, Specialty Ayurveda...'}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  disabled={!customDeptInput.trim()}
                  onClick={() => {
                    if (customDeptInput.trim()) setSelectedId(customDeptInput.trim());
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer ${customDeptInput.trim() ? 'bg-teal-600 hover:bg-teal-500 shadow-xs' : 'bg-slate-400 cursor-not-allowed'
                    }`}
                >
                  Apply Custom
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCustomField(false); setCustomDeptInput(''); }}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white px-2 cursor-pointer font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ────────────────── SELECTED CLINIC REVIEW & ACTION FOOTER ────────────────── */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            {selectedDetails || customDeptInput ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {lang === 'hi' ? 'चयनित विभाग:' : 'Selected Clinic:'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30 truncate max-w-[220px]">
                    {selectedDetails ? selectedDetails.nameHi : customDeptInput}
                  </span>
                  {selectedDetails && (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                      • {selectedDetails.room} ({selectedDetails.waitTime})
                    </span>
                  )}
                </div>

                <div className="max-w-md hidden sm:block">
                  <input
                    type="text"
                    value={visitNote}
                    onChange={(e) => setVisitNote(e.target.value)}
                    placeholder={lang === 'hi' ? 'आने का मुख्य कारण / संक्षिप्त नोट (वैकल्पिक)...' : 'Reason for visit / brief note (optional)...'}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{lang === 'hi' ? 'कृपया ऊपर सूची में से अपने ओपीडी क्लिनिक का चयन करें।' : 'Please select your OPD clinic to proceed.'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-24 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 text-center"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={!selectedId && !customDeptInput.trim()}
              onClick={handleConfirm}
              className={`flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${selectedId || customDeptInput.trim()
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-600/25'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              <span>{lang === 'hi' ? 'विभाग पक्का करें व आगे बढ़ें' : 'Confirm & Proceed'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────── VIEW DETAILS SLIDE-OVER MODAL ────────────────── */}
      {inspectDept && (
        <div
          className="fixed inset-0 z-[999999999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setInspectDept(null);
          }}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-teal-500/30 rounded-3xl p-5 sm:p-6 w-[50%] max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${inspectDept.gradient}`}>
                  <inspectDept.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${inspectDept.stream === 'ayush'
                    ? 'bg-teal-500/15 text-teal-800 dark:text-teal-300'
                    : 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                    }`}>
                    {inspectDept.stream === 'ayush' ? '🌿 AYUSH' : '💊 Modern'} • {inspectDept.tag}
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {inspectDept.nameHi}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {inspectDept.nameEn}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectDept(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor & Location Details */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 text-xs">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                  {lang === 'hi' ? 'परामर्श चिकित्सक:' : 'Attending Doctor:'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {inspectDept.doctor}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {inspectDept.doctorDegree}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                  {lang === 'hi' ? 'स्थान व कक्ष:' : 'Location & Room:'}
                </span>
                <span className="font-bold text-slate-900 dark:text-white block">
                  📍 {inspectDept.room}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {inspectDept.floor} • {inspectDept.block}
                </span>
              </div>

              <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{inspectDept.timings} ({inspectDept.days})</span>
                </div>
                <div className="font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg text-xs">
                  {inspectDept.waitTime} ({inspectDept.queueCount} in queue)
                </div>
              </div>
            </div>

            {/* Symptoms list */}
            <div>
              <span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 block mb-1.5">
                {lang === 'hi' ? 'उपचारित मुख्य लक्षण व समस्याएं:' : 'Conditions Treated:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspectDept.symptomTags?.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-500/20 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-normal leading-relaxed">
                {inspectDept.symptoms}
              </p>
            </div>

            {/* Procedures */}
            {inspectDept.procedures && inspectDept.procedures.length > 0 && (
              <div>
                <span className="text-xs font-black uppercase text-teal-700 dark:text-teal-400 block mb-1.5">
                  {lang === 'hi' ? 'विशेष उपचार व नैदानिक प्रक्रियाएं:' : 'Specialized Procedures:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectDept.procedures.map((proc, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-medium"
                    >
                      {proc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Select this dept button in modal */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedId(inspectDept.id);
                  setInspectDept(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{lang === 'hi' ? 'इस क्लिनिक का चयन करें' : 'Select This Clinic'}</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectDept(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5"
              >
                {lang === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
