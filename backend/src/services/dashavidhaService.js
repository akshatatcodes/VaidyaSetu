/**
 * Ayurvedic adaptive questionnaire (Agni, Koshtha, Ahara-Vihara, Nidra, habits).
 * Collects RAW answers only — never auto-classifies Prakriti/Vikriti.
 * Physician confirms classification in the doctor dashboard.
 */
const { LOCALES } = require('../data/socratesQuestionTemplates');

const AYURVEDA_DEPARTMENTS = [
  'Kayachikitsa',
  'Panchakarma',
  'Shalya',
  'Shalakya',
  'Prasuti & Stri Roga',
  'Prasuti',
  'Kaumarbhritya',
  'Swasthavritta'
];

const DASHAVIDHA_STEPS = ['agni', 'koshtha', 'aharaVihara', 'nidra', 'malaMutra'];

const AYURVEDA_TEMPLATES = {
  agni: {
    en: "How is your appetite and digestion? Do you feel hungry regularly, irregularly, or weakly?",
    hi: "आपकी भूख और पाचन कैसा है? भूख नियमित, अनियमित या कमजोर लगती है?",
    mr: "तुमची भूक आणि पचन कसे आहे? भूक नियमित, अनियमित की अशक्त वाटते?",
    ta: "உங்கள் பசி மற்றும் செரிமானம் எப்படி? வழக்கமானதா, ஒழுங்கற்றதா அல்லது பலவீனமா?",
    te: "మీ ఆకలి మరియు జీర్ణక్రియ ఎలా ఉంది? క్రమంగా, అక్రమంగా లేదా బలహీనంగా?",
    bn: "আপনার ক্ষুধা ও হজম কেমন? নিয়মিত, অনিয়মিত নাকি দুর্বল?",
    gu: "તમારી ભૂખ અને પાચન કેવું છે? નિયમિત, અનિયમિત કે નબળું?",
    kn: "ನಿಮ್ಮ ಹಸಿವು ಮತ್ತು ಜೀರ್ಣಕ್ರಿಯೆ ಹೇಗಿದೆ? ನಿಯಮಿತ, ಅನಿಯಮಿತ ಅಥವಾ ದುರ್ಬಲ?",
    ml: "നിങ്ങളുടെ വിശപ്പും ദഹനവും എങ്ങനെ? ക്രമമായോ അക്രമമായോ ദുർബലമായോ?",
    or: "ଆପଣଙ୍କ ଭୋକ ଓ ପାଚନ କିପରି? ନିୟମିତ, ଅନିୟମିତ ନା ଦୁର୍ବଳ?",
    pa: "ਤੁਹਾਡੀ ਭੁੱਖ ਅਤੇ ਪਾਚਨ ਕਿਵੇਂ ਹੈ? ਨਿਯਮਿਤ, ਅਨਿਯਮਿਤ ਜਾਂ ਕਮਜ਼ੋਰ?",
    as: "আপোনাৰ ভোক আৰু হজম কেনেকুৱা? নিয়মিত, অনিয়মিত নে দুৰ্বল?",
    ur: "آپ کی بھوک اور ہاضمہ کیسا ہے؟ باقاعدہ، غیر باقاعدہ یا کمزور؟"
  },
  koshtha: {
    en: "How are your bowel habits? Soft and easy, hard and difficult, or mixed?",
    hi: "आपकी मल त्याग की आदत कैसी है? नरम और आसान, कठोर और कठिन, या मिश्रित?",
    mr: "तुमची मलविसर्जन सवय कशी आहे? मऊ व सोपी, कठीण, की मिश्र?",
    ta: "மலப்பழக்கம் எப்படி? மென்மையானது, கடினமானது அல்லது கலவையானது?",
    te: "మలవిసర్జన అలవాట్లు ఎలా ఉన్నాయి? మృదువు, కఠినం లేదా మిశ్రమం?",
    bn: "মলত্যাগের অভ্যাস কেমন? নরম, শক্ত নাকি মিশ্র?",
    gu: "મળત્યાગની આદત કેવી? નરમ, સખત કે મિશ્ર?",
    kn: "ಮಲವಿಸರ್ಜನೆ ಹೇಗಿದೆ? ಮೃದು, ಕಠಿಣ ಅಥವಾ ಮಿಶ್ರ?",
    ml: "മലവിസർജന ശീലം എങ്ങനെ? മൃദു, കഠിനം അല്ലെങ്കിൽ മിശ്രിതം?",
    or: "ମଳତ୍ୟାଗ ଅଭ୍ୟାସ କିପରି? ନରମ, କଠିନ ନା ମିଶ୍ର?",
    pa: "ਮਲ-ਤਿਆਗ ਆਦਤ ਕਿਵੇਂ ਹੈ? ਨਰਮ, ਸਖ਼ਤ ਜਾਂ ਮਿਸ਼ਰਤ?",
    as: "মলত্যাগ অভ্যাস কেনেকুৱা? নৰম, কঠিন নে মিশ্ৰ?",
    ur: "پیشاب پاخانہ کی عادت کیسی ہے؟ نرم، سخت یا مخلوط؟"
  },
  aharaVihara: {
    en: "Describe your usual diet and daily routine (meals timing, activity, exposure to cold/heat).",
    hi: "अपना सामान्य आहार और दिनचर्या बताएं (भोजन समय, गतिविधि, ठंड/गर्मी).",
    mr: "तुमचा नेहमीचा आहार व दिनचर्या सांगा (जेवण वेळ, हालचाल, थंडी/उष्णता).",
    ta: "வழக்கமான உணவு மற்றும் அன்றாட வழக்கத்தை விவரிக்கவும்.",
    te: "మీ సాధారణ ఆహారం మరియు దినచర్యను వివరించండి.",
    bn: "আপনার সাধারণ খাদ্য ও দৈনন্দিন রুটিন বর্ণনা করুন।",
    gu: "તમારો સામાન્ય આહાર અને દિનચર્યા વર્ણવો.",
    kn: "ನಿಮ್ಮ ಸಾಮಾನ್ಯ ಆಹಾರ ಮತ್ತು ದಿನಚರಿಯನ್ನು ವಿವರಿಸಿ.",
    ml: "നിങ്ങളുടെ സാധാരണ ഭക്ഷണവും ദിനചര്യയും വിവരിക്കുക.",
    or: "ଆପଣଙ୍କ ସାଧାରଣ ଖାଦ୍ୟ ଓ ଦୈନନ୍ଦିନ ରୁଟିନ୍ ବର୍ଣ୍ଣନା କରନ୍ତୁ।",
    pa: "ਆਪਣੀ ਆਮ ਖੁਰਾਕ ਅਤੇ ਰੋਜ਼ਾਨਾ ਰੁਟੀਨ ਦੱਸੋ।",
    as: "আপোনাৰ সাধাৰণ খাদ্য আৰু দৈনন্দিন ৰুটিন বৰ্ণনা কৰক।",
    ur: "اپنی معمول کی خوراک اور روزمرہ کی روٹین بیان کریں۔"
  },
  nidra: {
    en: "How is your sleep? Deep and refreshing, light and interrupted, or excessive daytime sleepiness?",
    hi: "आपकी नींद कैसी है? गहरी और ताज़गी भरी, हल्की और टूटने वाली, या दिन में ज्यादा नींद?",
    mr: "तुमची झोप कशी आहे? खोल व ताजेतवाने, हलकी व तुटणारी, की दिवसा जास्त झोप?",
    ta: "தூக்கம் எப்படி? ஆழ்ந்தது, இடைப்பட்டது அல்லது பகல் அதிக தூக்கமா?",
    te: "నిద్ర ఎలా ఉంది? లోతైనది, అంతరాయం లేదా పగటి నిద్ర అధికం?",
    bn: "ঘুম কেমন? গভীর, বিঘ্নিত নাকি দিনে অতিরিক্ত ঘুম?",
    gu: "ઊંઘ કેવી? ઊંડી, તૂટતી કે દિવસે વધુ ઊંઘ?",
    kn: "ನಿದ್ರೆ ಹೇಗಿದೆ? ಆಳವಾದ, ಮಧ್ಯದಲ್ಲಿ ಕೆದಕುವ ಅಥವಾ ಹಗಲು ಹೆಚ್ಚು?",
    ml: "ഉറക്കം എങ്ങനെ? ആഴമുള്ളത്, തടസ്സപ്പെടുന്നത് അല്ലെങ്കിൽ പകൽ അധികം?",
    or: "ନିଦ୍ରା କିପରି? ଗଭୀର, ବାଧାପ୍ରାପ୍ତ ନା ଦିନରେ ଅଧିକ?",
    pa: "ਨੀਂਦ ਕਿਵੇਂ ਹੈ? ਡੂੰਘੀ, ਟੁੱਟਣ ਵਾਲੀ ਜਾਂ ਦਿਨ ਵਿੱਚ ਵੱਧ?",
    as: "নিদ্ৰা কেনেকুৱা? গভীৰ, বাধাপ্ৰাপ্ত নে দিনত অধিক?",
    ur: "نیند کیسی ہے؟ گہری، ٹوٹنے والی یا دن میں زیادہ؟"
  },
  malaMutra: {
    en: "Any changes in urine or stool colour, frequency, or discomfort while passing?",
    hi: "मूत्र या मल के रंग, आवृत्ति या त्याग में कोई असुविधा है?",
    mr: "मूत्र किंवा मलाच्या रंगात, वारंवारतेत किंवा त्यागात अडचण आहे का?",
    ta: "சிறுநீர் அல்லது மல நிறம், அதிர்வு அல்லது அசௌகரியம் மாறியுள்ளதா?",
    te: "మూత్రం లేదా మల రంగు, పౌనఃపున్యం లేదా అసౌకర్యం మార్పులు ఉన్నాయా?",
    bn: "প্রস্রাব বা মলের রঙ, কম্পাঙ্ক বা অস্বস্তি পরিবর্তন আছে কি?",
    gu: "મૂત્ર કે મળના રંગ, આવૃત્તિ કે અસુવિધામાં ફેરફાર?",
    kn: "ಮೂತ್ರ ಅಥವಾ ಮಲದ ಬಣ್ಣ, ಆವರ್ತನ ಅಥವಾ ಅಸೌಕರ್ಯ ಬದಲಾವಣೆಗಳಿವೆಯೇ?",
    ml: "മൂത്രം അല്ലെങ്കിൽ മലത്തിന്റെ നിറം, ആവൃത്തി അല്ലെങ്കിൽ അസ്വസ്ഥത മാറ്റങ്ങളുണ്ടോ?",
    or: "ମୂତ୍ର କିମ୍ବା ମଳ ରଙ୍ଗ, ବାରମ୍ବାରତା କିମ୍ବା ଅସୁବିଧା ପରିବର୍ତ୍ତନ?",
    pa: "ਪਿਸ਼ਾਬ ਜਾਂ ਮਲ ਦੇ ਰੰਗ, ਆਵਿਰਤੀ ਜਾਂ ਅਸੁਵਿਧਾ ਵਿੱਚ ਤਬਦੀਲੀ?",
    as: "প্ৰস্ৰাৱ বা মলৰ ৰং, কম্পাঙ্ক বা অসুবিধাৰ পৰিৱৰ্তন আছে নেকি?",
    ur: "پیشاب یا پاخانہ کے رنگ، تعداد یا تکلیف میں کوئی تبدیلی؟"
  }
};

