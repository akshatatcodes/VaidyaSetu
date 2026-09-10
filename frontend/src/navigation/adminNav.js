import {
  Home, Building2, Layers, FlaskConical, Stethoscope, Monitor, Clock,
  Activity, Shield, ShieldCheck, UserCircle, Settings
} from 'lucide-react';

export const adminNav = [
  { to: '/admin', icon: Home, labelKey: 'sidebar.adminOverview', defaultLabel: 'Overview', mobilePrimary: true },
  { to: '/admin/hospitals', icon: Building2, labelKey: 'sidebar.hospitals', defaultLabel: 'Hospitals', mobilePrimary: true },
  { to: '/admin/departments', icon: Layers, labelKey: 'sidebar.departments', defaultLabel: 'Departments', mobilePrimary: true },
  { to: '/admin/labs', icon: FlaskConical, labelKey: 'sidebar.labs', defaultLabel: 'Laboratories' },
  { to: '/admin/doctors', icon: Stethoscope, labelKey: 'sidebar.doctors', defaultLabel: 'Doctors', mobilePrimary: true },
  { to: '/admin/kiosks', icon: Monitor, labelKey: 'sidebar.kiosks', defaultLabel: 'Kiosks' },
  { to: '/admin/queues', icon: Clock, labelKey: 'sidebar.queues', defaultLabel: 'Queues', mobilePrimary: true },
  { to: '/admin/schedules', icon: Clock, labelKey: 'sidebar.schedules', defaultLabel: 'Schedules' },
  { to: '/admin/followup-capacity', icon: Activity, labelKey: 'sidebar.followupCapacity', defaultLabel: 'Follow-up Capacity' },
  { to: '/admin/audit', icon: Shield, labelKey: 'sidebar.audit', defaultLabel: 'Audit Log' },
  { to: '/admin/system-logs', icon: ShieldCheck, labelKey: 'sidebar.systemLogs', defaultLabel: 'Access / Security' },
  { to: '/admin/profile', icon: UserCircle, labelKey: 'sidebar.profile', defaultLabel: 'Profile' },
  { to: '/admin/settings', icon: Settings, labelKey: 'sidebar.settings', defaultLabel: 'Settings' }
];
