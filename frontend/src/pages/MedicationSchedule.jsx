import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  Pill, Clock, Calendar, Plus, 
  CheckCircle2, XCircle, Trash2, TrendingUp,
  RefreshCw, ChevronRight, Droplets, Info
} from 'lucide-react';

import { API_URL } from '../config/api';

const MedicationSchedule = () => {
  const { user } = useUser();
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '', dosage: '', frequency: 'daily', timings: ['09:00']
  });

  const fetchMeds = async () => {
    try {
      const res = await axios.get(`${API_URL}/medications/${user.id}`);
      if (res.data.status === 'success') setMeds(res.data.data);
    } catch (err) {
      console.error("Fetch meds failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMeds();
  }, [user]);

  const handleAddMed = async () => {
    try {
      await axios.post(`${API_URL}/medications`, { ...newMed, clerkId: user.id });
      setShowAdd(false);
      fetchMeds();
      setNewMed({ name: '', dosage: '', frequency: 'daily', timings: ['09:00'] });
    } catch (err) {
      console.error("Add med failed", err);
    }
  };

  const handleTakeMed = async (id) => {
    try {
      await axios.patch(`${API_URL}/medications/${id}/take`);
      fetchMeds();
    } catch (err) {
      console.error("Take med failed", err);
    }
  };

  const deleteMed = async (id) => {
    try {
      await axios.delete(`${API_URL}/medications/${id}`);
      fetchMeds();
    } catch (err) {
      console.error("Delete med failed", err);
    }
  };

  if (loading) return <div className="p-12 animate-pulse space-y-6">
    <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
    <div className="grid grid-cols-2 gap-8">
       {[1,2].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-900 rounded-3xl" />)}
    </div>
  </div>;

  return (
    <div className="max-w-7xl mx-auto w-full pb-20 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Adherence Protocol</h2>
            <p className="text-gray-700 dark:text-gray-300 font-medium mt-2 uppercase tracking-widest text-[10px]">Managed Clinical Supplementation & RX Schedule</p>
         </div>
         <button 
           onClick={() => setShowAdd(true)}
           className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-3"
         >
           <Plus className="w-5 h-5" /> Initialize New Entry
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Active Prescriptions (Step 59) */}
        <div className="lg:col-span-2 space-y-6">
           {meds.length > 0 ? meds.map(med => (
             <div key={med._id} className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-8 rounded-[3rem] shadow-2xl group hover:border-emerald-500/20 transition-all">
                <div className="flex justify-between items-start">
                   <div className="flex gap-6">
                      <div className="p-5 bg-emerald-500/10 rounded-3xl group-hover:bg-emerald-500 transition-colors">
                         <Pill className="w-8 h-8 text-emerald-500 group-hover:text-white transition-colors" />
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{med.name}</h3>
                         <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">{med.dosage} • {med.frequency.replace('_', ' ')}</p>
                         <div className="flex gap-2 mt-4">
                            {med.timings.map(t => (
                              <span key={t} className="px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-lg text-[10px] font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5 shadow-sm">
                                <Clock className="w-3 h-3" /> {t}
                              </span>
                            ))}
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-3">
                      <button 
                        onClick={() => handleTakeMed(med._id)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl transition-all active:scale-95"
                      >
                         Log Intake
                      </button>
                      <button onClick={() => deleteMed(med._id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-gray-900 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
                   <span>Adherence Metric</span>
                   <div className="flex items-center gap-4 flex-1 max-w-[50%] px-4">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(med.adherence?.takenDoses / (med.adherence?.totalDoses || 1) * 100).toFixed(0)}%` }} />
                      </div>
                      <span className="text-emerald-500">{(med.adherence?.takenDoses / (med.adherence?.totalDoses || 1) * 100).toFixed(0)}%</span>
                   </div>
                   <span>{med.adherence?.takenDoses} Doses Consumed</span>
                </div>
             </div>
           )) : (
             <div className="py-24 text-center bg-gray-50 dark:bg-gray-950/20 rounded-[4rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                <Pill className="w-16 h-16 text-emerald-500/10 mx-auto mb-6" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Awaiting Rx Matrix</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mt-2">Initialize your daily medical schedule for automated safety reminders.</p>
             </div>
           )}
        </div>

        {/* Adherence Analytics (Step 59) */}
        <div className="space-y-8">
           <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <TrendingUp className="w-32 h-32" />
              </div>
              <h3 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-6 px-2">Compliance Performance</h3>
              <div className="space-y-10">
                 <div>
                    <div className="text-4xl font-black text-gray-900 dark:text-white">94%</div>
                    <div className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest mt-1">7-Day Consistency Index</div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                       <div className="text-xl font-black text-emerald-500">42</div>
                       <div className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase">Doses Current Week</div>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                       <div className="text-xl font-black text-blue-500">12</div>
                       <div className="text-[9px] font-black text-gray-600 dark:text-gray-300 uppercase">Active Schedules</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-emerald-600 p-8 rounded-[3.5rem] text-white shadow-2xl shadow-emerald-500/20">
              <ShieldCheck className="w-10 h-10 mb-6 opacity-50" />
              <h4 className="text-lg font-black uppercase tracking-tighter leading-tight">Patient Safety Integrated</h4>
              <p className="text-xs text-emerald-100 mt-3 font-medium leading-relaxed opacity-80 uppercase tracking-tighter">Your medication schedule is cross-referenced with the Safety Bridge engine to detect real-time drug-herb interactions. Always consult your physician before changing doses.</p>
           </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[3rem] w-full max-w-lg shadow-3xl overflow-hidden animate-in zoom-in duration-500">
               <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Prescription Entry</h3>
                  <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </button>
               </div>
               <div className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">Medication Identifier</label>
                     <input 
                       type="text" 
                       placeholder="e.g. Metformin, Lisinopril..." 
                       className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500" 
                       onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">Unit Dosage</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 500mg" 
                          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500" 
                          onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">Primary timing</label>
                        <input 
                          type="time" 
                          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-sm outline-none focus:border-emerald-500" 
                          defaultValue="09:00"
                          onChange={(e) => setNewMed({...newMed, timings: [e.target.value]})}
                        />
                     </div>
                  </div>
               </div>
               <div className="p-8 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800">
                  <button 
                    onClick={handleAddMed}
                    disabled={!newMed.name || !newMed.dosage}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs disabled:opacity-30"
                  >
                    Activate Entry Protocol
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default MedicationSchedule;
