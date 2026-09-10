const request = require('supertest');
const express = require('express');
const { requirePurpose } = require('../src/middleware/pbacMiddleware');

describe('Phase 48: Standardized Error Handling & Graceful Degradation', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock route demonstrating standard API error response & PBAC check
    app.get('/api/test/resource', (req, res) => {
      const { fail, aiFail } = req.query;

      if (fail === 'network') {
        return res.status(503).json({
          status: 'error',
          code: 'NETWORK_ERROR',
          message: "We couldn't connect. Retry."
        });
      }

      if (aiFail === 'true') {
        return res.status(200).json({
          status: 'degraded',
          code: 'AI_PROCESSING_FAILED',
          message: 'Voice processing failed. You can continue using touch/text.',
          data: { fallbackMode: 'manual_touch_text' }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: []
      });
    });

    // Mock PBAC error middleware
    app.get('/api/test/pbac-protected', (req, res, next) => {
      // Force strict PBAC for test
      process.env.PBAC_STRICT = 'true';
      next();
    }, requirePurpose('clinical_care'), (req, res) => {
      res.json({ status: 'success' });
    });

    // Central 404 handler
    app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'The requested clinical endpoint was not found.'
      });
    });

    // Central Error Handler
    app.use((err, req, res, next) => {
      res.status(err.status || 500).json({
        status: 'error',
        code: err.code || 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred.'
      });
    });
  });

  afterAll(() => {
    delete process.env.PBAC_STRICT;
  });

  test('Returns 503 network error with "We couldn\'t connect. Retry." contract', async () => {
    const res = await request(app).get('/api/test/resource?fail=network');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe("We couldn't connect. Retry.");
  });

  test('Returns 200 degraded status with AI processing failure message and touch/text fallback', async () => {
    const res = await request(app).get('/api/test/resource?aiFail=true');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.code).toBe('AI_PROCESSING_FAILED');
    expect(res.body.message).toBe('Voice processing failed. You can continue using touch/text.');
    expect(res.body.data.fallbackMode).toBe('manual_touch_text');
  });

  test('Returns 403 Forbidden with clear error response on PBAC violation', async () => {
    const res = await request(app)
      .get('/api/test/pbac-protected')
      .set('x-user-role', 'invalid_role');
    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('PBAC_ACCESS_DENIED');
  });

  test('Returns 404 for nonexistent endpoints gracefully', async () => {
    const res = await request(app).get('/api/nonexistent-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
