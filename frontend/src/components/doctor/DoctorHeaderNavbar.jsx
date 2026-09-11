import React, { useState } from 'react';
import {
  Stethoscope, Bell, CheckCircle2, AlertOctagon,
  Clock, RotateCcw, Share2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DoctorHeaderNavbar({
  activeStream = 'allopathy',
  setActiveStream = () => { },
  searchQuery = '',
  setSearchQuery = () => { },
  waitingCount = 0,
  emergencyCount = 0,
  completedCount = 0,
  onRefresh = () => { }
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
    <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-50/90 via-white/95 to-teal-50/90 dark:from-slate-900/95 dark:via-slate-900/95 dark:to-slate-950/95 backdrop-blur-xl border border-emerald-200/80 dark:border-emerald-500/20 text-slate-900 dark:text-white p-3.5 sm:p-5 shadow-md shadow-emerald-900/5 transition-all relative z-30 select-none">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3.5">

        {/* ── Left Section: Doctor Identity & Title (Matching OPD Branding) ── */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-500 p-0.5 shadow-md shadow-emerald-600/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <h1 className="text-base sm:text-lg md:text-xl font-black !text-slate-900 dark:!text-white tracking-tight leading-snug">
                {currentUser?.doctorName || currentUser?.fullName || 'Dr. Vikramaditya Sharma'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                {currentUser?.department || 'Kayachikitsa'}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">AIIA Clinician Cockpit</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">•</span>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-mono font-bold text-[11px] border border-teal-200/60 dark:border-teal-800/60 flex items-center gap-1">
                {currentUser?.roomNumber || 'Room 104'}
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-mono font-bold text-[11px] border border-teal-200/60 dark:border-teal-800/60 flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                {currentUser?.consultationTimings || '09:00 AM - 02:00 PM'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Section: Stream Switcher, Queue Counters & Notifications ── */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">

          {/* Stream Switcher (Allopathy vs Ayurvedic) */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveStream('allopathy')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeStream === 'allopathy'
                ? 'bg-blue-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              💊 Allopathy
            </button>
            <button
              type="button"
              onClick={() => setActiveStream('ayurvedic')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeStream === 'ayurvedic'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              🌿 Ayurvedic
            </button>
          </div>

          {/* Real-time Queue Counters Strip */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Waiting:</span>
              <span className="font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-1.5 py-0.5 rounded-md font-black shadow-2xs">
                {waitingCount}
              </span>
            </div>
            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>Emergency:</span>
              <span className="font-mono bg-rose-600 text-white px-1.5 py-0.5 rounded-md font-black shadow-2xs">
                {emergencyCount}
              </span>
            </div>
          </div>

          {/* Notification Bell 🔔 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer relative shadow-xs"
              title="Clinical Alerts"
            >
              <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {notifications.length}
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-4 text-slate-900 dark:text-white z-50 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Clinical Alerts
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
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
                        className={`p-3 rounded-2xl border text-xs space-y-1 transition-all ${n.type === 'emergency'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                      >
                        <div className="flex items-center justify-between font-black">
                          <span className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                            <IconComp className={`w-3.5 h-3.5 ${n.type === 'emergency' ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`} />
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">{n.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline cursor-pointer"
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
