import React, { useState } from 'react';
import {
  X, BookOpen, Eye, Hand, MessageSquare, Heart, Activity,
  Sparkles, ShieldCheck, CheckCircle2, Flame, Droplets, Wind
} from 'lucide-react';

const ParikshaGuideModal = ({ isOpen, onClose, lang = 'hi' }) => {
  const [activeTab, setActiveTab] = useState('trividha');

  if (!isOpen) return null;

  const content = {
    hi: {
      title: 'आयुर्वेदिक नैदानिक परीक्षा मार्गदर्शिका',
      subtitle: 'त्रिविध, अष्टविध एवं दशविध परीक्षा को सरल शब्दों में समझें',
      note: 'यह एक सामान्य रोगी मार्गदर्शिका है। जो विकल्प आपको सबसे उपयुक्त लगें उन्हें चुनें, बाकी डॉक्टर क्लिनिक में स्वयं जांचेंगे।',
      tabs: {
        trividha: 'त्रिविध परीक्षा (3 मुख्य विधियाँ)',
        ashtavidha: 'अष्टविध परीक्षा (8 अंग जाँच)',
        dashavidha: 'दशविध परीक्षा (10 समग्र स्वास्थ्य पहलू)'
      },
      closeBtn: 'समझ गया, वापस जाएँ'
    },
    mr: {
      title: 'आयुर्वेदिक क्लिनिकल तपासणी मार्गदर्शिका',
      subtitle: 'त्रिविध, अष्टविध आणि दशविध परीक्षा सोप्या भाषेत समजून घ्या',
      note: 'ही रुग्णांसाठी सोपी माहिती आहे. तुम्हाला योग्य वाटणारे पर्याय निवडा, उर्वरित डॉक्टर ओपीडीमध्ये तपासतील.',
      tabs: {
        trividha: 'त्रिविध परीक्षा (३ पद्धती)',
        ashtavidha: 'अष्टविध परीक्षा (८ अवयव तपासणी)',
        dashavidha: 'दशविध परीक्षा (१० सर्वांगीण घटक)'
      },
      closeBtn: 'समजले, परत जा'
    },
    en: {
      title: 'AYUSH Clinical Examination Guide',
      subtitle: 'Understand Trividha, Ashtavidha & Dashavidha Pariksha in Plain Words',
      note: 'This is a patient-friendly guide. Select what best describes your current state, or leave it for the doctor to evaluate during your consultation.',
      tabs: {
        trividha: 'Trividha (3 Core Methods)',
        ashtavidha: 'Ashtavidha (8 Vital Checkpoints)',
        dashavidha: 'Dashavidha (10 Constitutional Factors)'
      },
      closeBtn: 'Understood, Close Guide'
    }
  };

  const t = content[lang] || content.en;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-white/10 flex items-start justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {t.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                {t.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-gray-100 dark:border-white/10 flex flex-wrap gap-2 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => setActiveTab('trividha')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'trividha'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            🌿 {t.tabs.trividha}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ashtavidha')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'ashtavidha'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            🔍 {t.tabs.ashtavidha}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dashavidha')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'dashavidha'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            ⚖️ {t.tabs.dashavidha}
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed">
          
          {/* Friendly Note Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-emerald-900 dark:text-emerald-200 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{t.note}</span>
          </div>

          {/* TAB 1: TRIVIDHA */}
          {activeTab === 'trividha' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-black text-sm">
                  <Eye className="w-4 h-4" />
                  <span>१. दर्शन (Darshana - Visual Observation)</span>
                </div>
                <p className="text-slate-600 dark:text-gray-300">
                  डॉक्टर या कियोस्क आपकी आँखों की चमक, चेहरे की रंगत, त्वचा का सूखापन या पीलापन देखकर स्वास्थ्य का आकलन करते हैं।
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">● प्राकृत (Healthy Luster)</span>
                  <span className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">● पाण्डु (Pale/Anemic)</span>
                  <span className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">● पीत (Yellowish tint)</span>
                  <span className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">● श्याव (Dark/Dull complexion)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center gap-2.5 text-teal-700 dark:text-teal-400 font-black text-sm">
                  <Hand className="w-4 h-4" />
                  <span>२. स्पर्शन (Sparshana - Tactile / Temperature)</span>
                </div>
                <p className="text-slate-600 dark:text-gray-300">
                  शरीर का तापमान और त्वचा की बनावट — क्या शरीर गर्म है (पित्त), ठंडा है (वात/कफ), या सामान्य और मुलायम है।
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400 font-black text-sm">
                  <MessageSquare className="w-4 h-4" />
                  <span>३. प्रश्न (Prashna - Clinical Inquiry)</span>
                </div>
                <p className="text-slate-600 dark:text-gray-300">
                  दर्द का प्रकार कैसा है — क्या सुई चुभने जैसा तेज दर्द है (तोद - वात), जलन या खट्टी डकार है (दाह - पित्त), या भारीपन और जकड़न है (गौरव - कफ)।
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ASHTAVIDHA */}
          {activeTab === 'ashtavidha' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-gray-400">
                योगरत्नाकर ग्रंथ के अनुसार आठ अंगों की सूक्ष्म नैदानिक परीक्षा:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs block">१. नाड़ी (Nadi - Pulse)</span>
                  <p className="text-xs text-slate-600 dark:text-gray-300">वात (सर्प गति - तेज), पित्त (मण्डूक गति - उछलती), कफ (हंस गति - धीमी व स्थिर)।</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="font-black text-teal-700 dark:text-teal-400 text-xs block">२. जिह्वा (Jihwa - Tongue)</span>
                  <p className="text-xs text-slate-600 dark:text-gray-300">सफेद परत आमा (पाचन विष) दर्शाती है, लाल जीभ पित्त प्रदाह दर्शाती है।</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="font-black text-cyan-700 dark:text-cyan-400 text-xs block">३. मल (Mala - Digestion)</span>
                  <p className="text-xs text-slate-600 dark:text-gray-300">पेट साफ होने की स्थिति — कब्ज, दस्त, या नियमित सामान्य पाचन।</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="font-black text-blue-700 dark:text-blue-400 text-xs block">४. मूत्र (Mootra - Urine)</span>
                  <p className="text-xs text-slate-600 dark:text-gray-300">पेशाब में जलन, रंग और आवृत्ति द्वारा शरीर में गर्मी व जल संतुलन।</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="font-black text-indigo-700 dark:text-indigo-400 text-xs block">५. शब्द (Shabda - Voice)</span>
                  <p className="text-xs text-slate-600 dark:text-gray-300">आवाज का भारीपन, कमजोरी या बोलने में रुकावट का आकलन।</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="font-black text-purple-700 dark:text-purple-400 text-xs block">६. स्पर्श (Sparsha - Skin)</span>
                  <p className="text-xs text-slate-600 dark:text-gray-300">त्वचा का रूखापन, पसीना या अत्यधिक गर्मी।</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="font-black text-rose-700 dark:text-rose-400 text-xs block">७. दृक (Drik - Eyes)</span>
                  <p className="text-xs text-slate-600 dark:text-gray-300">दृष्टि व आँखों में लाली, सूखापन या पीलापन।</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 space-y-1">
                  <span className="font-black text-amber-700 dark:text-amber-400 text-xs block">८. आकृति (Akruti - Build)</span>
                  <p className="text-xs text-slate-600 dark:text-gray-300">शारीरिक ढाँचा, संतुलन और वजन का समग्र स्वरूप।</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DASHAVIDHA */}
          {activeTab === 'dashavidha' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-gray-400">
                चरक संहिता के अनुसार रोगी के समग्र बल व प्रकृति का १० बिन्दुओं में आकलन:
              </p>
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                  <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-900 dark:text-amber-300 text-xs block">अग्नि (Agni - Digestive Fire):</strong>
                    <span className="text-xs text-slate-600 dark:text-gray-300">समान अग्नि (उत्तम पाचन), तीक्ष्ण (अत्यधिक भूख/एसिडिटी), मंद (भूख न लगना/आलस), विषम (अनियमित)।</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-start gap-2.5">
                  <Droplets className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-teal-900 dark:text-teal-300 text-xs block">कोष्ठ (Koshtha - Bowel Nature):</strong>
                    <span className="text-xs text-slate-600 dark:text-gray-300">मृदु कोष्ठ (दूध पीने से भी पेट साफ हो जाता है), क्रूर कोष्ठ (कब्ज रहती है), मध्यम कोष्ठ (संतुलित)।</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                  <Wind className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-900 dark:text-emerald-300 text-xs block">प्रकृति (Prakriti - Body Constitution):</strong>
                    <span className="text-xs text-slate-600 dark:text-gray-300">वात (पतले, चंचल, ठंडे प्रति संवेदनशील), पित्त (मध्यम, तेज भूख, गर्मी से परेशान), कफ (मजबूत, धीमे, शांत स्वभाव)।</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-2.5">
                  <Activity className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-purple-900 dark:text-purple-300 text-xs block">सत्त्व व बल (Satva & Physical Endurance):</strong>
                    <span className="text-xs text-slate-600 dark:text-gray-300">मानसिक सहनशीलता और शारीरिक व्यायाम करने की सामर्थ्य का स्तर।</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-end bg-slate-50 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md cursor-pointer"
          >
            {t.closeBtn}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ParikshaGuideModal;
