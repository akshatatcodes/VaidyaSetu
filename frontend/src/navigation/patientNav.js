import {
  Home, ClipboardCheck, FileText, Pill, Clock,
  HelpCircle, Stethoscope, Activity, UserCircle, ShieldAlert
} from 'lucide-react';

export const patientNav = [
  { to: '/', icon: Home, labelKey: 'sidebar.dashboard', defaultLabel: 'Dashboard', mobilePrimary: true },
  { to: '/kiosk', icon: Stethoscope, labelKey: 'sidebar.kiosk', defaultLabel: 'MediKiosk Intake', mobilePrimary: true },
  { to: '/patient/records', icon: FileText, labelKey: 'sidebar.safetyBridge', defaultLabel: 'Safety Bridge', mobilePrimary: true },
  { to: '/medical-history', icon: ShieldAlert, labelKey: 'sidebar.medicalHistory', defaultLabel: 'Medical History', mobilePrimary: true },
  { to: '/patient/medicines', icon: Pill, labelKey: 'sidebar.medicines', defaultLabel: 'Medicines', mobilePrimary: true },
  { to: '/patient/vitals', icon: Activity, labelKey: 'sidebar.vitals', defaultLabel: 'My Vitals' },
  { to: '/patient/visits', icon: ClipboardCheck, labelKey: 'sidebar.visits', defaultLabel: 'Visits' },
  { to: '/patient/queue', icon: Clock, labelKey: 'sidebar.queue', defaultLabel: 'My Queue / Appts' },
  { to: '/patient/profile', icon: UserCircle, labelKey: 'sidebar.profile', defaultLabel: 'Health Profile' },
  { to: '/patient/help', icon: HelpCircle, labelKey: 'sidebar.help', defaultLabel: 'Help & Guide' }
];

