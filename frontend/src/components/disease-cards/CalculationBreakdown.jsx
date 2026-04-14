import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Info } from 'lucide-react';

const CalculationBreakdown = ({ factors, protective, finalScore }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <th className="pb-4 pl-2">Clinical Factor</th>
              <th className="pb-4">Your Value</th>
              <th className="pb-4 text-right pr-2">Impact</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {/* Contributing Factors */}
            {factors.map((f, i) => (
              <motion.tr 
                key={f.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-gray-50 dark:hover:bg-emerald-500/5 transition-colors border-b border-gray-50 dark:border-gray-800/50 last:border-0"
              >
                <td className="py-4 pl-2">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-900 dark:text-gray-200">{f.name}</span>
                    <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative group/tooltip">
                        <Info className="w-3 h-3 text-gray-400" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-[10px] text-white rounded-lg hidden group-hover/tooltip:block z-50 shadow-2xl">
                          {f.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 font-medium text-gray-600 dark:text-gray-400 capitalize">
                  {f.displayValue}
                </td>
                <td className="py-4 text-right pr-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${f.direction === 'increase' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                    {f.direction === 'increase' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {f.direction === 'increase' ? '+' : '-'}{f.impact}%
                  </span>
                </td>
              </motion.tr>
            ))}

            {/* Protective Factors */}
            {protective.map((p, i) => (
              <motion.tr 
                key={p.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (factors.length + i) * 0.05 }}
                className="bg-emerald-50/30 dark:bg-emerald-500/5 group hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-colors border-b border-gray-50 dark:border-gray-800/50"
              >
                <td className="py-4 pl-2">
                  <div className="flex items-center">
                    <Target className="w-3 h-3 mr-2 text-emerald-500" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{p.name}</span>
                  </div>
                </td>
                <td className="py-4 font-medium text-gray-600 dark:text-gray-400">
                  {p.displayValue}
                </td>
                <td className="py-4 text-right pr-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -{p.impact}%
                  </span>
                </td>
              </motion.tr>
            ))}

            {/* Final Total Row */}
            <tr className="bg-gray-50 dark:bg-gray-900/80">
              <td className="py-4 pl-4 rounded-l-2xl font-black uppercase tracking-widest text-[10px] text-gray-400">
                Processed Health Risk
              </td>
              <td></td>
              <td className="py-4 text-right pr-4 rounded-r-2xl font-black text-xl text-gray-900 dark:text-white">
                {finalScore}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalculationBreakdown;
