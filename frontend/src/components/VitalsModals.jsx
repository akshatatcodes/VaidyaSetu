import React, { useState } from 'react';
import { 
  X, Activity, Droplets, Scale, Footprints, 
  Moon, Heart, AlertCircle, Info, CheckCircle2,
  Clock, Calendar, ChevronRight, Zap, RefreshCw,
  Thermometer, Wind, Stethoscope
} from 'lucide-react';

const ModalWrapper = ({ isOpen, onClose, title, icon: Icon, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
        
        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Icon className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Add new reading to your timeline</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-8 relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

const VitalsModals = ({ 
  modalType, 
  isOpen, 
  onClose, 
  onSave, 
  saving, 
  userProfile 
}) => {
  const [formData, setFormData] = useState({});

  const handleSave = () => {
    if (!formData) return;
    try {
        onSave(formData);
        setTimeout(() => setFormData({}), 1000);
    } catch (e) {
        alert('Save Error: ' + e.message);
    }
  };

  const renderBP = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Systolic (High)</label>
          <input 
            type="number" 
            placeholder="120"
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
            onChange={(e) => setFormData({...formData, systolic: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Diastolic (Low)</label>
          <input 
            type="number" 
            placeholder="80"
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
            onChange={(e) => setFormData({...formData, diastolic: e.target.value})}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Reading Time</label>
          <input 
            type="time" 
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none"
            onChange={(e) => setFormData({...formData, time: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
          <input 
            type="text" 
            placeholder="Relaxed, after exercise, etc."
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none"
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>
      </div>
      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
         <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
            <Info className="w-3 h-3" /> Target Range
         </div>
         <p className="text-xs text-gray-700 dark:text-gray-300">Normal BP is typically around <span className="text-emerald-500 font-bold">120/80 mmHg</span>. Readings above 140/90 are considered high.</p>
      </div>
    </div>
  );

  const renderGlucose = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Glucose Level (mg/dL)</label>
        <input 
          type="number" 
          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
          onChange={(e) => setFormData({...formData, value: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Meal Context</label>
        <select 
          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none"
          onChange={(e) => setFormData({...formData, context: e.target.value})}
        >
          <option value="fasting">Fasting</option>
          <option value="before_meal">Before Meal</option>
          <option value="after_meal">After Meal (2h Post)</option>
          <option value="bedtime">Bedtime</option>
        </select>
      </div>
    </div>
  );

  const renderWeight = () => {
    const height = userProfile?.height || 170; // fallback cm
    const bmi = formData.value ? (formData.value / ((height/100)*(height/100))).toFixed(1) : '--';
    
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Weight (kg)</label>
          <input 
            type="number" 
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
            onChange={(e) => setFormData({...formData, value: e.target.value})}
          />
        </div>
        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-[2rem]">
          <div>
            <div className="text-[10px] text-gray-700 dark:text-gray-300 uppercase font-black tracking-widest ">Calculated BMI</div>
            <div className="text-3xl font-black text-emerald-500">{bmi}</div>
          </div>
          <div className="text-right">
             <div className="text-[10px] text-gray-700 dark:text-gray-300 uppercase font-bold">Profile Height</div>
             <div className="text-sm font-bold text-gray-900 dark:text-white">{height} cm</div>
          </div>
        </div>
      </div>
    );
  };

  const renderWater = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setFormData({value: 250})}
          className="p-6 bg-emerald-500/5 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-3xl transition-all flex flex-col items-center gap-2"
        >
          <Droplets className="w-8 h-8" />
          <span className="font-black">250 ml</span>
        </button>
        <button 
          onClick={() => setFormData({value: 500})}
          className="p-6 bg-emerald-500/5 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-3xl transition-all flex flex-col items-center gap-2"
        >
          <Droplets className="w-8 h-8" />
          <span className="font-black">500 ml</span>
        </button>
      </div>
      <div className="relative group">
        <input 
          type="number" 
          placeholder="Or enter custom amount (ml)..."
          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none"
          value={formData.value || ''}
          onChange={(e) => setFormData({...formData, value: e.target.value})}
        />
      </div>
    </div>
  );

  const config = {
    bp: { title: 'Blood Pressure', icon: Heart, render: renderBP },
    glucose: { title: 'Blood Glucose', icon: Activity, render: renderGlucose },
    weight: { title: 'Body Weight', icon: Scale, render: renderWeight },
    water: { title: 'Hydration Intake', icon: Droplets, render: renderWater },
    steps: { title: 'Activity Steps', icon: Footprints, render: () => (
      <div>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">Manual logging for steps is only used if device sync is unavailable. Tracking history is better managed via Google Fit sync on the dashboard.</p>
        <input type="number" placeholder="Enter steps count..." className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none" onChange={(e) => setFormData({value: e.target.value})} />
      </div>
    )},
    sleep: { title: 'Sleep Duration', icon: Moon, render: () => (
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Sleep Hours (Duration)</label>
          <input 
             type="number" 
             step="0.1"
             placeholder="8.5" 
             className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none" 
             onChange={(e) => setFormData({...formData, value: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-700 dark:text-gray-300 mb-2">Sleep Quality (1-10)</label>
          <div className="flex justify-between gap-1">
             {[1,2,3,4,5,6,7,8,9,10].map(s => (
               <button 
                 key={s}
                 onClick={() => setFormData({...formData, quality: s})}
                 className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${formData.quality === s ? 'bg-emerald-500 text-white' : 'bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'}`}
               >
                 {s}
               </button>
             ))}
          </div>
        </div>
      </div>
    )},
    heart_rate: { title: 'Heart Rate', icon: Stethoscope, render: () => (
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Heart Rate (BPM)</label>
          <input 
            type="number" 
            placeholder="72"
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
            onChange={(e) => setFormData({...formData, value: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Measurement Context</label>
          <select 
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none"
            onChange={(e) => setFormData({...formData, context: e.target.value})}
          >
            <option value="resting">Resting</option>
            <option value="after_exercise">After Exercise</option>
            <option value="before_bed">Before Bed</option>
            <option value="morning">Morning</option>
          </select>
        </div>
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
           <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Info className="w-3 h-3" /> Target Range
           </div>
           <p className="text-xs text-gray-600 dark:text-gray-400">Normal resting heart rate is typically <span className="text-emerald-500 font-bold">60-100 BPM</span>. Athletes may have lower resting rates.</p>
        </div>
      </div>
    )},
    body_temperature: { title: 'Body Temperature', icon: Thermometer, render: () => (
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Temperature (°F)</label>
          <input 
            type="number" 
            step="0.1"
            placeholder="98.6"
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
            onChange={(e) => setFormData({...formData, value: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Notes (Optional)</label>
          <input 
            type="text" 
            placeholder="Feeling feverish, chills, etc."
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none"
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
           <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Info className="w-3 h-3" /> Target Range
           </div>
           <p className="text-xs text-gray-600 dark:text-gray-400">Normal body temperature is around <span className="text-emerald-500 font-bold">98.6°F (37°C)</span>. Above 100.4°F indicates fever.</p>
        </div>
      </div>
    )},
    oxygen_saturation: { title: 'SpO2 Level', icon: Wind, render: () => (
      <div className="space-y-6">
        <div>
          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Oxygen Saturation (%)</label>
          <input 
            type="number" 
            placeholder="98"
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
            onChange={(e) => setFormData({...formData, value: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase text-gray-500 mb-2">Measurement Context</label>
          <select 
            className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-gray-900 dark:text-white outline-none"
            onChange={(e) => setFormData({...formData, context: e.target.value})}
          >
            <option value="resting">Resting</option>
            <option value="after_exercise">After Exercise</option>
            <option value="sleeping">During Sleep</option>
            <option value="high_altitude">High Altitude</option>
          </select>
        </div>
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
           <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              <Info className="w-3 h-3" /> Target Range
           </div>
           <p className="text-xs text-gray-600 dark:text-gray-400">Normal SpO2 is <span className="text-emerald-500 font-bold">95-100%</span>. Below 92% requires immediate medical attention.</p>
        </div>
      </div>
    )},
  };

  const currentModal = config[modalType] || config.bp;

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title={currentModal.title} icon={currentModal.icon}>
      {currentModal.render()}
      <button 
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ position: 'relative', zIndex: 99999, pointerEvents: 'auto', cursor: 'pointer' }}
        className="w-full mt-8 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
        Finalize Reading
      </button>
    </ModalWrapper>
  );
};

export default VitalsModals;
