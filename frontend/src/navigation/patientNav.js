import {
  Home, ClipboardCheck, FileText, Pill, Clock, Users,
  ArrowRightLeft, ShieldCheck, Building2, HelpCircle,
  Stethoscope, Activity, UserCircle
} from 'lucide-react';

export const patientNav = [
  { to: '/', icon: Home, labelKey: 'sidebar.dashboard', defaultLabel: 'Home', mobilePrimary: true },
  { to: '/patient/visits', icon: ClipboardCheck, labelKey: 'sidebar.visits', defaultLabel: 'Visits', mobilePrimary: true },
  { to: '/patient/records', icon: FileText, labelKey: 'sidebar.records', defaultLabel: 'Records', mobilePrimary: true },
  { to: '/patient/medicines', icon: Pill, labelKey: 'sidebar.medicines', defaultLabel: 'Medicines', mobilePrimary: true },
  { to: '/patient/queue', icon: Clock, labelKey: 'sidebar.queue', defaultLabel: 'My Queue / Appts' },
  { to: '/patient/family', icon: Users, labelKey: 'sidebar.family', defaultLabel: 'Family Members' },
  { to: '/patient/referrals', icon: ArrowRightLeft, labelKey: 'sidebar.referrals', defaultLabel: 'My Referrals' },
  { to: '/patient/consent', icon: ShieldCheck, labelKey: 'sidebar.consent', defaultLabel: 'My Consent' },
  { to: '/patient/abha', icon: Building2, labelKey: 'sidebar.abha', defaultLabel: 'ABHA / ABDM' },
  { to: '/patient/help', icon: HelpCircle, labelKey: 'sidebar.help', defaultLabel: 'Help & Guide', mobilePrimary: true },
  { to: '/patient/opd', icon: Stethoscope, labelKey: 'sidebar.kiosk', defaultLabel: 'OPD Self-Intake' },
  { to: '/patient/vitals', icon: Activity, labelKey: 'sidebar.vitals', defaultLabel: 'My Vitals' },
  { to: '/patient/profile', icon: UserCircle, labelKey: 'sidebar.profile', defaultLabel: 'Health Profile' }
];
