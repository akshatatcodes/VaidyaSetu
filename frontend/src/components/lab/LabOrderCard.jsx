import React from 'react';
import { AlertOctagon, Clock, Zap, CheckCircle2, History, Loader2 } from 'lucide-react';

function UrgencyBadge({ urgency }) {
  const map = {
    stat: 'bg-red-500/15 text-red-500 font-black',
    urgent: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold',
    routine: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-gray-400 font-medium'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider ${map[urgency] || map.routine}`}>
      {urgency}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    ordered: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    scanned: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    collected: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    processing: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    resulted: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    verified: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    cancelled: 'bg-slate-500/15 text-slate-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${map[status] || map.ordered}`}>
      {status}
    </span>
  );
}

export default function LabOrderCard({
  order,
  busy,
  onMarkCollected,
  onEnterResult,
  onVerifyResult,
  onViewHistory
}) {
  const orderIdKey = order.orderId || order._id;

  return (
    <div className="bg-white/95 dark:bg-slate-900/90 border border-gray-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-500/30 transition-all">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <UrgencyBadge urgency={order.urgency || order.priority} />
          {(order.critical || order.urgency === 'stat' || order.priority === 'stat') && (
            <span className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-500 font-black text-[10px] uppercase flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" /> CRITICAL
            </span>
          )}
          <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-400">
            Token: {order.tokenNumber}
          </span>
        </div>

        <p className="text-base font-black text-slate-900 dark:text-white truncate">
          {order.testName}
        </p>

        <p className="text-xs text-slate-600 dark:text-gray-400">
          Patient: <b>{order.patientName}</b> · {order.age}y {order.gender} · Dept: {order.department || 'Kayachikitsa'}
        </p>

        {order.result && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              Result: {order.result.value} {order.result.unit} {order.result.referenceRange ? `(Ref: ${order.result.referenceRange})` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {/* Action 1: Scan / Mark Collected */}
        {(order.status === 'ordered' || order.status === 'scanned' || order.status === 'queued') && (
          <button
            type="button"
            onClick={() => onMarkCollected(order)}
            disabled={busy === orderIdKey}
            className="px-3.5 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            {busy === orderIdKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
            Mark Collected
          </button>
        )}

        {/* Action 2: Process / Enter Result */}
        {(order.status === 'collected' || order.status === 'processing') && (
          <button
            type="button"
            onClick={() => onEnterResult(order)}
            className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Enter Result
          </button>
        )}

        {/* Action 3: Verify Result */}
        {order.status === 'resulted' && (
          <button
            type="button"
            onClick={() => onVerifyResult(order)}
            disabled={busy === orderIdKey}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            {busy === orderIdKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Verify Result
          </button>
        )}

        {/* Action 4: Version History Audit Trail (§30) */}
        <button
          type="button"
          onClick={() => onViewHistory(order)}
          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 border border-gray-300 dark:border-white/10"
          title="Inspect Version History (§30)"
        >
          <History className="w-3.5 h-3.5 text-teal-500" />
          History
        </button>
      </div>
    </div>
  );
}
