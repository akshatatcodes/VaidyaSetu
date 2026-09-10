import React from 'react';
import { Shield, QrCode, Loader2 } from 'lucide-react';

export default function LabHeader({
  lastRefresh,
  qrCodeInput,
  setQrCodeInput,
  scanning,
  scanMessage,
  onQrScan
}) {
  return (
    <div className="bg-gradient-to-r from-slate-950 via-cyan-950 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-cyan-500/20 relative overflow-hidden">
      <div className="absolute -right-16 -top-16 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-black uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> AIIA OPERATIONAL LAB WORKBENCH (§28)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Diagnostic Result & Sample Tracking Console
          </h1>
          <p className="text-xs text-cyan-200/70">
            7-Tab Sample State Machine (Ordered → Collected → Processing → Resulted → Verified) • Non-Overwrite Audit Engine (§30)
            {lastRefresh && <span className="ml-2 opacity-60">Last synced: {lastRefresh.toLocaleTimeString()}</span>}
          </p>
        </div>

        {/* QR / Token Code Scanner Box */}
        <div className="bg-slate-900/90 border border-cyan-500/40 p-3 rounded-2xl space-y-2 shrink-0">
          <form onSubmit={onQrScan} className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400 shrink-0" />
            <input
              type="text"
              value={qrCodeInput}
              onChange={e => setQrCodeInput(e.target.value)}
              placeholder="Scan Token QR / Enter ID..."
              className="px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/30 text-white text-xs font-mono focus:ring-2 focus:ring-cyan-500 outline-none w-48"
            />
            <button
              type="submit"
              disabled={scanning}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Scan QR'}
            </button>
          </form>
          {scanMessage && (
            <p className={`text-[10px] font-bold ${scanMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {scanMessage.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
