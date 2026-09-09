import React, { useState } from 'react';
import {
  HelpCircle, Phone, Stethoscope, Mic, FileText, UserCheck, ShieldCheck,
  ChevronDown, ChevronUp, MessageSquare, AlertTriangle, ExternalLink, Sparkles
} from 'lucide-react';

const FAQS = [
  {
    q: "How does the AI determine my OPD Department?",
    a: "During voice intake (Step 2), our AI clinical engine analyzes your chief complaint symptoms, anatomical pain site, and severity against AYUSH and Allopathic diagnostic criteria to recommend the appropriate department (e.g. Kayachikitsa for internal medicine, Shalya Tantra for musculoskeletal joints)."
  },
  {
    q: "What is Caregiver / Family Mode?",
    a: "Caregiver Mode allows a family member (parent, spouse, child, or guardian) to complete the kiosk intake on behalf of an elderly relative or minor. Patient privacy is protected under the DPDP Act via an OTP consent verification gate."
  },
  {
    q: "Do I need to scan past prescriptions if I am a first-time patient?",
    a: "No! Paper prescription scan is 100% optional. First-time visitors can complete basic 45-second kiosk check-in immediately and upload old records later from home."
  },
  {
    q: "How does Herb-Drug Interaction (HDI) Safety work?",
    a: "When you take Ayurvedic herbal formulations alongside Allopathic medicines, our real-time safety matrix checks for potential drug interactions (such as Ashwagandha + Sedatives or Warfarin + Guggulu) to alert your consulting physician."
  },
  {
    q: "What is the ABDM Sandbox / Simulated Sync Mode?",
    a: "Your consultation summary and prescriptions are formatted into NRCeS NDHM compliant FHIR R4 bundles. In demonstration/sandbox mode, transactions are logged safely without altering live national health registries."
  }
];

const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-8 animate-in fade-in duration-300">
      
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-emerald-500/30 relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" /> Patient Guidance & OPD Support
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            How Can We Assist You Today?
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-2xl leading-relaxed">
            Get instant answers regarding your OPD Token, Voice Intake guidance, Caregiver Mode, and emergency healthcare hotlines.
          </p>
        </div>
      </div>

      {/* ── EMERGENCY HOTLINES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/30 text-slate-900 dark:text-white flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center font-black shrink-0">
            <Phone className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-red-500 tracking-wider block">National Emergency Ambulance</span>
            <span className="text-xl font-black font-mono">108 / 112</span>
            <p className="text-[11px] text-gray-500">24/7 Immediate Casualty Response</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-teal-500/10 border-2 border-teal-500/30 text-slate-900 dark:text-white flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black shrink-0">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider block">AYUSH Tele-Consultation Hotline</span>
            <span className="text-xl font-black font-mono">14443</span>
            <p className="text-[11px] text-gray-500">Ministry of Ayush National Helpline</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-slate-900 dark:text-white flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">AIIA OPD Reception Desk</span>
            <span className="text-xl font-black font-mono">011-29948658</span>
            <p className="text-[11px] text-gray-500">Mon-Sat (8:00 AM - 4:00 PM)</p>
          </div>
        </div>

      </div>

      {/* ── 3-STEP KIOSK GUIDE ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          3-Step MediKiosk Quick Intake Guide
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm">
              1
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Identity & Caregiver</h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
              Enter your ABHA ID or mobile number. If you are checking in for a relative or child, check "Caregiver Mode".
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-sm">
              2
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Voice & Touch Intake</h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
              Speak naturally in your preferred language or tap symptom chips. The AI guides you through 4-5 focused questions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500 text-white font-black flex items-center justify-center text-sm">
              3
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Get OPD Token</h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
              Receive your printed or digital OPD token. Proceed directly to your designated consultation room room number.
            </p>
          </div>
        </div>
      </div>

      {/* ── FREQUENTLY ASKED QUESTIONS (FAQS) ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-5">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-500" />
          Frequently Asked Questions (FAQs)
        </h2>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-black text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-4 cursor-pointer hover:text-emerald-500"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-emerald-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-gray-300 leading-relaxed border-t border-gray-200/60 dark:border-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEEDBACK / SUPPORT FORM ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-emerald-500/20 shadow-xl space-y-4">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          Send Kiosk / App Feedback
        </h2>

        {feedbackSent ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Thank you for your feedback! Our OPD team has received your message.
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="Share your experience or report any issue with kiosk intake, voice recognition, or token printing..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-300 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={!feedback.trim()}
              onClick={() => {
                setFeedbackSent(true);
                setFeedback('');
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs transition-all shadow-md cursor-pointer"
            >
              Submit Feedback
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default HelpSupport;
