import { patientNav } from './patientNav';
import { doctorNav } from './doctorNav';
import { labNav } from './labNav';
import { adminNav } from './adminNav';
import { kioskNav } from './kioskNav';

export const roleNavigationMap = {
  patient: patientNav,
  doctor: doctorNav,
  lab: labNav,
  admin: adminNav,
  kiosk: kioskNav
};

export function getNavigationForRole(role = 'patient') {
  return roleNavigationMap[role] || patientNav;
}

export function getMobileNavigationForRole(role = 'patient') {
  const fullNav = getNavigationForRole(role);
  // Collapse the same information architecture for mobile (top items or mobilePrimary)
  return fullNav.filter(item => item.mobilePrimary !== false).slice(0, 7);
}

export { patientNav, doctorNav, labNav, adminNav, kioskNav };
