import React, { useState } from 'react';
import { 
  X, Target, Zap, Clock, ChevronRight, 
  RefreshCw, CheckCircle2, TrendingUp,
  AlertCircle, Trophy
} from 'lucide-react';
import axios from 'axios';

import { API_URL } from '../config/api';

const GoalsModals = ({ isOpen, onClose, onSave, clerkId }) => {
  const [formData, setFormData] = useState({
    type: 'weight',
    targetValue: '',
    unit: 'kg',
    deadline: ''
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const typeMapping = {
         weight: 'weight_goal',
         steps: 'daily_steps',
         blood_pressure: 'bp_target',
         blood_glucose: 'glucose_control',
         water: 'daily_water'
      };

      const res = await axios.post(`${API_URL}/goals`, {
        clerkId,
        goalType: typeMapping[formData.type] || formData.type,
        targetValue: parseFloat(formData.targetValue),
        unit: formData.unit,
        targetDate: formData.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      });
      if (res.data.status === 'success') {
        onSave();
        onClose();
      }
    } catch (err) {
      console.error("Save goal failed", err);
      alert("Failed to activate goal: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const goalTypes = [
    { id: 'weight', label: 'Weight Management', unit: 'kg' },
    { id: 'steps', label: 'Daily Step Count', unit: 'steps' },
    { id: 'blood_pressure', label: 'Blood Pressure Target', unit: 'mmHg' },
    { id: 'blood_glucose', label: 'Glucose Control', unit: 'mg/dL' },
    { id: 'water', label: 'Hydration Goal', unit: 'ml' }
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
        
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Define Health Goal</h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-widest">Target Selection Mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Goal Category</label>
            <div className="grid grid-cols-2 gap-2">
               {goalTypes.map(g => (
                 <button 
                    key={g.id}
                    onClick={() => setFormData({...formData, type: g.id, unit: g.unit})}
                    className={`p-4 rounded-2xl text-left border transition-all ${formData.type === g.id ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-emerald-500/30'}`}
                 >
                    <div className="text-[10px] font-black uppercase mb-1">{g.id.replace('_', ' ')}</div>
                    <div className="text-xs font-bold">{g.label}</div>
                 </button>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Target Value</label>
                <div className="relative">
                   <input 
                     type="number" 
                     className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none"
                     onChange={(e) => setFormData({...formData, targetValue: e.target.value})}
                   />
                   <span className="absolute right-4 top-4 text-xs font-bold text-gray-700 dark:text-gray-300">{formData.unit}</span>
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-widest">Deadline (Optional)</label>
                <input 
                   type="date" 
                   className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-sm text-gray-900 dark:text-white outline-none"
                   onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                />
             </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl flex gap-3 items-start">
             <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
             <p className="text-[10px] text-blue-400 font-medium leading-relaxed uppercase tracking-tighter">Your current value for this metric is tracked automatically. Progress will be displayed in the dashboard timeline.</p>
          </div>
        </div>

        <div className="p-8 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
           <button 
             onClick={handleSave}
             disabled={saving || !formData.targetValue}
             className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
           >
             {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
             Activate Goal Protocol
           </button>
        </div>
      </div>
    </div>
  );
};

export default GoalsModals;
