import React from 'react';
import { Shield, Lock, Eye, FileText, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto py-16 px-6 space-y-12 animate-in fade-in duration-700">
      
      <Link to="/settings" className="flex items-center gap-2 text-emerald-500 font-black uppercase tracking-widest text-[10px] hover:translate-x-[-4px] transition-transform">
         <ChevronLeft className="w-4 h-4" /> Back to Protocol Hub
      </Link>

      <div className="space-y-4">
         <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-emerald-500/10 rounded-3xl">
               <Shield className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
               <h1 className="text-5xl font-black text-gray-900 dark:text-white leading-none uppercase italic tracking-tighter">Privacy Protocol</h1>
               <p className="text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest text-[10px] mt-2">v1.2.0 • Last Audit: April 12, 2026</p>
            </div>
         </div>
         <p className="text-lg text-gray-600 dark:text-gray-300 font-medium leading-relaxed max-w-2xl">VaidyaSetu is engineered with **Privacy-First Intelligence**. Your health data is treated as a sovereign asset, protected by clinical-grade encryption and decentralized analysis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {[
           { title: 'Data Sovereignty', desc: 'You own every bit of data logged. We do not sell or trade your health interactions.', icon: Lock },
           { title: 'Zero-Knowledge AI', desc: 'RAG analysis is performed using anonymized vector embeddings to prevent leakage.', icon: Eye },
           { title: 'Audit Transparency', desc: 'Every data access event is logged in your personal history for internal audit.', icon: FileText }
         ].map(item => (
           <div key={item.title} className="p-10 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[3rem] shadow-2xl space-y-4">
              <item.icon className="w-8 h-8 text-emerald-500 opacity-50" />
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{item.desc}</p>
           </div>
         ))}
      </div>

      <div className="prose dark:prose-invert max-w-none space-y-8 text-gray-600 dark:text-gray-300">
         <section className="bg-gray-50 dark:bg-gray-900/50 p-12 rounded-[3.5rem] border border-gray-100 dark:border-white/5">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
               <div className="w-2 h-8 bg-emerald-500 rounded-full" /> 1. Information Acquisition
            </h2>
            <p>We collect essential health biometrics (vitals, laboratory results) and AI interaction transcripts solely to provide clinical safety analysis and drug-herb interaction detection.</p>
         </section>

         <section className="p-12 space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
               <div className="w-2 h-8 bg-emerald-500 rounded-full" /> 2. Security Infrastructure
            </h2>
            <p>All data transit is secured via TLS 1.3. At-rest data in the VaidyaSetu MongoDB Matrix is encrypted using AES-256. We employ Clerk Protocol for identity management, ensuring world-class authentication security.</p>
         </section>
      </div>

      <div className="p-12 bg-emerald-600 rounded-[3.5rem] text-white shadow-2xl shadow-emerald-500/20">
         <CheckCircle2 className="w-10 h-10 mb-6" />
         <h4 className="text-2xl font-black uppercase tracking-tighter leading-none italic mb-4">Clinical Compliance</h4>
         <p className="text-emerald-100 font-medium leading-relaxed uppercase tracking-tighter text-sm opacity-90">VaidyaSetu is designed to align with major digital health safety standards. We continuously refine our protocols to ensure maximum patient safety and data integrity.</p>
      </div>

    </div>
  );
};

export default Privacy;
