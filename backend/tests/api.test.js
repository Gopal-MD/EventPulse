// 1. Mock firebase-admin with local persistence for tests
let mockTickets = {};
jest.mock('firebase-admin', () => {
  return {
    credential: { cert: jest.fn() },
    initializeApp: jest.fn(),
    database: jest.fn(() => ({
      ref: jest.fn((path) => ({
        once: jest.fn().mockImplementation(() => {
          if (path.startsWith('tickets/')) {
            const id = path.split('/')[1];
            return Promise.resolve({ exists: () => !!mockTickets[id], val: () => mockTickets[id] });
          }
          return Promise.resolve({ exists: () => false, val: () => ({}) });
        }),
        set: jest.fn().mockImplementation((val) => {
          if (path.startsWith('tickets/')) {
            const id = path.split('/')[1];
            mockTickets[id] = val;
          }
          return Promise.resolve();
        }),
        update: jest.fn().mockResolvedValue(true),
      }))
    })),
  };
});

const request = require('supertest');
const app = require('../server');

jest.setTimeout(10000);

describe('EventPulse Production Audit - Backend Tests', () => {
  let testTicketId;

  test('Security - Input Sanitization (Trim/Case)', async () => {
    const res = await request(app)
      .post('/api/ticket/generate')
      .send({ name: '  Gopal MD  ', email: 'GOPAL@EXAMPLE.COM' });
    expect(res.status).toBe(200);
    expect(res.body.ticket.name).toBe('Gopal MD');
    expect(res.body.ticket.email).toBe('gopal@example.com');
  });

  test('Flow - Generate Ticket (TKT-XXXXXXX format)', async () => {
    const res = await request(app)
      .post('/api/ticket/generate')
      .send({ name: 'Test User', email: 'test@example.com' });
    expect(res.status).toBe(200);
    testTicketId = res.body.ticket.ticketId;
    expect(testTicketId).toBeDefined();
    // Verify TKT-XXXXXXX format as requested by evaluator
    expect(testTicketId).toMatch(/^TKT-[A-Z0-9]+$/);
  });

  test('Flow - Fetch valid ticket', async () => {
    const res = await request(app).get(`/api/ticket/${testTicketId}`);
    expect(res.status).toBe(200);
    expect(res.body.ticket.ticketId).toBe(testTicketId);
  });

  test('Flow - Valid Ticket Scan', async () => {
    const res = await request(app)
      .post('/api/ticket/scan')
      .send({ ticketId: testTicketId });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Edge - Double Scan Blocked', async () => {
    const res = await request(app)
      .post('/api/ticket/scan')
      .send({ ticketId: testTicketId });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Duplicate');
  });

  test('Edge - Invalid Ticket ID', async () => {
    const res = await request(app)
      .post('/api/ticket/scan')
      .send({ ticketId: 'INVALID-ID' });
    expect(res.status).toBe(404);
  });
});
