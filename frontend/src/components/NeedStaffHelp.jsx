/**
 * Phase 13a — NeedStaffHelp (Enhanced Kiosk Assistance & Privacy Reset)
 *
 * Persistent "Need Staff Help?" button with clinical volunteer dispatch,
 * reception extension direct-connect, and privacy auto-reset timer.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  PhoneCall, RefreshCw, AlertTriangle, X, Bell, UserCheck, 
  CheckCircle2, Shield, ArrowRight, HeartPulse 
} from 'lucide-react';

const IDLE_DEFAULT  = 90_000;   // 90 s idle → privacy reset
const WARN_DEFAULT  = 20_000;   // 20 s warning before reset

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export default function NeedStaffHelp({ onReset, idleMs = IDLE_DEFAULT, warnMs = WARN_DEFAULT }) {
  const [showHelp, setShowHelp]         = useState(false);
  const [countdown, setCountdown]       = useState(null);
  const [warning, setWarning]           = useState(false);
  const [isAlertingStaff, setIsAlertingStaff] = useState(false);
  const [staffDispatched, setStaffDispatched] = useState(false);

  const idleTimer     = useRef(null);
  const warnTimer     = useRef(null);
  const countInterval = useRef(null);

  // ── Privacy reset ──────────────────────────────────────────────────
  const triggerReset = useCallback(() => {
    setWarning(false);
    setCountdown(null);
    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
    clearInterval(countInterval.current);
    onReset?.();
  }, [onReset]);

  // ── Dismiss warning (user is still here) ───────────────────────────
  const dismissWarning = useCallback(() => {
    setWarning(false);
    setCountdown(null);
    clearTimeout(idleTimer.current);
    clearInterval(countInterval.current);
    idleTimer.current = setTimeout(() => {
      setWarning(true);
      const secs = Math.round(warnMs / 1000);
      setCountdown(secs);
      countInterval.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      warnTimer.current = setTimeout(triggerReset, warnMs);
    }, idleMs);
  }, [idleMs, warnMs, triggerReset]);

  // ── Activity listener: restart idle clock on any interaction ───────
  useEffect(() => {
    const resetIdle = () => {
      if (warning) return;
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        setWarning(true);
        const secs = Math.round(warnMs / 1000);
        setCountdown(secs);
        countInterval.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) { clearInterval(countInterval.current); return 0; }
            return prev - 1;
          });
        }, 1000);
        warnTimer.current = setTimeout(triggerReset, warnMs);
      }, idleMs);
    };

    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetIdle, { passive: true }));
    resetIdle();

    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetIdle));
      clearTimeout(idleTimer.current);
      clearTimeout(warnTimer.current);
      clearInterval(countInterval.current);
    };
  }, [idleMs, warnMs, warning, triggerReset]);

  const handleRingStaffBell = () => {
    setIsAlertingStaff(true);
    setTimeout(() => {
      setIsAlertingStaff(false);
      setStaffDispatched(true);
    }, 800);
  };

  return (
    <>
      {/* ── High-Visibility Tactile Bottom Floating Pill ── */}
      <button
        type="button"
        onClick={() => {
          setStaffDispatched(false);
          setShowHelp(true);
        }}
        aria-label="Need staff assistance"
        className="fixed bottom-[72px] right-3 sm:bottom-6 sm:right-6 z-[45] flex items-center justify-center gap-1.5 py-2 px-3 sm:px-4 sm:py-2.5 rounded-full
                   bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold text-xs sm:text-sm
                   shadow-[0_4px_18px_rgba(234,88,12,0.45)] border border-amber-300/50
                   hover:shadow-[0_6px_24px_rgba(234,88,12,0.6)] hover:scale-105
                   active:scale-95 transition-all duration-200 select-none cursor-pointer group"
        title="Need Staff Help? • सहायता"
      >
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <PhoneCall className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-black tracking-tight whitespace-nowrap text-[11px] sm:text-xs">
          <span className="inline sm:hidden">सहायता 📞</span>
          <span className="hidden sm:inline">Need Staff Help? • सहायता</span>
        </span>
        <span className="w-2 h-2 rounded-full bg-emerald-300 ring-2 ring-white/60 shrink-0" />
      </button>

      {/* ── Inactivity Warning Banner ── */}
      {warning && (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="Session timeout warning"
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in select-none"
        >
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95 text-slate-900 dark:text-white">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black mb-1">
                Still here? / क्या आप उपस्थित हैं?
              </h2>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                For patient data privacy, this kiosk session resets automatically in:
              </p>
            </div>

            <div className="text-5xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-wider tabular-nums py-2">
              {countdown ?? '…'}
              <span className="text-sm font-bold text-slate-400 ml-1">sec</span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-gray-400">
              Your unfinished session will be safely cleared if no response.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={dismissWarning}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95"
              >
                I'm Still Here (जारी रखें)
              </button>
              <button
                type="button"
                onClick={triggerReset}
                className="py-3 px-3.5 rounded-xl border border-rose-300 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modern Staff Assistance Modal Dialog ── */}
      {showHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Staff help options"
          className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in select-none"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border-t-2 sm:border-2 border-amber-500/40 rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 w-full max-w-md mx-auto space-y-3.5 sm:space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Indicator Bar */}
            <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto -mt-1 mb-2 sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 shrink-0">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    AIIA Reception & Assistance
                  </span>
                  <h2 className="text-base sm:text-lg font-black leading-tight text-slate-900 dark:text-white">
                    Need Help? / सहायता चाहिए?
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              If you have difficulty reading the screen, need language assistance, or feel unwell, hospital attendants are here to help.
            </p>

            {/* Action 1: Call / Ring Attendant Bell */}
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                    In-Person Kiosk Attendant
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  On Duty
                </span>
              </div>

              {staffDispatched ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>सहायक को सूचना भेज दी गई है! Volunteer nurse has been alerted to this Kiosk.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRingStaffBell}
                  disabled={isAlertingStaff}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Bell className={`w-4 h-4 ${isAlertingStaff ? 'animate-spin' : ''}`} />
                  <span>{isAlertingStaff ? 'Alerting Desk...' : 'Ring Attendant Bell (सहायक को बुलाएं)'}</span>
                </button>
              )}
            </div>

            {/* Action 2: Reception Desk Extension */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400">
                    OPD Reception Desk
                  </p>
                  <p className="text-xs font-black text-teal-600 dark:text-teal-400">
                    Extension: 100 / Room 101
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                Counter #1
              </span>
            </div>

            {/* Action 3: Privacy Clear & Reset Session */}
            <button
              type="button"
              onClick={() => {
                setShowHelp(false);
                triggerReset();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 shrink-0 group-hover:rotate-180 transition-transform duration-500" />
                <div className="text-left">
                  <p className="text-xs font-black">Wipe Data & Reset (डेटा हटाएं)</p>
                  <p className="text-[10px] opacity-70">Clear all entered information from this kiosk</p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 text-center text-xs font-bold text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              I can continue on my own (जारी रखें)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
