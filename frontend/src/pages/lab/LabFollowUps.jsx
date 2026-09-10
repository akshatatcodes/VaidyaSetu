import React from 'react';
import { Activity } from 'lucide-react';
import LabOrderCard from '../../components/lab/LabOrderCard';

export default function LabFollowUps({
  orders = [],
  busy,
  onMarkCollected,
  onEnterResult,
  onVerifyResult,
  onViewHistory
}) {
  const followUpOrders = orders.filter(o => o.status === 'verified' || o.status === 'resulted');

  return (
    <div className="space-y-3">
      {followUpOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl space-y-3">
          <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-gray-300">No follow-ups pending review</p>
          <p className="text-xs text-gray-500">Verified diagnostic tests needing clinical follow-up will appear here.</p>
        </div>
      ) : (
        followUpOrders.map(order => (
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
