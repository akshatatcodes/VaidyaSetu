import React from 'react';
import { ShieldCheck, Stethoscope, Building2, Lock, FileCheck } from 'lucide-react';

const DisclaimerBanner = () => {
  return (
    <footer className="mt-auto py-10 px-4 sm:px-6 bg-gradient-to-b from-transparent via-slate-50 to-slate-100/80 border-t border-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hackathon & Clinical Authority Header Card */}
        <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl ring-1 ring-emerald-300 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  SIH 2026 • PS 26047
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
                  All India Institute of Ayurveda (AIIA)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Ministry of Ayush
                </span>
              </div>
              <h4 className="text-slate-900 font-extrabold text-xl sm:text-2xl tracking-tight">
                VaidyaSetu — Patient Case-Taking & Integrative Health Intelligence
              </h4>
              <p className="text-slate-600 text-sm mt-1">
                Standardized Clinical Triaging, Herb-Drug Interaction (HDI) Safety Bridge, and ABDM Ayushman Bharat Digital Gateway.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap md:flex-col items-start gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
            <div className="flex items-center gap-2 text-emerald-700">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-teal-700">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>ABDM M1, M2, M3 Ready</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>IMPPAT 2.0 & NAMASTE Coded</span>
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer Box */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
            <Stethoscope className="w-4 h-4 text-amber-700" />
            <span>Statutory Medical & Clinical Decision Support Disclaimer</span>
          </div>
          <p className="text-slate-700">
            VaidyaSetu is designed as an assistive Clinical Decision Support System (CDSS) for automated case-taking, preliminary Ayurvedic dosha triaging, and pharmacovigilance (herb-drug cross-reactivity). It does not replace the professional clinical diagnosis, prescription, or therapeutic judgment of a registered medical practitioner (Ayush or Allopathic). Final clinical interventions and prescription validations remain under the sole purview of attending doctors.
          </p>
        </div>

        {/* Footer Subtext & Links */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <p>© 2026 VaidyaSetu — Smart India Hackathon 2026. Built for AIIA & Ministry of Ayush.</p>
          <div className="flex items-center gap-6 text-slate-600">
            <span className="hover:text-emerald-700 cursor-pointer">ABDM Sandbox</span>
            <span className="hover:text-emerald-700 cursor-pointer">Privacy & Consent (DPDP)</span>
            <span className="hover:text-emerald-700 cursor-pointer">AIIA Clinical Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DisclaimerBanner;

