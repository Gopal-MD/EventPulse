const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Gemini AI Setup ──────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(cors());
app.use(express.json());

// ─── Security: Rate Limiting ──────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// ─── In-memory fallback store (used if Firebase is unavailable) ───────────────
let memDb = {
  tickets: {},
  gates: {
    'Gate 1': { crowdLevel: 0, status: 'Low' },
    'Gate 2': { crowdLevel: 0, status: 'Low' },
    'Gate 3': { crowdLevel: 0, status: 'Low' },
    'Gate 4': { crowdLevel: 0, status: 'Low' }
  },
  alerts: [],
  foodQueues: [
    { id: 1, name: 'Burger Queen', waitTime: 5 },
    { id: 2, name: 'Nacho King', waitTime: 12 },
    { id: 3, name: 'Pizza Planet', waitTime: 25 },
    { id: 4, name: 'Vegan Bytes', waitTime: 3 }
  ]
};

// ─── Firebase Setup (optional — falls back to memDb on any error) ─────────────
let fireDb = null;

try {
  const admin = require('firebase-admin');
  const keyPath = path.join(__dirname, 'firebase-key.json');
  let credential;

  if (fs.existsSync(keyPath)) {
    // Local dev — use JSON file
    credential = admin.credential.cert(require('./firebase-key.json'));
    console.log('[Firebase] Using firebase-key.json');
  } else if (process.env.FIREBASE_PRIVATE_KEY) {
    // Cloud Run — use env vars
    credential = admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    });
    console.log('[Firebase] Using environment variables');
  } else {
    throw new Error('No Firebase credentials found — using in-memory store');
  }

  admin.initializeApp({
    credential,
    databaseURL: process.env.FIREBASE_DATABASE_URL ||
      'https://promptwars-events-default-rtdb.asia-southeast1.firebasedatabase.app'
  });

  fireDb = admin.database();
  console.log('[Firebase] Realtime Database connected');

  // Seed default data on first run
  fireDb.ref('gates').once('value').then(snap => {
    if (!snap.exists()) {
      fireDb.ref('gates').set(memDb.gates);
      fireDb.ref('foodQueues').set(memDb.foodQueues);
      fireDb.ref('alerts').set([]);
      console.log('[Firebase] Seeded default data');
    }
  });

} catch (err) {
  console.warn('[Firebase] Init failed — running with in-memory store:', err.message);
  fireDb = null;
}

// ─── Database helpers (abstract over Firebase vs memDb) ───────────────────────
async function dbGet(path) {
  if (fireDb) {
    const snap = await fireDb.ref(path).once('value');
    return snap.val();
  }
  // Navigate memDb path e.g. 'tickets/TKT-ABC'
  return path.split('/').reduce((obj, key) => obj?.[key], memDb) ?? null;
}

async function dbSet(path, value) {
  if (fireDb) {
    await fireDb.ref(path).set(value);
  } else {
    const keys = path.split('/');
    const last = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, memDb);
    target[last] = value;
  }
}

async function dbUpdate(path, value) {
  if (fireDb) {
    await fireDb.ref(path).update(value);
  } else {
    const existing = await dbGet(path) || {};
    await dbSet(path, { ...existing, ...value });
  }
}

