import React from 'react';
import { Shield, FileText, ChevronLeft, Zap, Database, AlertCircle, CheckCircle2 } from 'lucide-react';

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col gap-6">
        <button 
          onClick={() => window.history.back()}
          className="w-max p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Return to App</span>
        </button>
        <div>
           <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl"><FileText className="w-6 h-6 text-blue-500" /></div>
              <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em]">Legal Directive</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight uppercase italic underline decoration-blue-500/20 underline-offset-8">Terms of Service</h1>
           <p className="text-xs text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500" /> Effective Date: April 2026 • v1.2.0-Alpha
           </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-8 md:p-16 rounded-[4rem] shadow-2xl relative overflow-hidden">
         {/* Background Elements */}
         <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
            <FileText className="w-64 h-64" />
         </div>

         <div className="relative z-10 space-y-16">
            
            <section className="space-y-6">
               <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                  <span className="text-blue-500">01.</span> Medical Disclaimer
               </h2>
               <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-500/20 rounded-3xl">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 leading-relaxed uppercase tracking-widest italic">
                    VaidyaSetu is an AI-augmented health tracking platform, not a replacement for professional medical advice, diagnosis, or treatment. Wait for a licensed physician to interpret any system alerts or predictive diagnostics before making medical decisions.
                  </p>
               </div>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                  <span className="text-blue-500">02.</span> AI Analysis & Accuracy
               </h2>
               <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  <p>Our platform aggregates data using Scikit-Learn models and Llama-3 integrations for disease prediction and drug-herb interactions. By using the app, you agree that algorithmic outputs are probabilistic, not definitive.</p>
                  <ul className="space-y-3 mt-4">
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <span>Data inputs (prescriptions, labs) processed via Vision/OCR may contain extraction errors. Always verify parsed data.</span>
                     </li>
                     <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                        <span>The "Safety Bridge" interaction engine alerts are strictly advisory.</span>
                     </li>
                  </ul>
               </div>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                  <span className="text-blue-500">03.</span> Consent to Data Processing
               </h2>
               <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  <p>You explicitly consent to the parsing, temporary storage, and vectorization of your medical documents for the purpose of operational functionality (RAG processing, chart building). As outlined in our Privacy Protocol, you retain full sovereignty to purge your data permanently at any time.</p>
               </div>
               <button onClick={() => window.location.href='/settings'} className="px-6 py-3 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-colors">
                  Review Consent in Settings
               </button>
            </section>

            <section className="space-y-6">
               <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-4">
                  <span className="text-blue-500">04.</span> Account Deletion & Sovereignty
               </h2>
               <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  We guarantee the "Right to be Forgotten". Utilizing the "Permanent Purge" function in the Settings Hub will immediately and irreversibly wipe all biometric data linked to your Clerk authentication identity.
               </p>
            </section>
            
         </div>
      </div>
    </div>
  );
};

export default Terms;
