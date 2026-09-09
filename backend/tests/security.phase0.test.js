const jwt = require('jsonwebtoken');
const { requireAuth, requireRole, JWT_SECRET } = require('../src/middleware/authMiddleware');

describe('Phase 0 — Security & Routing Foundation', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('requireAuth rejects missing token with HTTP 401', () => {
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    expect(next).not.toHaveBeenCalled();
  });

  test('requireAuth passes valid JWT token and populates req.user', () => {
    const token = jwt.sign({ id: 'DOC-123', role: 'doctor' }, JWT_SECRET, { expiresIn: '1h' });
    req.headers.authorization = `Bearer ${token}`;

    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('DOC-123');
    expect(req.user.role).toBe('doctor');
  });

  test('requireRole allows correct user role', () => {
    req.user = { id: 'DOC-123', role: 'doctor' };
    const guard = requireRole('doctor', 'admin');

    guard(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('requireRole rejects unauthorized role with HTTP 403', () => {
    req.user = { id: 'PAT-456', role: 'patient' };
    const guard = requireRole('doctor', 'admin');

    guard(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }));
    expect(next).not.toHaveBeenCalled();
  });
});
