import React, { useState, useMemo } from 'react';
import {
  Thermometer, Heart, Wind, Bone, Brain, Activity, Droplets,
  Flame, Sparkles, AlertCircle, Check, ArrowRight, X,
  ShieldCheck, CheckCircle2, RotateCcw
} from 'lucide-react';

/** Most common hospital OPD symptoms for rapid multi-tap chief-complaint intake */
const OPD_COMMON_SYMPTOMS = [
  {
    id: 'fever',
    category: 'fever',
    label: { en: 'Fever & Chills', hi: 'तेज बुखार व ठंड', mr: 'ताप व थंडी' },
    sub: { en: 'High body temp & chills', hi: 'शरीर गर्म व कंपकंपी', mr: 'अंगात उष्णता व थंडी' },
    icon: Thermometer,
    color: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30',
    gradient: 'from-amber-500/20 to-orange-500/20',
    text: 'Fever with chills (तेज बुखार व ठंड)'
  },
  {
    id: 'cough_cold',
    category: 'fever',
    label: { en: 'Cough & Cold', hi: 'खांसी व जुकाम', mr: 'खोकला व सर्दी' },
    sub: { en: 'Runny nose, phlegm, sneezing', hi: 'कफ, बहती नाक, छींकें', mr: 'कफ, वाहणारे नाक, शिंका' },
    icon: Wind,
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
    gradient: 'from-cyan-500/20 to-sky-500/20',
    text: 'Cough and Cold (खांसी व जुकाम)'
  },
  {
    id: 'headache',
    category: 'pain',
    label: { en: 'Headache / Migraine', hi: 'सिरदर्द व माइग्रेन', mr: 'डोकेदुखी' },
    sub: { en: 'Throbbing, tension, heavy head', hi: 'सिर में भारीपन व तेज दर्द', mr: 'डोक्यात जडपणा व कळ' },
    icon: Brain,
    color: 'text-purple-600 dark:text-purple-400 bg-purple-500/15 border-purple-500/30',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    text: 'Headache (सिरदर्द व माइग्रेन)'
  },
  {
    id: 'acidity',
    category: 'digest',
    label: { en: 'Acidity & Gas', hi: 'एसिडिटी व गैस', mr: 'पित्त व जळजळ' },
    sub: { en: 'Heartburn, nausea, bloating', hi: 'छाती व पेट में जलन, खट्टी डकार', mr: 'छातीत जळजळ व अपचन' },
    icon: Flame,
    color: 'text-orange-600 dark:text-orange-400 bg-orange-500/15 border-orange-500/30',
    gradient: 'from-orange-500/20 to-amber-500/20',
    text: 'Acidity and Gastric problem (एसिडिटी व गैस)'
  },
  {
    id: 'stomach',
    category: 'digest',
    label: { en: 'Abdominal Pain', hi: 'पेट दर्द व मरोड़', mr: 'पोटदुखी' },
    sub: { en: 'Cramps, indigestion, loose motion', hi: 'पेट में मरोड़ या तेज दर्द', mr: 'पोटात मुरडा किंवा दुखणे' },
    icon: Activity,
    color: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30',
    gradient: 'from-rose-500/20 to-red-500/20',
    text: 'Abdominal pain (पेट दर्द व मरोड़)'
  },
  {
    id: 'joint_pain',
    category: 'pain',
    label: { en: 'Knee & Joint Pain', hi: 'घुटने व जोड़ों का दर्द', mr: 'गुडघे व सांधेदुखी' },
    sub: { en: 'Stiffness, swelling, difficulty walking', hi: 'चलने में तकलीफ व सूजन', mr: 'चालताना त्रास व सूज' },
    icon: Bone,
    color: 'text-blue-600 dark:text-blue-400 bg-blue-500/15 border-blue-500/30',
    gradient: 'from-blue-500/20 to-indigo-500/20',
    text: 'Knee and Joint Pain (घुटने व जोड़ों में दर्द)'
  },
  {
    id: 'back_pain',
    category: 'pain',
    label: { en: 'Backache / Spine', hi: 'कमर व पीठ दर्द', mr: 'पाठ व कंबरदुखी' },
    sub: { en: 'Lower back stiffness, sciatica', hi: 'उठने-बैठने में जकड़न व दर्द', mr: 'उठताना-बसताना कळ' },
    icon: Bone,
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
    gradient: 'from-indigo-500/20 to-purple-500/20',
    text: 'Lower backache (कमर व पीठ में दर्द)'
  },
  {
    id: 'chest_pain',
    category: 'cardio',
    label: { en: 'Chest Pain / Tightness', hi: 'छाती में दर्द व भारीपन', mr: 'छातीत दुखणे' },
    sub: { en: 'Pressure, palpitations, breathlessness', hi: 'घबराहट, सीने में दबाव', mr: 'धडधड व अस्वस्थता' },
    icon: Heart,
    color: 'text-red-600 dark:text-red-400 bg-red-500/15 border-red-500/30',
    gradient: 'from-red-500/20 to-rose-500/20',
    text: 'Chest pain and discomfort (छाती में दर्द व भारीपन)'
  },
  {
    id: 'throat',
    category: 'fever',
    label: { en: 'Sore Throat / Tonsils', hi: 'गले में दर्द व खराश', mr: 'घसा खवखवणे' },
    sub: { en: 'Difficulty swallowing, tonsillitis', hi: 'निगलने में दर्द व टॉन्सिल', mr: 'गिळताना त्रास' },
    icon: AlertCircle,
    color: 'text-teal-600 dark:text-teal-400 bg-teal-500/15 border-teal-500/30',
    gradient: 'from-teal-500/20 to-emerald-500/20',
    text: 'Sore throat (गले में दर्द व खराश)'
  },
  {
    id: 'skin',
    category: 'skin',
    label: { en: 'Skin Rash & Itching', hi: 'त्वचा रोग व खुजली', mr: 'खाज व त्वचारोग' },
    sub: { en: 'Allergies, boils, red patches', hi: 'दाद, खाज व लाल चकत्ते', mr: 'खाज व त्वचेवर पुरळ' },
    icon: Sparkles,
    color: 'text-pink-600 dark:text-pink-400 bg-pink-500/15 border-pink-500/30',
    gradient: 'from-pink-500/20 to-rose-500/20',
    text: 'Skin allergy and itching (त्वचा रोग व खुजली)'
  },
  {
    id: 'weakness',
    category: 'fever',
    label: { en: 'Fatigue & Weakness', hi: 'कमजोरी व सुस्ती', mr: 'अशक्तपणा व थकवा' },
    sub: { en: 'Low energy, dizziness, body ache', hi: 'चक्कर आना व बदन दर्द', mr: 'चक्कर येणे व अंगदुखी' },
    icon: Droplets,
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    text: 'General fatigue and weakness (कमजोरी व थकान)'
  },
  {
    id: 'hypertension',
    category: 'cardio',
    label: { en: 'High BP Checkup', hi: 'बीपी व उच्च रक्तचाप', mr: 'उच्च रक्तदाब तपासणी' },
    sub: { en: 'Routine BP, heavy head, anxiety', hi: 'रक्तचाप जांच व घबराहट', mr: 'बीपी तपासणी व अस्वस्थता' },
    icon: ShieldCheck,
    color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-600/15 border-emerald-600/30',
    gradient: 'from-emerald-600/20 to-teal-600/20',
    text: 'Hypertension checkup (उच्च रक्तचाप की जांच)'
  }
];

