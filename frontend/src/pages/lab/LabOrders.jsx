import React from 'react';
import { TestTube2 } from 'lucide-react';
import LabOrderCard from '../../components/lab/LabOrderCard';

export default function LabOrders({
  orders = [],
  busy,
  onMarkCollected,
  onEnterResult,
  onVerifyResult,
  onViewHistory
}) {
  const inProgressOrders = orders.filter(o => o.status === 'collected' || o.status === 'processing');

  return (
    <div className="space-y-3">
      {inProgressOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl space-y-3">
          <TestTube2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-gray-300">No samples currently in progress</p>
          <p className="text-xs text-gray-500">Collect samples from pending queue to begin processing.</p>
        </div>
      ) : (
        inProgressOrders.map(order => (
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