function resolveLang(language = 'hi') {
  const lang = String(language || 'hi').toLowerCase().slice(0, 2);
  return LOCALES.includes(lang) ? lang : 'en';
}

function isAyurvedaDepartment(department = '') {
  return AYURVEDA_DEPARTMENTS.includes(department);
}

function getNextAyurvedaStep(state = {}) {
  for (const step of DASHAVIDHA_STEPS) {
    if (!state[step]) return step;
  }
  return null;
}

function processAyurvedaProbe({
  userSpeech,
  currentStep,
  ayurvedaState = {},
  language = 'hi'
}) {
  const lang = resolveLang(language);
  const updated = { ...ayurvedaState };
  if (currentStep && userSpeech) {
    updated[currentStep] = userSpeech;
  }

  const nextStep = getNextAyurvedaStep(updated);
  const isComplete = nextStep === null;
  let nextQuestion = null;
  if (!isComplete) {
    nextQuestion = AYURVEDA_TEMPLATES[nextStep]?.[lang] || AYURVEDA_TEMPLATES[nextStep]?.en;
  } else {
    nextQuestion = {
      en: "Thank you. Ayurvedic assessment answers are saved for physician review — classification is not auto-assigned.",
      hi: "धन्यवाद। आयुर्वेदिक उत्तर डॉक्टर की समीक्षा हेतु सहेजे गए — वर्गीकरण स्वतः नहीं किया गया।",
      mr: "धन्यवाद. आयुर्वेदिक उत्तरे डॉक्टर पुनरावलोकनासाठी जतन — वर्गीकरण स्वयंचलित नाही."
    }[lang] || AYURVEDA_TEMPLATES.agni.en;
  }

  return {
    nextStep,
    nextQuestion,
    isComplete,
    ayurvedaAnswers: updated,
    // Explicit: never auto-classify prakriti/vikriti
    suggestedClassification: null,
    physicianConfirmationRequired: true
  };
}

module.exports = {
  AYURVEDA_DEPARTMENTS,
  DASHAVIDHA_STEPS,
  AYURVEDA_TEMPLATES,
  isAyurvedaDepartment,
  getNextAyurvedaStep,
  processAyurvedaProbe
};
