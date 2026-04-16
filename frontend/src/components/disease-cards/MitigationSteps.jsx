import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronUp, Star, Coffee, Leaf, Activity } from 'lucide-react';

const MitigationSteps = ({ steps }) => {
  const [expandedId, setExpandedId] = React.useState(null);

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'bg-rose-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'dietary': return <Coffee className="w-3.5 h-3.5 mr-2" />;
      case 'lifestyle': return <Activity className="w-3.5 h-3.5 mr-2" />;
      case 'monitoring': return <Star className="w-3.5 h-3.5 mr-2" />;
      default: return <Leaf className="w-3.5 h-3.5 mr-2" />;
    }
  };

  if (!steps || steps.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 px-2">
        <div className="p-1.5 bg-emerald-500/10 rounded-lg">
          <Lightbulb className="w-4 h-4 text-emerald-500" />
        </div>
        <h5 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">
          Personalized Recovery Strategy
        </h5>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div 
            key={step.id} 
            className="group bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden transition-all hover:border-emerald-500/20 shadow-sm"
          >
            <button 
              onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center space-x-3">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${getPriorityColor(step.priority)}`}>
                  {step.priority}
                </span>
                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{step.title}</span>
              </div>
              {expandedId === step.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-emerald-500" />}
            </button>

            <AnimatePresence>
              {expandedId === step.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 overflow-hidden"
                >
                  <div className="pt-2 border-t border-gray-50 dark:border-gray-800/50">
                    <div className="flex items-center text-[10px] font-black tracking-widest text-emerald-500 mb-2 uppercase">
                      {getCategoryIcon(step.category)}
                      {step.category}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                      {step.description}
                    </p>
                    {step.isRegional && (
                      <div className="mt-3 flex items-center text-[9px] text-emerald-600 dark:text-emerald-500/70 font-bold bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10 w-fit">
                        🇮🇳 Indian Ingredient/Context
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MitigationSteps;
