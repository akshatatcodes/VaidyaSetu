import React from 'react';
import { AlertOctagon } from 'lucide-react';
import LabOrderCard from '../../components/lab/LabOrderCard';

export default function LabCritical({
  orders = [],
  busy,
  onMarkCollected,
  onEnterResult,
  onVerifyResult,
  onViewHistory
}) {
  const criticalOrders = orders.filter(o => o.critical || o.urgency === 'stat' || o.priority === 'stat');

  return (
    <div className="space-y-3">
      {criticalOrders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl space-y-3 bg-emerald-500/5 border-emerald-500/20">
          <AlertOctagon className="w-10 h-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-gray-300">Zero Critical Attention Alerts</p>
          <p className="text-xs text-gray-500">No STAT priority tests or critical lab values requiring emergency clinician notification.</p>
        </div>
      ) : (
        criticalOrders.map(order => (
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
