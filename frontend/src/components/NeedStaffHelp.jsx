/**
 * Phase 13a — NeedStaffHelp
 *
 * Persistent "Need Staff Help?" button that must appear on EVERY kiosk screen.
 * Also owns the auto-timeout + privacy-reset logic: after IDLE_MS of no
 * interaction the session is cleared and the kiosk returns to its start state.
 *
 * Usage (in any kiosk screen):
 *   <NeedStaffHelp onReset={handlePrivacyReset} />
 *
 * Props
 *   onReset   – () => void  called when timeout fires or user triggers manual reset
 *   idleMs    – number      inactivity threshold in ms (default 90_000 = 90 s)
 *   warnMs    – number      warning shown this many ms before reset (default 20_000)
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PhoneCall, RefreshCw, AlertTriangle, X } from 'lucide-react';

const IDLE_DEFAULT  = 90_000;   // 90 s idle → privacy reset
const WARN_DEFAULT  = 20_000;   // 20 s warning before reset

// Events that count as "active"
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

export default function NeedStaffHelp({ onReset, idleMs = IDLE_DEFAULT, warnMs = WARN_DEFAULT }) {
  const [showHelp, setShowHelp]     = useState(false);   // help overlay open
  const [countdown, setCountdown]   = useState(null);    // seconds left in warning
  const [warning, setWarning]       = useState(false);   // show warning banner

  const idleTimer    = useRef(null);
  const warnTimer    = useRef(null);
  const countInterval= useRef(null);

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
    // restart full idle timer
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
      if (warning) return; // ignore activity once warning is visible
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
    // seed the first timer
    resetIdle();

    return () => {
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetIdle));
      clearTimeout(idleTimer.current);
      clearTimeout(warnTimer.current);
      clearInterval(countInterval.current);
    };
  }, [idleMs, warnMs, warning, triggerReset]);

  return (
    <>
      {/* ── Persistent "Need Staff Help?" button ── */}
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        aria-label="Need staff help"
        className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl
                   bg-[var(--vs-mango-500,#f97316)] text-white font-black text-sm
                   shadow-[0_8px_24px_rgba(249,115,22,0.45)]
                   hover:bg-[var(--vs-mango-600,#ea580c)] hover:shadow-[0_12px_32px_rgba(249,115,22,0.55)]
                   active:scale-95 transition-all duration-200 select-none
                   focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/60"
        style={{ minHeight: 48, minWidth: 48 }}
      >
        <PhoneCall className="w-5 h-5 shrink-0" aria-hidden />
        <span>Need Staff Help?</span>
      </button>

      {/* ── Inactivity warning banner ── */}
      {warning && (
        <div
          role="alertdialog"
          aria-live="assertive"
          aria-label="Session timeout warning"
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-[var(--vs-surface-1,#fdf8f0)] dark:bg-[var(--vs-surface-1,#221c15)]
                          border border-[var(--vs-border,rgba(180,140,80,0.18))]
                          rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" aria-hidden />
            </div>
            <h2 className="text-xl font-black text-[var(--vs-text-base,#2d1f0e)] dark:text-[var(--vs-text-base,#f5ead8)] mb-2">
              Still there?
            </h2>
            <p className="text-sm text-[var(--vs-text-muted,#6b5340)] dark:text-[var(--vs-text-muted,#c4a882)] mb-1">
              For your privacy, this session will reset in
            </p>
            <p className="text-5xl font-black text-amber-600 dark:text-amber-400 my-4 tabular-nums">
              {countdown ?? '…'}
            </p>
            <p className="text-xs text-[var(--vs-text-faint,#9c8068)] mb-6">
              seconds. All your information will be cleared.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={dismissWarning}
                className="flex-1 py-3 rounded-xl bg-[var(--vs-teal-600,#0d9488)] text-white font-black text-sm
                           hover:bg-[var(--vs-teal-700,#0f766e)] transition-colors
                           focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/60"
                style={{ minHeight: 48 }}
              >
                I'm still here
              </button>
              <button
                type="button"
                onClick={triggerReset}
                className="flex-1 py-3 rounded-xl border border-[var(--vs-border,rgba(180,140,80,0.18))]
                           text-[var(--vs-text-muted,#6b5340)] dark:text-[var(--vs-text-muted,#c4a882)]
                           font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600
                           transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-400/40"
                style={{ minHeight: 48 }}
              >
                Reset now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Staff Help overlay ── */}
      {showHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Staff help options"
          className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <div className="bg-[var(--vs-surface-1,#fdf8f0)] dark:bg-[var(--vs-surface-1,#221c15)]
                          border border-[var(--vs-border,rgba(180,140,80,0.18))]
                          rounded-t-3xl sm:rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-0 sm:mx-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-orange-600 dark:text-orange-400" aria-hidden />
                </div>
                <h2 className="text-lg font-black text-[var(--vs-text-base,#2d1f0e)] dark:text-[var(--vs-text-base,#f5ead8)]">
                  Staff Help
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                aria-label="Close help"
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                style={{ minHeight: 44, minWidth: 44 }}
              >
                <X className="w-5 h-5 text-[var(--vs-text-muted,#6b5340)]" aria-hidden />
              </button>
            </div>

            <p className="text-sm text-[var(--vs-text-muted,#6b5340)] dark:text-[var(--vs-text-muted,#c4a882)] mb-6">
              A staff member is happy to assist you. You can also ring the help bell at the reception desk.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--vs-surface-2,#faf3e8)] dark:bg-[var(--vs-surface-2,#2c231a)] border border-[var(--vs-border,rgba(180,140,80,0.15))]">
                <PhoneCall className="w-5 h-5 text-[var(--vs-teal-600,#0d9488)] shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-black text-[var(--vs-text-base,#2d1f0e)] dark:text-[var(--vs-text-base,#f5ead8)] uppercase tracking-wider">Reception</p>
                  <p className="text-sm font-bold text-[var(--vs-teal-600,#0d9488)]">Ext. 100</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setShowHelp(false); triggerReset(); }}
                className="w-full flex items-center gap-3 p-4 rounded-2xl
                           border border-rose-200 dark:border-rose-800/40
                           text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20
                           transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-400/40"
                style={{ minHeight: 56 }}
              >
                <RefreshCw className="w-5 h-5 shrink-0" aria-hidden />
                <div className="text-left">
                  <p className="text-xs font-black uppercase tracking-wider">Clear &amp; Reset</p>
                  <p className="text-xs font-medium opacity-70">Remove all your data from this kiosk</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
