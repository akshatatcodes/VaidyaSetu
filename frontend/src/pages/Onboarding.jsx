import React, { useEffect } from 'react';
import useOnboardingStore from '../store/useOnboardingStore';
import Step1Biometrics from './onboarding/Step1Biometrics';
import Step2Lifestyle from './onboarding/Step2Lifestyle';
import Step3Diet from './onboarding/Step3Diet';
import Step4WomenHealth from './onboarding/Step4WomenHealth';
import Step5Respiratory from './onboarding/Step5Respiratory';
import Step6MentalHealth from './onboarding/Step6MentalHealth';
import Step7History from './onboarding/Step7History';
import { Activity } from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';

const Onboarding = () => {
  const { step, setStep } = useOnboardingStore();

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

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center py-12 px-4">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-4 border border-emerald-500/20">
            <Activity className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">
            Build Your Health <span className="text-emerald-500">Baseline</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Complete your profile to activate intelligent safety tracking.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-12 relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -translate-y-1/2 z-0" />
          {steps.map((s) => (
            <div
              key={s.id}
              className={`relative z-10 flex flex-col items-center`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step >= s.id
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-gray-950 border-gray-800 text-gray-500'
                }`}
              >
                {s.id}
              </div>
              <span className={`text-[10px] uppercase tracking-widest mt-2 font-semibold ${
                step >= s.id ? 'text-emerald-400' : 'text-gray-600'
              }`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="card border-emerald-500/10 bg-gray-900/40 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl">
          {renderStep()}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
            <p className="text-gray-600 text-[10px] uppercase tracking-[0.2em]">
                Secure • ICMR Standards • Confidential
            </p>
        </div>
      </div>
      <div className="w-full mt-12">
        <DisclaimerBanner />
      </div>
    </div>
  );
};

export default Onboarding;
