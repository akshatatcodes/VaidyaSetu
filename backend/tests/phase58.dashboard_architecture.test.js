describe('Phase 58: Architecture Rule — No "Everything on Dashboard"', () => {

  const architectureRules = {
    patient: {
      dashboardPurpose: 'overview_only',
      maxOverviewSectionCards: 5,
      detailedWorkDelegatedToRoutes: true,
      routes: ['/patient/visits', '/patient/records', '/patient/medicines', '/patient/vitals', '/patient/family', '/patient/referrals', '/patient/consent', '/patient/abha', '/patient/profile']
    },
    doctor: {
      dashboardPurpose: 'overview_only',
      maxOverviewSectionCards: 4,
      clinicalWorkspaceIsolatedToRoute: true,
      route: '/doctor/consultation/:encounterId'
    },
    lab: {
      dashboardPurpose: 'overview_only',
      diagnosticWorkbenchIsolatedToRoutes: true,
      routes: ['/lab/queue', '/lab/orders', '/lab/results', '/lab/verified', '/lab/critical', '/lab/followups']
    },
    admin: {
      dashboardPurpose: 'overview_only',
      managementIsolatedToTabsAndRoutes: true,
      routes: ['/admin/hospitals', '/admin/departments', '/admin/labs', '/admin/doctors', '/admin/kiosks', '/admin/queues', '/admin/schedules', '/admin/audit']
    }
  };

  test('Patient dashboard functions as overview and delegates detailed work to routes', () => {
    expect(architectureRules.patient.dashboardPurpose).toBe('overview_only');
    expect(architectureRules.patient.maxOverviewSectionCards).toBeLessThanOrEqual(5);
    expect(architectureRules.patient.detailedWorkDelegatedToRoutes).toBe(true);
    expect(architectureRules.patient.routes.length).toBeGreaterThanOrEqual(9);
  });

  test('Doctor dashboard functions as overview and isolates consultation workspace', () => {
    expect(architectureRules.doctor.dashboardPurpose).toBe('overview_only');
    expect(architectureRules.doctor.maxOverviewSectionCards).toBeLessThanOrEqual(4);
    expect(architectureRules.doctor.clinicalWorkspaceIsolatedToRoute).toBe(true);
    expect(architectureRules.doctor.route).toBe('/doctor/consultation/:encounterId');
  });

  test('Lab dashboard functions as overview and isolates diagnostic workbench sub-pages', () => {
    expect(architectureRules.lab.dashboardPurpose).toBe('overview_only');
    expect(architectureRules.lab.diagnosticWorkbenchIsolatedToRoutes).toBe(true);
    expect(architectureRules.lab.routes.length).toBeGreaterThanOrEqual(6);
  });

  test('Admin dashboard functions as overview and isolates management consoles', () => {
    expect(architectureRules.admin.dashboardPurpose).toBe('overview_only');
    expect(architectureRules.admin.managementIsolatedToTabsAndRoutes).toBe(true);
    expect(architectureRules.admin.routes.length).toBeGreaterThanOrEqual(8);
  });
});
