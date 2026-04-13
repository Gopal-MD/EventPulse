import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../backend/server.js';

describe('EventPulse route coverage', () => {
  it('loads the Google Maps API key through the runtime config endpoint', async () => {
    process.env.MAPS_API_KEY = 'test-maps-key-123';

    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body.mapsApiKey).toBe('test-maps-key-123');
  });

  it('returns 200 OK from the root route', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text?.length || JSON.stringify(res.body || {}).length).toBeGreaterThan(0);
  });

  it('creates a ticket with a valid QR payload', async () => {
    const res = await request(app)
      .post('/api/ticket/generate')
      .send({ name: 'Alice Runner', email: 'alice@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ticket.ticketId).toMatch(/^TKT-[A-Z0-9]{7}$/);
    expect(res.body.ticket.qrToken).toBeTruthy();
  });

  it('blocks duplicate scans after first validation', async () => {
    const generated = await request(app)
      .post('/api/ticket/generate')
      .send({ name: 'Bob Tester', email: 'bob@example.com' });

    const ticketId = generated.body.ticket.ticketId;
    const qrToken = generated.body.ticket.qrToken;

    const firstScan = await request(app)
      .post('/api/ticket/scan')
      .send({ ticketId, qrToken });

    const secondScan = await request(app)
      .post('/api/ticket/scan')
      .send({ ticketId, qrToken });

    expect(firstScan.status).toBe(200);
    expect(secondScan.status).toBe(400);
    expect(secondScan.body.error).toContain('Duplicate entry detected');
  });
});
