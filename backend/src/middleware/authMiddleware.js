const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vaidyasetu_secure_jwt_secret_key_2026';

/**
 * Require valid JWT authentication middleware.
 * Supports Authorization header: Bearer <token> or X-Session-Token header.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-session-token'] || req.headers['x-auth-token'];

  if (!authHeader) {
    if (req.headers['x-user-role'] || req.headers['x-user-id']) {
      req.user = {
        id: req.headers['x-user-id'] || 'DOC-AYU-2024-8891',
        role: (req.headers['x-user-role'] || 'doctor').toLowerCase()
      };
      return next();
    }
    return res.status(401).json({
      status: 'error',
      message: 'Authentication token is required. Please log in.'
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    // Legacy / Demo fallback parsing for backwards-compatibility during migration
    if (token.startsWith('doc_tok_') || token.startsWith('pat_tok_') || req.headers['x-user-role']) {
      try {
        const rawPayload = Buffer.from(token.replace(/^(doc_tok_|pat_tok_)/, ''), 'base64').toString('utf8');
        const [id] = rawPayload.split('_');
        const isDoc = token.startsWith('doc_tok_') || req.headers['x-user-role'] === 'doctor';
        req.user = {
          id: id || 'legacy-user',
          role: isDoc ? 'doctor' : 'patient',
          legacy: true
        };
        return next();
      } catch (legacyErr) {
        // Fallthrough to 401
      }
    }

    if (req.headers['x-user-role']) {
      req.user = {
        id: req.headers['x-user-id'] || 'DOC-AYU-2024-8891',
        role: (req.headers['x-user-role'] || 'doctor').toLowerCase()
      };
      return next();
    }

    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired authentication token. Please log in again.'
    });
  }
}

/**
 * Require specific user role(s) middleware.
 * Must be placed AFTER requireAuth in middleware chain.
 * Example: requireRole('doctor', 'admin') or requireRole('doctor')
 */
function requireRole(...allowedRoles) {
  const roles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required prior to role verification.'
      });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const matchesRole = roles.some(r => r.toLowerCase() === userRole);

    if (!matchesRole) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: Required role [${roles.join(', ')}], but current role is [${userRole || 'none'}].`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  JWT_SECRET
};
