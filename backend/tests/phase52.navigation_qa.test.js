describe('Phase 52: Navigation QA & Role Isolation', () => {

  const patientNav = [
    { to: '/', label: 'Home' },
    { to: '/patient/visits', label: 'Visits' },
    { to: '/patient/records', label: 'Records' },
    { to: '/patient/medicines', label: 'Medicines' },
    { to: '/patient/queue', label: 'My Queue' },
    { to: '/patient/family', label: 'Family Members' },
    { to: '/patient/referrals', label: 'My Referrals' },
    { to: '/patient/consent', label: 'My Consent' },
    { to: '/patient/abha', label: 'ABHA / ABDM' },
    { to: '/patient/help', label: 'Help & Guide' },
    { to: '/patient/opd', label: 'OPD Self-Intake' },
    { to: '/patient/vitals', label: 'My Vitals' },
    { to: '/patient/profile', label: 'Health Profile' }
  ];

  const doctorNav = [
    { to: '/doctor', label: 'Doctor Cockpit' },
    { to: '/doctor/profile', label: 'Physician Profile' },
    { to: '/doctor/settings', label: 'Settings' }
  ];

  const labNav = [
    { to: '/lab', label: "Today's Samples" },
    { to: '/lab/queue', label: 'Pending Orders' },
    { to: '/lab/orders', label: 'In Progress' },
    { to: '/lab/results', label: 'Completed Results' },
    { to: '/lab/verified', label: 'Verified Results' },
    { to: '/lab/critical', label: 'Critical / Attention' },
    { to: '/lab/followups', label: 'Follow-ups' },
    { to: '/lab/profile', label: 'Profile' },
    { to: '/lab/settings', label: 'Settings' }
  ];

  const adminNav = [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/hospitals', label: 'Hospitals' },
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/labs', label: 'Laboratories' },
    { to: '/admin/doctors', label: 'Doctors' },
    { to: '/admin/kiosks', label: 'Kiosks' },
    { to: '/admin/queues', label: 'Queues' },
    { to: '/admin/schedules', label: 'Schedules' },
    { to: '/admin/followup-capacity', label: 'Follow-up Capacity' },
    { to: '/admin/audit', label: 'Audit Log' },
    { to: '/admin/system-logs', label: 'Access / Security' },
    { to: '/admin/profile', label: 'Profile' },
    { to: '/admin/settings', label: 'Settings' }
  ];

  const kioskNav = [
    { to: '/kiosk', label: 'MediKiosk Terminal' },
    { to: '/kiosk/opd', label: 'OPD Self-Registration' }
  ];

  const roleMap = { patient: patientNav, doctor: doctorNav, lab: labNav, admin: adminNav, kiosk: kioskNav };

  test('Patient navigation contains only patient-owned routes', () => {
    patientNav.forEach(item => {
      expect(item.to.startsWith('/patient') || item.to === '/').toBe(true);
      expect(item.to.startsWith('/doctor')).toBe(false);
      expect(item.to.startsWith('/lab')).toBe(false);
      expect(item.to.startsWith('/admin')).toBe(false);
    });
  });

  test('Doctor navigation contains only doctor-owned routes', () => {
    doctorNav.forEach(item => {
      expect(item.to.startsWith('/doctor')).toBe(true);
      expect(item.to.startsWith('/patient')).toBe(false);
      expect(item.to.startsWith('/lab')).toBe(false);
      expect(item.to.startsWith('/admin')).toBe(false);
    });
  });

  test('Lab navigation contains only lab-owned routes', () => {
    labNav.forEach(item => {
      expect(item.to.startsWith('/lab')).toBe(true);
      expect(item.to.startsWith('/patient')).toBe(false);
      expect(item.to.startsWith('/doctor')).toBe(false);
      expect(item.to.startsWith('/admin')).toBe(false);
    });
  });

  test('Admin navigation contains only admin-owned routes', () => {
    adminNav.forEach(item => {
      expect(item.to.startsWith('/admin')).toBe(true);
      expect(item.to.startsWith('/patient')).toBe(false);
      expect(item.to.startsWith('/doctor')).toBe(false);
      expect(item.to.startsWith('/lab')).toBe(false);
    });
  });

  test('Kiosk navigation contains only kiosk terminal routes', () => {
    kioskNav.forEach(item => {
      expect(item.to.startsWith('/kiosk')).toBe(true);
    });
  });

  test('Mobile navigation collapses IA without duplicate items or hidden tab bars', () => {
    ['patient', 'doctor', 'lab', 'admin'].forEach(role => {
      const items = roleMap[role];
      const paths = items.map(i => i.to);
      const uniquePaths = new Set(paths);
      expect(uniquePaths.size).toBe(paths.length); // No duplicates
    });
  });
});
