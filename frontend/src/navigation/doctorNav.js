import {
  Stethoscope, Clock, Users, FlaskConical, RotateCcw,
  Share2, BarChart3, History, UserCircle, Settings
} from 'lucide-react';

export const doctorNav = [
  { to: '/doctor', icon: Stethoscope, labelKey: 'sidebar.cockpit', defaultLabel: 'Doctor Cockpit', mobilePrimary: true },
  { to: '/doctor/queue', icon: Clock, labelKey: 'sidebar.queue', defaultLabel: 'Queue', mobilePrimary: true },
  { to: '/doctor/patients', icon: Users, labelKey: 'sidebar.patients', defaultLabel: 'Patients', mobilePrimary: true },
  { to: '/doctor/labs', icon: FlaskConical, labelKey: 'sidebar.labOrders', defaultLabel: 'Lab Orders', mobilePrimary: true },
  { to: '/doctor/followups', icon: RotateCcw, labelKey: 'sidebar.followups', defaultLabel: 'Follow-ups', mobilePrimary: true },
  { to: '/doctor/referrals', icon: Share2, labelKey: 'sidebar.referrals', defaultLabel: 'Referrals', mobilePrimary: true },
  { to: '/doctor/reports', icon: BarChart3, labelKey: 'sidebar.reports', defaultLabel: 'Reports', mobilePrimary: false },
  { to: '/doctor/history', icon: History, labelKey: 'sidebar.history', defaultLabel: 'History', mobilePrimary: false },
  { to: '/doctor/profile', icon: UserCircle, labelKey: 'sidebar.profile', defaultLabel: 'Profile', mobilePrimary: true }
];