// ─── AI Rule Engine ───────────────────────────────────────────────────────────
async function updateGateStatus() {
  const thresholds = { high: 80, medium: 40 };
  const gates = await dbGet('gates') || {};
  let newAlerts = [];

  // 1. Update basic status markers (for UI coloring)
  for (const gate of Object.keys(gates)) {
    const crowd = gates[gate].crowdLevel;
    let newStatus = 'Low';
    if (crowd > thresholds.high) newStatus = 'High';
    else if (crowd > thresholds.medium) newStatus = 'Medium';
    await dbUpdate('gates/' + gate, { status: newStatus });
    gates[gate].status = newStatus;
  }

  // 2. Use Gemini AI for smart rerouting directions if bottlenecks exist
  const highTrafficGates = Object.keys(gates).filter(g => gates[g].status === 'High');
  
  if (highTrafficGates.length > 0 && process.env.GEMINI_API_KEY) {
    try {
      console.log('[Gemini] Requesting AI traffic analysis...');
      const prompt = `You are a Smart Stadium Traffic Controller. 
      Analyze this gate data: ${JSON.stringify(gates)}.
      Bottlenecks found at: ${highTrafficGates.join(', ')}.
      Write a concise, helpful rerouting instruction for fans. 
      Identify a Low traffic gate to divert them to.
      Output ONLY a JSON array of objects: [{"id": 123, "message": "string", "timestamp": "ISO8601"}].`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Sanitization: remove markdown code blocks if any
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      newAlerts = JSON.parse(text);
      console.log('[Gemini] AI instructions generated');
    } catch (err) {
      console.warn('[Gemini] AI Controller failed, falling back to rule-based logic:', err.message);
      // Fallback to static rules
      highTrafficGates.forEach(gate => {
        const alternate = Object.keys(gates).find(g => gates[g].status !== 'High') || 'any available gate';
        newAlerts.push({
          id: Date.now(),
          message: `${gate} is highly crowded! AI suggests using ${alternate}.`,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  await dbSet('alerts', newAlerts);
}

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', firebase: !!fireDb, mode: fireDb ? 'firebase' : 'memory' })
);

// 1. Smart QR Ticket System
app.post('/api/ticket/generate', async (req, res) => {
  try {
    let { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    // Basic sanitization
    name = name.trim().substring(0, 100);
    email = email.trim().toLowerCase().substring(0, 100);

    const firstLetter = name.trim().charAt(0).toUpperCase();
    let gate = 'Gate 4';
    if (firstLetter >= 'A' && firstLetter <= 'F') gate = 'Gate 1';
    else if (firstLetter >= 'G' && firstLetter <= 'L') gate = 'Gate 2';
    else if (firstLetter >= 'M' && firstLetter <= 'R') gate = 'Gate 3';

    const ticketId = `TKT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const seatNumber = `S-${Math.floor(Math.random() * 500) + 1}`;
    const ticketData = { ticketId, name, email, gate, seatNumber, checkedIn: false, generatedAt: Date.now() };

    await dbSet('tickets/' + ticketId, ticketData);
    res.json({ success: true, ticket: ticketData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate ticket' });
  }
});

// 2. Get ticket by ID
app.get('/api/ticket/:ticketId', async (req, res) => {
  try {
    const ticket = await dbGet('tickets/' + req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// 3. Entry Validation — duplicate prevention
app.post('/api/ticket/scan', async (req, res) => {
  try {
    const { ticketId } = req.body;
    const ticket = await dbGet('tickets/' + ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.checkedIn) return res.status(400).json({ error: 'Duplicate entry detected. Already checked in.' });

    ticket.checkedIn = true;
    await dbSet('tickets/' + ticketId, ticket);

    const gateData = await dbGet('gates/' + ticket.gate);
    if (gateData) {
      await dbUpdate('gates/' + ticket.gate, { crowdLevel: gateData.crowdLevel + 1 });
      await updateGateStatus();
    }
    res.json({ success: true, ticket, message: 'Valid entry' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scan failed' });
  }
});

// 4. Live state (Dashboard + Map polling)
app.get('/api/state', async (req, res) => {
  try {
    const [gates, alerts, foodQueues, tickets] = await Promise.all([
      dbGet('gates'), dbGet('alerts'), dbGet('foodQueues'), dbGet('tickets')
    ]);
    res.json({
      gates:      gates      || memDb.gates,
      alerts:     alerts     || [],
      foodQueues: foodQueues || memDb.foodQueues,
      tickets:    tickets    || {}
    });
  } catch (err) {
    res.status(500).json({ error: 'State fetch failed' });
  }
});

// 5. Force crowd simulation (testing)
app.post('/api/simulate', async (req, res) => {
  try {
    const gates = await dbGet('gates') || memDb.gates;
    for (const gate of Object.keys(gates)) {
      await dbUpdate('gates/' + gate, { crowdLevel: Math.floor(Math.random() * 100) });
    }
    const queues = await dbGet('foodQueues') || memDb.foodQueues;
    for (let i = 0; i < queues.length; i++) {
      await dbUpdate('foodQueues/' + i, { waitTime: Math.floor(Math.random() * 30) });
    }
    await updateGateStatus();
    const state = await dbGet('/') || memDb;
    res.json({ success: true, message: 'Simulated crowd data', state });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

// ─── Serve React Frontend ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ─── Start Server — ALWAYS binds to PORT regardless of Firebase status ────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[EventPulse] Server listening on port ${PORT}`);
    console.log(`[EventPulse] Database: ${fireDb ? 'Firebase Realtime DB' : 'In-memory (demo mode)'}`);
  });
}

module.exports = app;
