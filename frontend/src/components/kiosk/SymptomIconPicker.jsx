import React from 'react';
import {
  Thermometer, Heart, Wind, Bone, Brain, Activity, Droplets,
  Flame, Sparkles, User, ShieldAlert, AlertCircle
} from 'lucide-react';

/** Most common hospital OPD symptoms for rapid 1-tap chief-complaint intake */
const OPD_COMMON_SYMPTOMS = [
  {
    id: 'fever',
    label: { en: 'Fever', hi: 'तेज बुखार', mr: 'ताप' },
    sub: { en: 'High body temp & chills', hi: 'शरीर गर्म व कंपकंपी', mr: 'अंगात उष्णता व थंडी' },
    icon: Thermometer,
    color: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
    text: 'Fever (तेज बुखार)'
  },
  {
    id: 'cough_cold',
    label: { en: 'Cough & Cold', hi: 'खांसी व जुकाम', mr: 'खोकला व सर्दी' },
    sub: { en: 'Runny nose, phlegm, sneezing', hi: 'कफ, बहती नाक, छींकें', mr: 'कफ, वाहणारे नाक, शिंका' },
    icon: Wind,
    color: 'text-cyan-500 border-cyan-500/30 bg-cyan-500/10',
    text: 'Cough and Cold (खांसी व जुकाम)'
  },
  {
    id: 'headache',
    label: { en: 'Headache', hi: 'सिरदर्द', mr: 'डोकेदुखी' },
    sub: { en: 'Throbbing, migraine, tension', hi: 'सिर में भारीपन व दर्द', mr: 'डोक्यात जडपणा व कळ' },
    icon: Brain,
    color: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
    text: 'Headache (सिरदर्द)'
  },
  {
    id: 'acidity',
    label: { en: 'Acidity & Gas', hi: 'एसिडिटी व गैस', mr: 'पित्त व जळजळ' },
    sub: { en: 'Heartburn, nausea, bloating', hi: 'छाती व पेट में जलन', mr: 'छातीत जळजळ व अपचन' },
    icon: Flame,
    color: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
    text: 'Acidity and Gastric problem (एसिडिटी व पेट में जलन)'
  },
  {
    id: 'stomach',
    label: { en: 'Abdominal Pain', hi: 'पेट दर्द', mr: 'पोटदुखी' },
    sub: { en: 'Cramps, indigestion, loose motion', hi: 'पेट में मरोड़ या दर्द', mr: 'पोटात मुरडा किंवा दुखणे' },
    icon: Activity,
    color: 'text-rose-500 border-rose-500/30 bg-rose-500/10',
    text: 'Abdominal pain (पेट दर्द)'
  },
  {
    id: 'joint_pain',
    label: { en: 'Knee & Joint Pain', hi: 'घुटने व जोड़ों का दर्द', mr: 'गुडघे व सांधेदुखी' },
    sub: { en: 'Stiffness, swelling, difficulty walking', hi: 'चलने में तकलीफ व सूजन', mr: 'चालताना त्रास व सूज' },
    icon: Bone,
    color: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    text: 'Knee and Joint Pain (घुटने व जोड़ों में दर्द)'
  },
  {
    id: 'back_pain',
    label: { en: 'Backache / Spine', hi: 'कमर व पीठ दर्द', mr: 'पाठ व कंबरदुखी' },
    sub: { en: 'Lower back stiffness, sciatica', hi: 'उठने-बैठने में जकड़न', mr: 'उठताना-बसताना कळ' },
    icon: Bone,
    color: 'text-indigo-500 border-indigo-500/30 bg-indigo-500/10',
    text: 'Lower backache (कमर व पीठ में दर्द)'
  },
  {
    id: 'chest_pain',
    label: { en: 'Chest Pain / Tightness', hi: 'छाती में दर्द व भारीपन', mr: 'छातीत दुखणे' },
    sub: { en: 'Pressure, palpitations, breathlessness', hi: 'घबराहट व दबाव', mr: 'धडधड व अस्वस्थता' },
    icon: Heart,
    color: 'text-red-500 border-red-500/30 bg-red-500/10',
    text: 'Chest pain and discomfort (छाती में दर्द)'
  },
  {
    id: 'throat',
    label: { en: 'Sore Throat', hi: 'गले में दर्द व खराश', mr: 'घसा खवखवणे' },
    sub: { en: 'Difficulty swallowing, tonsillitis', hi: 'निगलने में दर्द', mr: 'गिळताना त्रास' },
    icon: AlertCircle,
    color: 'text-teal-500 border-teal-500/30 bg-teal-500/10',
    text: 'Sore throat (गले में दर्द व खराश)'
  },
  {
    id: 'skin',
    label: { en: 'Skin Rash & Itching', hi: 'त्वचा रोग व खुजली', mr: 'खाज व त्वचारोग' },
    sub: { en: 'Allergies, boils, red patches', hi: 'दाद, खाज व लाल चकत्ते', mr: 'खाज व त्वचेवर पुरळ' },
    icon: Sparkles,
    color: 'text-pink-500 border-pink-500/30 bg-pink-500/10',
    text: 'Skin allergy and itching (त्वचा रोग व खुजली)'
  },
  {
    id: 'weakness',
    label: { en: 'Fatigue & Weakness', hi: 'कमजोरी व सुस्ती', mr: 'अशक्तपणा व थकवा' },
    sub: { en: 'Low energy, dizziness, body ache', hi: 'चक्कर आना व बदन दर्द', mr: 'चक्कर येणे व अंगदुखी' },
    icon: Droplets,
    color: 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
    text: 'General fatigue and weakness (कमजोरी व थकान)'
  },
  {
    id: 'hypertension',
    label: { en: 'High BP Checkup', hi: 'बीपी व उच्च रक्तचाप', mr: 'उच्च रक्तदाब तपासणी' },
    sub: { en: 'Routine BP, heavy head, anxiety', hi: 'रक्तचाप जांच व घबराहट', mr: 'बीपी तपासणी व अस्वस्थता' },
    icon: ShieldAlert,
    color: 'text-emerald-600 border-emerald-600/30 bg-emerald-600/10',
    text: 'Hypertension checkup (उच्च रक्तचाप की जांच)'
  }
];

export default function SymptomIconPicker({ lang = 'hi', value, onSelect }) {
  const currentLang = ['hi', 'mr', 'en'].includes(lang) ? lang : 'en';

  return (
    <div className="space-y-2.5 my-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-gray-300">
          {currentLang === 'hi' ? 'सबसे सामान्य ओपीडी लक्षण (1-टैप चुनें):' : currentLang === 'mr' ? 'सर्वात सामान्य ओपीडी लक्षणे (१-टॅप निवडा):' : 'Most Common OPD Symptoms (1-Tap to select):'}
        </span>
        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
          {currentLang === 'hi' ? 'अथवा नीचे बोलें / टाइप करें' : currentLang === 'mr' ? 'किंवा खाली बोला / टाईप करा' : 'Or speak / type below'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {OPD_COMMON_SYMPTOMS.map((s) => {
          const Icon = s.icon;
          const isSelected = value && value.toLowerCase().includes(s.id);

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.text)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-400/30 shadow-md scale-[1.02]'
                  : 'bg-white/80 dark:bg-white/5 border-gray-200/80 dark:border-white/10 hover:border-emerald-400/50 hover:bg-emerald-50/20'
              }`}
            >
              <div className={`p-2 rounded-xl border shrink-0 ${s.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {s.label[currentLang]}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-snug truncate mt-0.5">
                  {s.sub[currentLang]}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { OPD_COMMON_SYMPTOMS };
