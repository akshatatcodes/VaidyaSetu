/**
 * Phase 10: Auth-aware API headers.
 * Reads the persisted session (JWT) and active role so role-guarded
 * backend routes (requireAuth + requireRole) authenticate correctly.
 */
export function authHeaders(role) {
  const headers = {};

  // Prefer the real JWT so requireAuth can verify the token.
  try {
    const sessionStr = localStorage.getItem('vaidya_auth_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
    }
  } catch (e) {
    /* no-op */
  }

  // Backwards-compatible role hint for demo/header-fallback paths.
  const activeRole =
    role ||
    localStorage.getItem('vaidya_active_role') ||
    '';
  if (activeRole) {
    headers['X-User-Role'] = activeRole;
  }

  return headers;
}