const CATEGORIES = [
  { id: 'all', label: { en: 'All (12)', hi: '⭐ सभी लक्षण (12)', mr: 'सर्व लक्षणे (12)' } },
  { id: 'fever', label: { en: 'Fever & Cold', hi: '🔥 बुखार व जुकाम', mr: 'ताप व सर्दी' } },
  { id: 'pain', label: { en: 'Joints & Pain', hi: '🦴 दर्द व जोड़', mr: 'सांधे व कंबरदुखी' } },
  { id: 'digest', label: { en: 'Stomach & Gas', hi: '⚡ पेट व एसिडिटी', mr: 'पोट व जळजळ' } },
  { id: 'cardio', label: { en: 'Chest & BP', hi: '❤️ सीना व बीपी', mr: 'छाती व बीपी' } },
  { id: 'skin', label: { en: 'Skin & Allergy', hi: '✨ त्वचा व खुजली', mr: 'त्वचा व खाज' } }
];

export default function SymptomIconPicker({ lang = 'hi', value, onSelect, onConfirm }) {
  const currentLang = ['hi', 'mr', 'en'].includes(lang) ? lang : 'en';
  const [selectedList, setSelectedList] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredSymptoms = useMemo(() => {
    if (activeCategory === 'all') return OPD_COMMON_SYMPTOMS;
    return OPD_COMMON_SYMPTOMS.filter(s => s.category === activeCategory);
  }, [activeCategory]);

  const toggleSymptom = (item) => {
    setSelectedList(prev => {
      const exists = prev.some(s => s.id === item.id);
      if (exists) {
        return prev.filter(s => s.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleClearAll = () => {
    setSelectedList([]);
  };

  const handleConfirm = () => {
    if (selectedList.length === 0) return;
    const combinedText = selectedList.map(s => s.label[currentLang] || s.text).join(', ');
    if (onConfirm) {
      onConfirm(combinedText, selectedList);
    } else if (onSelect) {
      onSelect(combinedText);
    }
  };

  return (
    <div className="space-y-3 my-2 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/90 border border-emerald-500/30 shadow-lg select-none">
      {/* Header & Category Filter Bar */}
      <div className="space-y-2.5 pb-2.5 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wide">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>{currentLang === 'hi' ? 'लक्षण चुनें' : 'Select Symptoms'}</span>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-gray-400 hidden sm:inline">
              {currentLang === 'hi' ? 'अपनी तकलीफ पर टैप करें (1 या अधिक)' : 'Select all symptoms that apply'}
            </span>
          </div>

          {selectedList.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black shadow-xs flex items-center gap-1 animate-in zoom-in-75">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>{selectedList.length} {currentLang === 'hi' ? 'चुने' : 'Selected'}</span>
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer flex items-center gap-1"
                title="Clear all selected"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 active:scale-95 ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                }`}
              >
                <span>{cat.label[currentLang] || cat.label.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Symptoms (Vibrant, Tactile & No-Truncation Mobile Card) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        {filteredSymptoms.map((s) => {
          const Icon = s.icon;
          const isSelected = selectedList.some(item => item.id === s.id) || (value && value.toLowerCase().includes(s.id));

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleSymptom(s)}
              className={`group flex flex-col justify-between p-2.5 sm:p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative select-none active:scale-[0.98] min-h-[105px] sm:min-h-[120px] ${
                isSelected
                  ? 'bg-gradient-to-br from-emerald-50 to-teal-50/70 dark:from-emerald-950/60 dark:to-teal-950/40 border-emerald-500 ring-2 ring-emerald-500/25 shadow-md scale-[1.01]'
                  : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 hover:border-emerald-400 hover:bg-white dark:hover:bg-slate-800 shadow-xs'
              }`}
            >
              {/* Top Header: Icon + Checkmark / Selection Dot */}
              <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
                <div className={`p-1.5 sm:p-2 rounded-xl border shadow-2xs shrink-0 transition-transform group-hover:scale-105 ${s.color}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs animate-in zoom-in-50 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-emerald-400 transition-colors shrink-0" />
                )}
              </div>

              {/* Text Info: Full Width with 2-Line Wrapping, ZERO Truncation */}
              <div className="w-full">
                <div className={`text-[11px] sm:text-xs font-black leading-snug line-clamp-2 break-words transition-colors ${
                  isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                }`}>
                  {s.label[currentLang]}
                </div>
                <div className="text-[9px] sm:text-[10px] text-slate-500 dark:text-gray-400 leading-tight mt-0.5 line-clamp-2 break-words">
                  {s.sub[currentLang]}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Symptoms Interactive Strip & Confirmation CTA */}
      {selectedList.length > 0 && (
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
            <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 shrink-0 mr-1">
              चयनित ({selectedList.length}):
            </span>
            {selectedList.map(item => (
              <span
                key={item.id}
                onClick={() => toggleSymptom(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30 text-[11px] font-bold cursor-pointer hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300 transition-colors shadow-2xs group"
                title="Click to remove"
              >
                <span>{item.label[currentLang]}</span>
                <X className="w-3 h-3 text-slate-400 group-hover:text-red-600" />
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {currentLang === 'hi'
                ? `लक्षण दर्ज करें (${selectedList.length} चुने गए) व आगे बढ़ें`
                : currentLang === 'mr'
                ? `लक्षणे नोंदवा (${selectedList.length} निवडली) व पुढे जा`
                : `Confirm Symptoms (${selectedList.length} Selected) & Continue`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export { OPD_COMMON_SYMPTOMS };
