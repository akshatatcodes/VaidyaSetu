import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Loader2, Hospital, Zap, Heart, ShieldPlus, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { detectLocation, detectIPLocation } from '../../utils/locationService';

const DoctorFinderModule = ({ 
  specialistData, 
  riskScore, 
  diseaseId,
  clerkId,
  isUrgent = false,
  profileSettings = {}
}) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [manualCity, setManualCity] = useState('');
  const [isManual, setIsManual] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(profileSettings?.doctorSearchFilters || {
    ayushman: false,
    janAushadhi: false,
    govt: false,
    online: true
  });

  // Step 50/53: Priority Logic & Persistence
  useEffect(() => {
    if (profileSettings?.currentLocation) {
      setLocation(profileSettings.currentLocation);
    }
  }, [profileSettings?.currentLocation]);

  const persistFilters = async (newFilters) => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://vaidyasetu-eyg9.onrender.com/api';
    try {
      await axios.patch(`${API_URL}/profile/settings/${clerkId}`, {
        settings: { ...profileSettings, doctorSearchFilters: newFilters }
      });
    } catch (err) {
      console.error("Failed to persist doctor filters");
    }
  };

  const getUrgencyContext = () => {
    if (riskScore > 75) return {
      message: "Priority Consultation Needed",
      btnText: "Find Doctor Now",
      color: "rose"
    };
    if (riskScore > 50) return {
      message: "Consultation Recommended",
      btnText: "Find Specialist",
      color: "amber"
    };
    return {
      message: "Routine Checkup Suggested",
      btnText: "Find Provider",
      color: "emerald"
    };
  };

  const context = getUrgencyContext();

  const handleInitialDetect = async () => {
    setLoading(true);
    try {
      const pos = await detectLocation().catch(() => detectIPLocation());
      setLocation(pos);
      setIsManual(false);
    } catch (err) {
      setIsManual(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const city = isManual ? manualCity : location?.city;
    const query = [
      specialistData.primary,
      filters.ayushman ? 'Ayushman Bharat' : '',
      filters.janAushadhi ? 'Jan Aushadhi' : '',
      filters.govt ? 'Government Hospital' : '',
      city ? `in ${city}` : 'near me'
    ].filter(Boolean).join(' ');

    const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    window.open(mapUrl, '_blank');
  };

  const toggleFilter = (key) => {
    const newFilters = { ...filters, [key]: !filters[key] };
    setFilters(newFilters);
    persistFilters(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-3xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl bg-${context.color}-500/10`}>
              <Hospital className={`w-5 h-5 text-${context.color}-500`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Clinical Discovery</p>
              <h6 className="font-bold text-gray-950 dark:text-white leading-tight">
                {specialistData.primary} Discovery
              </h6>
            </div>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <Zap className={`w-4 h-4 ${showFilters ? 'text-emerald-500 fill-emerald-500' : 'text-gray-400'}`} />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
          {context.message}. We will help you find the best {specialistData.primary} {(isManual ? manualCity : location?.city) ? `in ${isManual ? manualCity : location.city}` : 'nearby'}.
        </p>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 mb-5 pb-5 border-b border-gray-50 dark:border-gray-800"
            >
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ayushman', label: 'Ayushman Bharat', icon: ShieldPlus },
                  { id: 'janAushadhi', label: 'Jan Aushadhi', icon: Heart },
                  { id: 'govt', label: 'Govt Hospital', icon: Hospital },
                  { id: 'online', label: 'Telemedicine', icon: Zap }
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFilter(f.id)}
                      className={`flex items-center space-x-2 p-2 rounded-xl border text-[10px] font-bold transition-all ${
                        filters[f.id] 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' 
                          : 'bg-transparent border-gray-50 dark:border-gray-800 text-gray-500'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button 
                  onClick={() => window.open(`https://www.practo.com/search?results_type=doctor&q=${encodeURIComponent(specialistData.primary)}`, '_blank')}
                  className="px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 text-[9px] font-black text-gray-500 hover:text-blue-500 flex items-center space-x-1 uppercase"
                >
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span>Practo</span>
                </button>
                <button 
                  onClick={() => window.open(`https://www.1mg.com/online-consultation/search?specialty=${encodeURIComponent(specialistData.primary)}`, '_blank')}
                  className="px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-800 text-[9px] font-black text-gray-500 hover:text-orange-500 flex items-center space-x-1 uppercase"
                >
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span>Tata 1mg</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col space-y-2">
          {isManual && (
            <div className="flex space-x-2 mb-2">
              <input 
                type="text"
                placeholder="Enter city manually..."
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-xs text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <button 
                onClick={() => setIsManual(false)}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-[10px] font-bold text-gray-500"
              >
                Auto
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!location && !loading && !isManual && (
              <button 
                onClick={handleInitialDetect}
                className="flex items-center space-x-2 px-3 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:text-emerald-500 transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Detect Location</span>
              </button>
            )}

            <button 
              onClick={handleSearch}
              disabled={loading || (isManual && !manualCity)}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-2xl bg-gray-950 dark:bg-white text-white dark:text-gray-950 text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-black/10 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{context.btnText}</span>
            </button>
          </div>

          <button 
            onClick={async () => {
              const API_URL = import.meta.env.VITE_API_URL || 'https://vaidyasetu-eyg9.onrender.com/api';
              if (!clerkId) return;
              const city = isManual ? manualCity : location?.city;
              try {
                await axios.post(`${API_URL}/profile/saved-doctors`, {
                  clerkId,
                  doctor: {
                    name: `Recommended ${specialistData.primary}`,
                    specialty: specialistData.primary,
                    address: city ? `In ${city}` : 'Nearby Area',
                    placeId: `ref_${diseaseId}_${Date.now()}`
                  }
                });
                if (window.refreshHealthcareNetwork) window.refreshHealthcareNetwork();
              } catch (err) {
                console.error("Save failed:", err);
              }
            }}
            className="w-full py-3 border border-dashed border-gray-100 dark:border-gray-800 rounded-2xl text-[10px] font-bold text-gray-400 hover:bg-emerald-500/5 hover:border-emerald-500/20 hover:text-emerald-500 transition-all"
          >
            Save Recommendation for Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorFinderModule;
