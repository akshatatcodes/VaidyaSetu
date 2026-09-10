import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import LabOrderCard from '../../components/lab/LabOrderCard';

export default function LabResults({
  orders = [],
  filterMode = 'all', // 'all', 'completed', or 'verified'
  busy,
  onMarkCollected,
  onEnterResult,
  onVerifyResult,
  onViewHistory
}) {
  const filtered = orders.filter(o => {
    if (filterMode === 'completed') return o.status === 'resulted';
    if (filterMode === 'verified') return o.status === 'verified';
    return o.status === 'resulted' || o.status === 'verified';
  });

  return (
    <div className="space-y-3">
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl space-y-3">
          <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-gray-300">
            No {filterMode === 'completed' ? 'completed (resulted)' : filterMode === 'verified' ? 'verified' : 'resulted/verified'} lab reports
          </p>
          <p className="text-xs text-gray-500">Completed diagnostic entries will be listed here.</p>
        </div>
      ) : (
        filtered.map(order => (
          <LabOrderCard
            key={order.orderId || order._id}
            order={order}
            busy={busy}
            onMarkCollected={onMarkCollected}
            onEnterResult={onEnterResult}
            onVerifyResult={onVerifyResult}
            onViewHistory={onViewHistory}
          />
        ))
      )}
    </div>
  );
}
