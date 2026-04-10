import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

const DisclaimerBanner = () => {
  return (
    <footer className="mt-20 border-t border-gray-800 bg-gray-900/50 backdrop-blur-xl py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 flex flex-col md:flex-row gap-6 items-start">
           <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
              <AlertTriangle className="w-8 h-8" />
           </div>
           <div>
              <h4 className="text-white font-bold mb-2">Medical Disclaimer</h4>
              <p className="text-sm text-gray-400 leading-relaxed max-w-4xl">
                VaidyaSetu is an AI-powered health assistant designed for educational and screening purposes only. 
                The insights, risk scores, and interaction alerts provided are generated based on clinical databases and the Llama 3 model. 
                They do <strong>not</strong> constitute medical advice, diagnosis, or treatment. 
                Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. 
                Never disregard professional medical advice or delay in seeking it because of something you have read on this platform.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                 <Info className="w-3 h-3" /> Powered by Groq Llama 3 & IMPPAT Database
              </div>
           </div>
        </div>
        
        <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs font-medium">
           <p>© 2026 VaidyaSetu. Bridge to Balanced Health.</p>
           <div className="flex gap-6">
              <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-emerald-500 transition-colors">Contact Support</a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default DisclaimerBanner;
