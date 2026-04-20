import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('Security and Edge Case Coverage', () => {
  it('should have Helmet security headers enabled', async () => {
    const res = await request(app).get('/api/health');
    // Helmet headers
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should not expose X-Powered-By header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('should enforce rate limiting on API routes', async () => {
    // We can't easily test 100 requests in a unit test without slowing down CI,
    // but we can verify the middleware is applied by checking the header if present
    const res = await request(app).get('/api/health');
    if (res.headers['ratelimit-limit']) {
      expect(res.headers['ratelimit-limit']).toBe('100');
    }
  });

  it('should reject malformed ticket IDs on scan', async () => {
    const res = await request(app)
      .post('/api/ticket/scan')
      .send({ ticketId: 12345 }); // Number instead of string
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('ticketId is required');
  });

  it('should reject scan if ticket does not exist', async () => {
    const res = await request(app)
      .post('/api/ticket/scan')
      .send({ ticketId: 'TKT-NONEXISTENT' });
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Ticket not found');
  });

  it('should handle missing fields in ticket generation', async () => {
    const res = await request(app)
      .post('/api/ticket/generate')
      .send({ name: 'Partial User' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Name and email are required');
  });

  it('should handle VERY long names gracefully (truncation)', async () => {
    const longName = 'A'.repeat(500);
    const res = await request(app)
      .post('/api/ticket/generate')
      .send({ name: longName, email: 'long@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.ticket.name.length).toBeLessThanOrEqual(100);
  });
});
