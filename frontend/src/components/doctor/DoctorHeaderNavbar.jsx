import React, { useState } from 'react';
import {
  Stethoscope, Bell, Search, CheckCircle2, AlertOctagon,
  Clock, RotateCcw, Share2, User, ShieldCheck, X, Sparkles, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DoctorHeaderNavbar({
  activeStream = 'allopathy',
  setActiveStream = () => {},
  searchQuery = '',
  setSearchQuery = () => {},
  waitingCount = 0,
  emergencyCount = 0,
  completedCount = 0,
  onRefresh = () => {}
}) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'New Patient Ready', desc: 'Rajesh Sharma (Token OPD-001) intake complete.', time: '2m ago', type: 'info', icon: Clock },
    { id: 2, title: 'Emergency Case Flagged', desc: 'Critical SpO2 (91%) detected at MediKiosk.', time: '5m ago', type: 'emergency', icon: AlertOctagon },
    { id: 3, title: 'Lab Report Available', desc: 'CBC & Thyroid report ready for Sunita Devi.', time: '12m ago', type: 'lab', icon: CheckCircle2 },
    { id: 4, title: 'Follow-up Patient Arrived', desc: 'Token F-28 (Rajesh Jain) checked in.', time: '20m ago', type: 'followup', icon: RotateCcw },
    { id: 5, title: 'Inter-Dept Referral Accepted', desc: 'Cardiology accepted referral for Amit Verma.', time: '35m ago', type: 'referral', icon: Share2 }
  ];

  return (
    <div className="mb-6 rounded-3xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-2xl border border-emerald-500/20 text-white p-4 sm:p-5 shadow-2xl transition-all relative z-30">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left Section: Doctor Identity & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                {currentUser?.doctorName || 'Dr. Vikramaditya Sharma'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-black uppercase">
                {currentUser?.department || 'Kayachikitsa'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/70 font-medium hidden sm:flex items-center gap-2 pt-0.5">
              <span>AIIA Clinician Cockpit</span>
              <span>•</span>
              <span className="text-white font-mono font-bold">{currentUser?.roomNumber || 'Room 104'}</span>
              <span>•</span>
              <span className="text-teal-300 font-mono font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-400" />
                {currentUser?.consultationTimings || '09:00 AM - 02:00 PM'}
              </span>
            </p>
          </div>
        </div>

        {/* Center & Right Section: Queue Stats & Notification Bell */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
          {/* Stream Switcher (Allopathy vs Ayurvedic) */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-white/10 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => setActiveStream('allopathy')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                activeStream === 'allopathy' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              💊 Allopathy
            </button>
            <button
              type="button"
              onClick={() => setActiveStream('ayurvedic')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                activeStream === 'ayurvedic' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              🌿 Ayurvedic
            </button>
          </div>

          {/* Real-time Queue Counters Strip */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-bold shadow-inner">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Waiting:</span>
              <span className="font-mono text-white font-black">{waitingCount}</span>
            </div>
            <div className="h-3.5 w-px bg-white/10" />
            <div className="flex items-center gap-1.5 text-rose-400">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Emergency:</span>
              <span className="font-mono text-rose-400 font-black">{emergencyCount}</span>
            </div>
          </div>

          {/* Notification Bell 🔔 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer relative shadow-sm"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-emerald-300" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl p-4 text-white z-50 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider">Clinical Alerts</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mt-3 max-h-80 overflow-y-auto pr-1">
                  {notifications.map((n) => {
                    const IconComp = n.icon;
                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl border text-xs space-y-1 transition-all ${
                          n.type === 'emergency'
                            ? 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                            : 'bg-white/5 border-white/10 text-gray-200 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between font-black">
                          <span className="flex items-center gap-1.5 text-white">
                            <IconComp className="w-3.5 h-3.5 text-emerald-400" />
                            {n.title}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-normal">{n.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-white/10 mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Mark all alerts read
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
