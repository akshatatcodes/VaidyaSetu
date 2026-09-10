import { ClipboardCheck, UserCircle, Settings } from 'lucide-react';

export const doctorNav = [
  { to: '/doctor', icon: ClipboardCheck, labelKey: 'sidebar.doctor', defaultLabel: 'Doctor Cockpit', mobilePrimary: true },
  { to: '/doctor/profile', icon: UserCircle, labelKey: 'sidebar.profile', defaultLabel: 'Physician Profile', mobilePrimary: true },
  { to: '/doctor/settings', icon: Settings, labelKey: 'sidebar.settings', defaultLabel: 'Settings', mobilePrimary: true }
];
