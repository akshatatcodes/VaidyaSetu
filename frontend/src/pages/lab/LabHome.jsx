import React from 'react';
import { TestTube2 } from 'lucide-react';
import LabOrderCard from '../../components/lab/LabOrderCard';

export default function LabHome({
  orders = [],
  busy,
  onMarkCollected,
  onEnterResult,
  onVerifyResult,
  onViewHistory
}) {
  return (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl space-y-3">
          <TestTube2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-gray-300">No lab samples logged today</p>
          <p className="text-xs text-gray-500">Scan a token QR above to record incoming samples.</p>
        </div>
      ) : (
        orders.map(order => (
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
