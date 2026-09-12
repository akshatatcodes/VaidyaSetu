import {
  Home, ClipboardCheck, FileText, Pill, Clock,
  HelpCircle, Stethoscope, Activity, UserCircle, ShieldAlert
} from 'lucide-react';

export const patientNav = [
  { to: '/', icon: Home, labelKey: 'sidebar.dashboard', defaultLabel: 'Dashboard', mobilePrimary: true },
  { to: '/patient/opd', icon: Stethoscope, labelKey: 'sidebar.opdIntake', defaultLabel: 'Pre-Consultation Check-In', mobilePrimary: true },
  { to: '/patient/records', icon: FileText, labelKey: 'sidebar.safetyBridge', defaultLabel: 'Medical Records', mobilePrimary: true },
  { to: '/patient/medicines', icon: Pill, labelKey: 'sidebar.medicines', defaultLabel: 'My Medicines', mobilePrimary: true },
  { to: '/medical-history', icon: ShieldAlert, labelKey: 'sidebar.medicalHistory', defaultLabel: 'Medical History', mobilePrimary: false },
  { to: '/patient/vitals', icon: Activity, labelKey: 'sidebar.vitals', defaultLabel: 'My Vitals' },
  { to: '/patient/visits', icon: ClipboardCheck, labelKey: 'sidebar.visits', defaultLabel: 'Visit Timeline' },
  { to: '/patient/queue', icon: Clock, labelKey: 'sidebar.queue', defaultLabel: 'Live Queue & Appointments' },
  { to: '/patient/profile', icon: UserCircle, labelKey: 'sidebar.profile', defaultLabel: 'Health Profile' },
  { to: '/patient/help', icon: HelpCircle, labelKey: 'sidebar.help', defaultLabel: 'Help & Support' }
];

