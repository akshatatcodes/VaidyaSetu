import { Monitor, Stethoscope } from 'lucide-react';

export const kioskNav = [
  { to: '/kiosk', icon: Monitor, labelKey: 'sidebar.kioskHome', defaultLabel: 'MediKiosk Terminal' },
  { to: '/kiosk/opd', icon: Stethoscope, labelKey: 'sidebar.kioskOpd', defaultLabel: 'OPD Self-Registration' }
];
