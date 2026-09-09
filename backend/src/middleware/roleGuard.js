/**
 * Soft role gate for doctor-only write endpoints.
 * Reads X-User-Role or Authorization demo token role claim.
 * Set REQUIRE_DOCTOR_AUTH=true to enforce in production demos.
 */
function requireDoctorRole(req, res, next) {
  if (process.env.REQUIRE_DOCTOR_AUTH !== 'true') {
    return next();
  }
  const role = String(
    req.headers['x-user-role'] ||
    req.body?.role ||
    ''
  ).toLowerCase();

  if (role === 'doctor' || role === 'admin') {
    return next();
  }
  return res.status(403).json({
    status: 'error',
    message: 'Doctor role required for this action'
  });
}

function requireAdminRole(req, res, next) {
  if (process.env.REQUIRE_ADMIN_AUTH !== 'true' && process.env.ADMIN_OPEN === 'true') {
    return next();
  }
  if (process.env.REQUIRE_ADMIN_AUTH !== 'true') {
    return next();
  }
  const role = String(req.headers['x-user-role'] || '').toLowerCase();
  if (role === 'admin') return next();
  return res.status(403).json({ status: 'error', message: 'Admin role required' });
}

module.exports = { requireDoctorRole, requireAdminRole };
