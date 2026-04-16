import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import useOnboardingStore from '../store/useOnboardingStore';
import Step1Biometrics from './onboarding/Step1Biometrics';
import Step2Lifestyle from './onboarding/Step2Lifestyle';
import Step3Diet from './onboarding/Step3Diet';
import Step4WomenHealth from './onboarding/Step4WomenHealth';
import Step5Respiratory from './onboarding/Step5Respiratory';
import Step6MentalHealth from './onboarding/Step6MentalHealth';
import Step7History from './onboarding/Step7History';
import { Activity, Shield, Zap, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DisclaimerBanner from '../components/DisclaimerBanner';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const Onboarding = () => {
  const { step, setStep, formData, updateFormData, resetOnboarding } = useOnboardingStore();
  const { theme } = useTheme();
  const { user, isLoaded } = useUser();

  // Multi-user protection: Reset if userId has changed
  useEffect(() => {
    if (isLoaded && user) {
        if (formData.userId && formData.userId !== user.id) {
            resetOnboarding();
            updateFormData({ userId: user.id });
        } else if (!formData.userId) {
            updateFormData({ userId: user.id });
        }
    }
  }, [isLoaded, user, formData.userId]);

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Biometrics />;
      case 2: return <Step2Lifestyle />;
      case 3: return <Step3Diet />;
      case 4: return <Step4WomenHealth />;
      case 5: return <Step5Respiratory />;
      case 6: return <Step6MentalHealth />;
      case 7: return <Step7History />;
      default: return <Step1Biometrics />;
    }
  };

  const steps = [
    { id: 1, title: 'Biometrics' },
    { id: 2, title: 'Lifestyle' },
    { id: 3, title: 'Diet' },
    { id: 4, title: 'Women\'s' },
    { id: 5, title: 'Resp.' },
    { id: 6, title: 'Mental' },
    { id: 7, title: 'History' },
  ];

  const handleStepClick = (sId) => {
    // Optional: Only allow clicking steps you've already reached or the next one
    setStep(sId);
  };

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500 bg-slate-50 dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex flex-col items-center py-8 px-4 scroll-smooth">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full dark:bg-emerald-500/10 blur-[130px] pointer-events-none z-0" style={{background: theme === 'dark' ? '' : 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)'}} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full dark:bg-blue-500/10 blur-[130px] pointer-events-none z-0" style={{background: theme === 'dark' ? '' : 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)'}} />

      <div className="max-w-6xl w-full z-10 flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* Left Side: Summary & Progress (Visible on lg+) */}
        <div className="hidden lg:flex flex-col w-64 space-y-4 sticky top-12">
            <div className="p-5 bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl">
                <div className="flex items-center space-x-2.5 mb-5">
                    <div className="p-1.5 bg-emerald-500 rounded-lg">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-[11px] tracking-tight text-gray-500 uppercase">Health Matrix</span>
                </div>
                
                <div className="space-y-3">
                    <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / 7) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        <span>Progress</span>
                        <span className="text-emerald-500">{Math.round((step / 7) * 100)}%</span>
                    </div>
                </div>

                <div className="mt-6 space-y-2.5">
                    {steps.map(s => (
                        <button 
                            key={s.id} 
                            onClick={() => handleStepClick(s.id)}
                            className="flex items-center space-x-2.5 w-full text-left group"
                        >
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
                                step > s.id ? 'bg-emerald-500 text-white' : 
                                step === s.id ? 'border-[1.5px] border-emerald-500 text-emerald-500' : 
                                'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:border-gray-300'
                            }`}>
                                {step > s.id ? <CheckCircle2 className="w-2.5 h-2.5" /> : s.id}
                            </div>
                            <span className={`text-[11px] font-medium transition-colors ${step >= s.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 group-hover:text-gray-500'}`}>
                                {s.title}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase">AI Insights</span>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-emerald-500/50 leading-relaxed italic">
                    Building your baseline activates active risk monitoring.
                </p>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-2xl w-full">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20 shadow-xl shadow-emerald-500/10"
              >
                <Activity className="w-8 h-8 text-emerald-500" />
              </motion.div>
              <h1 className="text-3xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 text-center">
                Setup Your Core Profile
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto text-center">
                Step <span className="text-emerald-500 font-bold">{step}</span> of 7: <span className="text-gray-900 dark:text-white font-medium">{steps[step-1].title}</span>
              </p>
            </div>

            {/* Mobile Progress Bar */}
            <div className="flex lg:hidden justify-between items-center mb-6 relative px-4">
              <div className="absolute top-[18px] left-0 w-full h-[1.5px] bg-gray-200 dark:bg-gray-800 -z-10" />
              <div 
                className="absolute top-[18px] left-0 h-[1.5px] bg-emerald-500 transition-all duration-700 -z-10" 
                style={{ width: `${(step - 1) / (steps.length - 1) * 100}%` }}
              />
              {steps.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => handleStepClick(s.id)}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-[1.5px] transition-all duration-500 ${
                    step >= s.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}>
                    <span className="text-[10px] font-bold">{s.id}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Form Content */}
            <div className="relative group p-[1px] rounded-[2.5rem] overflow-hidden transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <div className="relative bg-white/95 dark:bg-white/[0.03] backdrop-blur-3xl border border-gray-200/50 dark:border-white/10 p-6 md:p-8 rounded-[2.4rem] shadow-2xl overflow-hidden min-h-[380px]">
                 
                 {/* Navigation Buttons Row */}
                 <div className="flex justify-between items-center mb-6">
                    <button 
                        onClick={() => setStep(Math.max(1, step - 1))}
                        disabled={step === 1}
                        className={`p-2 rounded-full transition-all ${step === 1 ? 'opacity-20 cursor-not-allowed' : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'}`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <div className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{steps[step-1].title}</span>
                    </div>

                    <button 
                        onClick={() => setStep(Math.min(7, step + 1))}
                        disabled={step === 7}
                        className={`p-2 rounded-full transition-all ${step === 7 ? 'opacity-20 cursor-not-allowed' : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'}`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="relative z-10">
                   <AnimatePresence mode="wait">
                     <motion.div
                       key={step}
                       initial={{ x: 10, opacity: 0 }}
                       animate={{ x: 0, opacity: 1 }}
                       exit={{ x: -10, opacity: 0 }}
                       transition={{ duration: 0.25 }}
                     >
                        {renderStep()}
                     </motion.div>
                   </AnimatePresence>
                 </div>
              </div>
            </div>

            {/* Footer info */}
            <div className="mt-6 text-center sm:block hidden">
                <div className="flex items-center justify-center gap-6 text-gray-400 dark:text-gray-500 text-[9px] uppercase tracking-[0.2em] font-medium opacity-60">
                    <span className="flex items-center gap-2">Secure</span>
                    <span className="flex items-center gap-2">ICMR Standards</span>
                    <span className="flex items-center gap-2">Confidential</span>
                </div>
            </div>
        </div>
      </div>
      
      <div className="w-full mt-10 max-w-4xl opacity-40 hover:opacity-100 transition-opacity">
        <DisclaimerBanner />
      </div>

      <ThemeToggle />
    </div>
  );
};

export default Onboarding;
