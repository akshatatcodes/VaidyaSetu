import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, MapPin, Trash2, ExternalLink, Calendar, Phone, Edit3, Check, X } from 'lucide-react';
import axios from 'axios';

const SavedDoctorsWidget = ({ doctors, clerkId, onRemove, onRefresh }) => {
  const [editingId, setEditingId] = useState(null);
  const [noteValue, setNoteValue] = useState('');
  const [saving, setSaving] = useState(false);

  if (!doctors || doctors.length === 0) return null;

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

  const handleStartEdit = (doc) => {
    setEditingId(doc.placeId);
    setNoteValue(doc.notes || '');
  };

  const handleSaveNote = async (placeId) => {
    setSaving(true);
    try {
      await axios.patch(`${API_URL}/profile/saved-doctors/${clerkId}/${placeId}/notes`, {
        notes: noteValue
      });
      setEditingId(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  };

  // Step 55: Group by specialty
  const grouped = doctors.reduce((acc, doc) => {
    const specialty = doc.specialty || 'General Physician';
    if (!acc[specialty]) acc[specialty] = [];
    acc[specialty].push(doc);
    return acc;
  }, {});

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center space-x-2 px-2">
        <div className="p-1.5 bg-blue-500/10 rounded-lg">
          <Stethoscope className="w-4 h-4 text-blue-500" />
        </div>
        <h5 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">
          Your Healthcare Network
        </h5>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped).map(([specialty, docs]) => (
          <div key={specialty} className="space-y-4">
            <h6 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-2">
              {specialty}s ({docs.length})
            </h6>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {docs.map((doc) => (
                <div 
                  key={doc.placeId || doc.name} 
                  className="bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-100 dark:border-gray-700">
                        <Stethoscope className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h6 className="font-bold text-gray-900 dark:text-white text-sm">{doc.name}</h6>
                        <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{doc.address || 'Location saved'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onRemove(doc.placeId)}
                      className="p-1.5 bg-rose-500/5 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Step 55: Notes Section */}
                  <div className="flex-1 mb-4">
                    {editingId === doc.placeId ? (
                      <div className="space-y-2">
                        <textarea 
                          value={noteValue}
                          onChange={(e) => setNoteValue(e.target.value)}
                          className="w-full h-20 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Add your notes about this doctor..."
                          autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-1 px-3 rounded-lg text-gray-400 hover:text-gray-500 text-[10px] font-bold uppercase transition-colors"
                          >
                            <X className="w-3 h-3 mr-1 inline" /> Cancel
                          </button>
                          <button 
                            onClick={() => handleSaveNote(doc.placeId)}
                            disabled={saving}
                            className="p-1 px-3 bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase disabled:opacity-50 transition-all flex items-center"
                          >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => handleStartEdit(doc)}
                        className="group/note cursor-pointer p-3 rounded-xl bg-gray-50/50 dark:bg-gray-950/30 border border-transparent hover:border-blue-500/10 hover:bg-blue-500/5 transition-all min-h-[40px]"
                      >
                        <p className={`text-[11px] leading-relaxed ${doc.notes ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 italic'}`}>
                          {doc.notes || 'Click to add personal notes...'}
                        </p>
                        {doc.notes && (
                           <button className="hidden group-hover/note:flex items-center text-[9px] text-blue-500 font-bold uppercase mt-2">
                             <Edit3 className="w-2.5 h-2.5 mr-1" /> Update
                           </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 56: Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(doc.name + ' ' + doc.address)}`, '_blank')}
                      className="flex-1 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-2 hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Maps</span>
                    </button>
                    
                    <button 
                      onClick={() => window.open(`https://www.practo.com/search?results_type=doctor&q=${encodeURIComponent(doc.name)}`, '_blank')}
                      className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-bold flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Book Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedDoctorsWidget;
