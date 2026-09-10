import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FlaskConical, TestTube2, Zap, CheckCircle2, AlertOctagon, Activity } from 'lucide-react';

export const LAB_TABS = [
  { key: 'todays_samples', route: '/lab', label: "Today's Samples", icon: Calendar },
  { key: 'pending', route: '/lab/queue', label: 'Pending Orders', icon: FlaskConical },
  { key: 'in_progress', route: '/lab/orders', label: 'In Progress', icon: TestTube2 },
  { key: 'completed', route: '/lab/results', label: 'Completed (Resulted)', icon: Zap },
  { key: 'verified', route: '/lab/verified', label: 'Verified', icon: CheckCircle2 },
  { key: 'critical', route: '/lab/critical', label: 'Critical / Attention', icon: AlertOctagon },
  { key: 'followup', route: '/lab/followups', label: 'Follow-up Required', icon: Activity }
];

export default function LabMetricStrip({ activeTab, counts, onTabSelect }) {
  const navigate = useNavigate();

  const getCount = (key) => {
    switch (key) {
      case 'todays_samples': return counts.todaysSamples || 0;
      case 'pending': return counts.pending || 0;
      case 'in_progress': return counts.inProgress || 0;
      case 'completed': return counts.completed || 0;
      case 'verified': return counts.verified || 0;
      case 'critical': return counts.criticalAttention || 0;
      case 'followup': return counts.followUpRequired || 0;
      default: return 0;
    }
  };

  const handleSelect = (t) => {
    if (onTabSelect) {
      onTabSelect(t.key);
    }
    if (t.route) {
      navigate(t.route);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {LAB_TABS.map((t) => {
        const isActive = activeTab === t.key;
        const count = getCount(t.key);
        const Icon = t.icon;

        return (
          <button
            key={t.key}
            onClick={() => handleSelect(t)}
            className={`p-3.5 rounded-2xl border transition-all text-left cursor-pointer flex flex-col justify-between ${
              isActive
                ? 'border-cyan-500 bg-cyan-500/10 shadow-md scale-[1.02]'
                : 'border-gray-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/90 hover:border-cyan-400/40'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-black text-slate-600 dark:text-gray-400 truncate">{t.label}</span>
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-500' : 'text-gray-400'}`} />
            </div>
            <span className={`text-2xl font-black font-mono ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
