import React from 'react';
import { Shield, CheckCircle2, Lock, FileText, AlertCircle, X } from 'lucide-react';

export default function ConsentPolicyModal({ isOpen, onClose, lang = 'hi' }) {
  if (!isOpen) return null;

  const isHindi = lang === 'hi';
  const isMarathi = lang === 'mr';

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-emerald-500/30 flex flex-col max-h-[90vh] overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">
                {isHindi
                  ? 'रोगी सहमति व डेटा सुरक्षा नियम (ABDM / DPDP नीति)'
                  : isMarathi
                  ? 'रुग्ण संमती आणि डेटा सुरक्षा नियम (ABDM / DPDP धोरण)'
                  : 'Patient Consent & Health Data Governance Rules'}
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                National Health Authority (ABDM) & DPDP Act 2023 Statutory Disclosure
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Policy Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-gray-300">
          
          {/* Section 1: Purpose of Data Collection */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-2">
            <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {isHindi
                ? '1. डेटा संग्रह का विशिष्ट उद्देश्य (Purpose of Data Collection)'
                : isMarathi
                ? '१. डेटा संकलनाचा उद्देश (Purpose of Collection)'
                : '1. Specific Purpose of Data Collection'}
            </h3>
            <p>
              {isHindi
                ? 'वैद्यसेतु कियोस्क द्वारा आपका नाम, आभा (ABHA) आईडी, शारीरिक लक्षण, तापमान, रक्तचाप एवं पूर्व दवाओं की जानकारी केवल ओपीडी परामर्श, डॉक्टर के लिए केस सारांश तैयार करने और आयुर्वेदिक व एलोपैथिक दवाओं के बीच परस्पर सुरक्षा (Herb-Drug Interaction) जांच हेतु दर्ज की जाती है।'
                : isMarathi
                ? 'वैद्यसेतु कियोस्कद्वारे आपले नाव, आभा (ABHA) क्रमांक, शारीरिक लक्षणे, रक्तदाब आणि मागील औषधांची माहिती केवळ ओपीडी सल्लामसलत, डॉक्टरांसाठी केस सारांश आणि औषध सुरक्षेच्या तपासणीसाठी घेतली जाते.'
                : 'VaidyaSetu collects your demographic data, ABHA ID, clinical symptoms, vital telemetry, and prior medication history solely to prepare your OPD case sheet, triage emergency priority, and perform bi-directional Herb-Drug Interaction safety analysis.'}
            </p>
          </div>

          {/* Section 2: DPDP Act 2023 Patient Rights */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-500" />
              {isHindi
                ? '2. डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP Act 2023) अधिकार'
                : isMarathi
                ? '२. डिजिटल वैयक्तिक डेटा संरक्षण (DPDP कायदा २०२३) हक्क'
                : '2. Patient Data Rights under DPDP Act 2023'}
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>{isHindi ? 'पहुंच का अधिकार (Right to Access):' : isMarathi ? 'प्रवेशाचा हक्क:' : 'Right to Access:'}</strong>{' '}
                {isHindi
                  ? 'आप किसी भी समय अपने पेशेंट पोर्टल अथवा ABHA ऐप के माध्यम से अपने दर्ज किए गए सभी रिकॉर्ड देख सकते हैं।'
                  : isMarathi
                  ? 'आपण कोणत्याही वेळी आपल्या पेशंट पोर्टलद्वारे आपले वैद्यकीय रेकॉर्ड पाहू शकता.'
                  : 'You can review all recorded symptoms and vitals anytime via the VaidyaSetu Patient Sanctuary.'}
              </li>
              <li>
                <strong>{isHindi ? 'सहमति वापसी (Right to Revoke Consent):' : isMarathi ? 'संमती मागे घेणे:' : 'Right to Revoke:'}</strong>{' '}
                {isHindi
                  ? 'आप जब चाहें अपनी सहमति वापस ले सकते हैं। सहमति वापस लेने पर भी आपकी आपातकालीन चिकित्सा सेवा प्रभावित नहीं होगी।'
                  : isMarathi
                  ? 'आपण कधीही आपली संमती मागे घेऊ शकता. यामुळे आपल्या आपत्कालीन वैद्यकीय सेवेवर कोणताही परिणाम होणार नाही.'
                  : 'You may withdraw or modify consent anytime through the Consent Management settings.'}
              </li>
              <li>
                <strong>{isHindi ? 'डेटा न्यूनतमकरण (Data Minimization):' : isMarathi ? 'डेटा किमानता:' : 'Data Minimization:'}</strong>{' '}
                {isHindi
                  ? 'केवल वही जानकारी ली जाती है जो डॉक्टर के चिकित्सीय परामर्श के लिए अनिवार्य है।'
                  : isMarathi
                  ? 'केवळ डॉक्टरांच्या वैद्यकीय सल्ल्यासाठी आवश्यक असलेली माहितीच गोळा केली जाते.'
                  : 'Only clinically necessary health attributes are processed.'}
              </li>
            </ul>
          </div>

          {/* Section 3: Confidentiality & Ayush EHR Compliance */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              {isHindi
                ? '3. गोपनीयता, सुरक्षा एवं आयुष ईएचआर मानक'
                : isMarathi
                ? '३. गोपनीयता आणि आयुष ईएचआर मानके'
                : '3. Confidentiality & Ayush EHR Standards'}
            </h3>
            <p>
              {isHindi
                ? 'सभी स्वास्थ्य आंकड़े एईएस-256 (AES-256) एन्क्रिप्शन द्वारा सुरक्षित रखे जाते हैं। यह डेटा केवल आपके अधिकृत ओपीडी डॉक्टर और परामर्शदाता संस्थान (AIIA / Ayush Hospital) के साथ ही साझा किया जाता है, किसी भी व्यावसायिक तीसरे पक्ष को नहीं दिया जाता।'
                : isMarathi
                ? 'सर्व वैद्यकीय माहिती AES-256 एन्क्रिप्शनद्वारे पूर्णपणे सुरक्षित ठेवली जाते आणि केवळ आपल्या डॉक्टरांसोबत शेअर केली जाते.'
                : 'All health records are encrypted at rest (AES-256) and in transit (TLS 1.3). No health data is ever sold or shared with non-clinical third parties.'}
            </p>
          </div>

          {/* Section 4: Emergency Assistance Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-normal">
              {isHindi
                ? 'महत्वपूर्ण: यदि आपको अत्यधिक सीने में दर्द, सांस लेने में कठिनाई या बेहोशी जैसे आपातकालीन लक्षण हैं, तो कियोस्क में समय न लगाएं और तुरंत अस्पताल आपातकालीन वार्ड (Emergency/Casualty) में जाएं।'
                : isMarathi
                ? 'महत्त्वाचे: छातीत तीव्र कळ, दम लागणे किंवा भोवळ आल्यास तातडीने आपत्कालीन कक्ष (Casualty) मध्ये जा.'
                : 'Emergency Notice: If experiencing acute chest pain or respiratory distress, proceed directly to the Emergency Casualty Ward immediately.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-gray-400">
            {isHindi ? 'आयुष्मान भारत डिजिटल मिशन (ABDM) व डीपीआईआईटी दिशानिर्देश' : 'ABDM Health Data Management Policy Compliant'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            {isHindi ? 'मैंने नियम पढ़ लिए हैं (स्वीकार करें)' : isMarathi ? 'मी नियम वाचले आहेत (स्वीकारा)' : 'I Understand & Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
