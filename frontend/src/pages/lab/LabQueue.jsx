import React from 'react';
import { FlaskConical } from 'lucide-react';
import LabOrderCard from '../../components/lab/LabOrderCard';

export default function LabQueue({
  orders = [],
  busy,
  onMarkCollected,
  onEnterResult,
  onVerifyResult,
  onViewHistory
}) {
  const pendingOrders = orders.filter(o => o.status === 'ordered' || o.status === 'scanned' || o.status === 'queued');

  return (
    <div className="space-y-3">
      {pendingOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl space-y-3">
          <FlaskConical className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-gray-300">No pending lab orders</p>
          <p className="text-xs text-gray-500">All requested diagnostic tests are currently collected or processing.</p>
        </div>
      ) : (
        pendingOrders.map(order => (
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
