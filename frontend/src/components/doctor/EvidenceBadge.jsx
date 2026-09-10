import React from 'react';
import { ShieldCheck, Cpu, AlertTriangle, UserCheck } from 'lucide-react';

export default function EvidenceBadge({ source = 'Kiosk Sensor' }) {
  const meta = {
    'Kiosk Sensor': { label: 'Src: Kiosk Sensor', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: Cpu },
    'Risk Engine':  { label: 'Src: Risk Engine',  color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: ShieldCheck },
    'Caregiver':    { label: 'Src: Caregiver',    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20', icon: UserCheck },
    'OCR Prescription': { label: 'Src: OCR Vision', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: ShieldCheck }
  };
  const m = meta[source] || meta['Kiosk Sensor'];
  const IconComp = m.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${m.color}`}>
      <IconComp className="w-3 h-3" />
      <span>{m.label}</span>
    </span>
  );
}
