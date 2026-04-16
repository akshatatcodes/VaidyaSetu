import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const DisclaimerBanner = () => {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/5 rounded-[3rem] p-10 md:p-16 flex flex-col items-center text-center gap-8 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0" />
           <div className="p-5 bg-red-500/10 text-red-500 rounded-3xl group-hover:scale-110 transition-transform duration-500 ring-1 ring-red-500/20">
              <AlertTriangle className="w-10 h-10" />
           </div>
            <div className="max-w-4xl space-y-6">
              <h4 className="text-gray-900 dark:text-white font-black mb-4 text-3xl tracking-tighter">{t('disclaimer.title')}</h4>
              <p className="text-lg text-slate-600 dark:text-gray-300 leading-relaxed font-medium italic">
                {t('disclaimer.main')}
              </p>
              <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed font-medium">
                {t('disclaimer.secondary')}
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-500">
                 <Info className="w-3.5 h-3.5" /> Powered by Groq Llama 3 & IMPPAT Database
              </div>
            </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col items-center text-center gap-6 text-gray-400 dark:text-gray-500 text-[11px] font-bold uppercase tracking-[0.1em]">
           <p>© 2026 VaidyaSetu. Bridge to Balanced Health.</p>
           <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Contact Support</a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default DisclaimerBanner;
