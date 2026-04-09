"use client";

import React, { forwardRef } from 'react';
import { Pill, AlertTriangle, BrainCircuit, HeartPulse, Activity } from 'lucide-react';

interface MedicalReportProps {
  user: any;
  diseases: string[];
  medicines: string[];
  report: any;
  language: string;
}

const MedicalReport = forwardRef<HTMLDivElement, MedicalReportProps>(({ user, diseases, medicines, report, language }, ref) => {
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const hasInteractions = report?.interactionWarnings?.length > 0;
  const interactionCount = report?.interactionWarnings?.length || 0;

  return (
    <div 
      ref={ref}
      style={{ width: '800px' }} // Fixed width for consistent PDF generation
      className="bg-white text-gray-900 p-10 font-sans shadow-2xl mx-auto"
    >
      {/* Header */}
      <div className="border-b-2 border-emerald-600 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight">VaidyaSetu</h1>
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest">Hybrid AI Health Safety Report</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Report Intelligence</p>
          <p className="text-sm font-medium">{date}</p>
          <p className="text-xs text-gray-400">ID: {user?.id?.substring(0, 8) || 'VS-GUEST'}</p>
        </div>
      </div>

      {/* Patient Profile */}
      <div className="grid grid-cols-3 gap-6 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
          <p className="text-sm font-bold text-gray-800 flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${hasInteractions ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            {hasInteractions ? 'Attention Required' : 'Clinically Stable'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Active Conditions</p>
          <p className="text-sm font-bold text-gray-800">{diseases.length > 0 ? diseases.join(', ') : 'None Reported'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Language</p>
          <p className="text-sm font-bold text-gray-800">{language}</p>
        </div>
      </div>

      {/* Primary Insight */}
      {report?.aiInsight && (
        <div className="mb-10 bg-emerald-50 border-l-4 border-emerald-500 p-6 rounded-r-2xl">
          <div className="flex items-center mb-3">
            <BrainCircuit className="w-5 h-5 text-emerald-700 mr-2" />
            <h3 className="text-lg font-bold text-emerald-900 leading-none">AI Physician's Interpretive Insight</h3>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed italic">
            "{report.aiInsight}"
          </p>
        </div>
      )}

      {/* Safety Matrix */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="border border-gray-200 rounded-2xl p-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-red-500" /> Interaction Risk Assessment
          </h4>
          {hasInteractions ? (
            <div className="space-y-4">
              {report.interactionWarnings.map((w: any, i: number) => (
                <div key={i} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="text-sm font-bold text-red-700">{w.medA} ↔ {w.medB}</p>
                  <p className="text-xs text-gray-600 mb-1">{w.reason}</p>
                  <p className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-md inline-block">
                    PROV. RECOM: {w.recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No drug-drug or drug-herb interactions detected across identified substances.</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-2xl p-6 bg-blue-50/30">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center">
            <Pill className="w-4 h-4 mr-2 text-blue-500" /> Prescribed Substance Mapping
          </h4>
          <div className="space-y-2">
            {report?.identifiedMedicines?.map((m: any, i: number) => (
              <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                <p className="text-xs font-bold text-gray-800">{m.name}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${m.category === 'Ayurveda' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {m.category}
                </span>
              </div>
            ))}
            {(!report?.identifiedMedicines || report.identifiedMedicines.length === 0) && (
              <p className="text-xs text-gray-400 italic">No medicines identified in this session.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommendations & Alternatives */}
      <div className="mb-10">
        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center tracking-widest">
          <Activity className="w-4 h-4 mr-2 text-indigo-500" /> Local Intelligence & Alternatives
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {report?.alternatives?.map((alt: any, i: number) => (
            <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between mb-1">
                <p className="text-sm font-bold text-gray-800">{alt.name}</p>
                <span className="text-[9px] font-bold bg-gray-200 px-1.5 py-0.5 rounded uppercase">{alt.type}</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">{alt.reason}</p>
            </div>
          ))}
          {(!report?.alternatives || report.alternatives.length === 0) && (
             <div className="col-span-2 text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl">
               No alternative suggestions generated for this profile.
             </div>
          )}
        </div>
      </div>

      {/* AYUSH Protocols */}
      {report?.diseaseWarnings?.length > 0 && (
        <div className="mb-10">
          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center tracking-widest">
            <HeartPulse className="w-4 h-4 mr-2 text-emerald-600" /> Integrative AYUSH Protocols
          </h4>
          <div className="space-y-4">
            {report.diseaseWarnings.map((dw: any, i: number) => (
              <div key={i} className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <p className="text-sm font-bold text-emerald-800 mb-2 uppercase text-xs tracking-wider">{dw.condition} Protocol</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">General Advice</p>
                    <ul className="text-[11px] text-gray-600 list-disc list-inside">
                      {dw.generalAdvice.slice(0, 3).map((a: string, j: number) => <li key={j}>{a}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">AYUSH Insight</p>
                    <p className="text-[11px] text-emerald-700 leading-tight">{dw.ayushAdvice}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-100 text-center">
        <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-tighter max-w-lg mx-auto">
          Disclaimer: This report is generated by VaidyaSetu AI (Layered Static Engine + Llama-3 Reasoning). It is NOT a professional diagnosis. 
          Consult a registered medical practitioner (MBBS/BAMS) before changing any medications or beginning new protocols.
        </p>
        <p className="text-[10px] font-bold text-emerald-600 mt-4 tracking-[0.3em] uppercase">VaidyaSetu Health Resilience Platform</p>
      </div>
    </div>
  );
});

MedicalReport.displayName = 'MedicalReport';

export default MedicalReport;
