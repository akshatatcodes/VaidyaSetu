import { Calendar, FlaskConical, TestTube2, Zap, CheckCircle2, AlertOctagon, Activity, User, Settings } from 'lucide-react';

export const labNav = [
  { to: '/lab', icon: Calendar, labelKey: 'sidebar.labToday', defaultLabel: "Today's Samples", mobilePrimary: true },
  { to: '/lab/queue', icon: FlaskConical, labelKey: 'sidebar.labPending', defaultLabel: 'Pending Orders', mobilePrimary: true },
  { to: '/lab/orders', icon: TestTube2, labelKey: 'sidebar.labInProgress', defaultLabel: 'In Progress', mobilePrimary: true },
  { to: '/lab/results', icon: Zap, labelKey: 'sidebar.labCompleted', defaultLabel: 'Completed Results', mobilePrimary: true },
  { to: '/lab/verified', icon: CheckCircle2, labelKey: 'sidebar.labVerified', defaultLabel: 'Verified Results', mobilePrimary: false },
  { to: '/lab/critical', icon: AlertOctagon, labelKey: 'sidebar.labCritical', defaultLabel: 'Critical / Attention', mobilePrimary: true },
  { to: '/lab/followups', icon: Activity, labelKey: 'sidebar.labFollowups', defaultLabel: 'Follow-ups', mobilePrimary: false },
  { to: '/lab/profile', icon: User, labelKey: 'sidebar.profile', defaultLabel: 'Profile', mobilePrimary: false },
  { to: '/lab/settings', icon: Settings, labelKey: 'sidebar.settings', defaultLabel: 'Settings', mobilePrimary: true }
];
