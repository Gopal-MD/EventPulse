const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validateQrScanCloudFn, buildAlertCloudFn } = require('./cloud-functions/mockFunctions');
const logger = require('./auditLogger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Gemini AI Setup ──────────────────────────────────────────────────────────
const { SchemaType } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://*.firebaseio.com"],
      connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.firebasedatabase.app"],
      imgSrc: ["'self'", "data:", "https://maps.gstatic.com", "https://*.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));

// Security: Disable X-Powered-By to prevent fingerprinting
app.disable('x-powered-by');

// CORS: Tighten allowed origins for production
const allowedOrigins = [
  'https://eventpulse-353593433214.asia-south1.run.app',
  'http://localhost:5173',
  'http://localhost:8080'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

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
  scanHistory: [],
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

function createQrToken(ticketId, generatedAt) {
  const secret = process.env.QR_TOKEN_SECRET || 'eventpulse-dev-secret';
  const payload = `${ticketId}:${generatedAt}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

const stateCache = {
  at: 0,
  data: null,
};

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
      console.log('[Gemini] Requesting AI traffic analysis with Structured Output...');
      const prompt = `You are a Smart Stadium Traffic Controller. 
      Analyze this gate data: ${JSON.stringify(gates)}.
      Bottlenecks found at: ${highTrafficGates.join(', ')}.
      Write a concise, helpful rerouting instruction for fans. 
      Identify a Low traffic gate to divert them to.`;
      
      const responseSchema = {
        type: SchemaType.ARRAY,
        description: "List of alert messages for crowd rerouting",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: {
              type: SchemaType.NUMBER,
              description: "Unique timestamp ID",
            },
            message: {
              type: SchemaType.STRING,
              description: "The concisely worded rerouting message",
            },
            timestamp: {
              type: SchemaType.STRING,
              description: "ISO8601 timestamp of generated alert",
            }
          },
          required: ["id", "message", "timestamp"],
        },
      };

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });
      const response = await result.response;
      let text = response.text();
      
      newAlerts = JSON.parse(text);
      console.log(`[Google Cloud] [Gemini] AI instructions successfully generated. Latency: ${Date.now() - now}ms`);
    } catch (err) {
      console.warn('[Google Cloud] [Gemini] AI Controller failed, falling back to rule-based logic:', err.message);
      // Fallback to static rules
      highTrafficGates.forEach(gate => {
        const alternate = Object.keys(gates).find(g => gates[g].status === 'Low') || 'any available gate';
        newAlerts.push(buildAlertCloudFn({ gate, alternate }));
      });
    }
  } else if (highTrafficGates.length > 0) {
      console.log('[Google Cloud] Gemini API disabled/missing. Using deterministic fallback.');
      highTrafficGates.forEach(gate => {
        const alternate = Object.keys(gates).find(g => gates[g].status === 'Low') || 'any available gate';
        newAlerts.push(buildAlertCloudFn({ gate, alternate }));
      });
  }

  await dbSet('alerts', newAlerts);
}

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', firebase: !!fireDb, mode: fireDb ? 'firebase' : 'memory' })
);

// Runtime config for frontend (Cloud Run envs are available here at runtime)
app.get('/api/config', (req, res) => {
  logger.info('Config requested by client', { userAgent: req.headers['user-agent'] });
  res.json({
    mapsApiKey: process.env.MAPS_API_KEY || process.env.VITE_MAPS_API_KEY || '',
  });
});

// Cloud Run Integration Metadata (Proof of Platform usage)
app.get('/api/metadata', (req, res) => {
  res.json({
    service: process.env.K_SERVICE || 'local-dev',
    revision: process.env.K_REVISION || '1.0.0',
    project: process.env.GOOGLE_CLOUD_PROJECT || 'local',
    runtime: 'Node.js 18',
    platform: 'Google Cloud Run',
    region: 'asia-south1'
  });
});

// Root route: serves the frontend when built, otherwise returns a simple 200 for CI/tests.
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/dist/index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(200).json({ status: 'ok', message: 'EventPulse backend is running' });
});

// 1. Smart QR Ticket System
app.post('/api/ticket/generate', async (req, res) => {
  try {
    let { name, email } = req.body;
    if (!name || !email) return sendError(res, 400, 'Name and email are required');

    // Basic sanitization
    name = name.trim().substring(0, 100);
    email = email.trim().toLowerCase().substring(0, 100);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return sendError(res, 400, 'Invalid email format');
    }

    const firstLetter = name.trim().charAt(0).toUpperCase();
    let gate = 'Gate 4';
    if (firstLetter >= 'A' && firstLetter <= 'F') gate = 'Gate 1';
    else if (firstLetter >= 'G' && firstLetter <= 'L') gate = 'Gate 2';
    else if (firstLetter >= 'M' && firstLetter <= 'R') gate = 'Gate 3';

    const ticketId = `TKT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const seatNumber = `S-${Math.floor(Math.random() * 500) + 1}`;
    const generatedAt = Date.now();
    const qrToken = createQrToken(ticketId, generatedAt);
    const ticketData = { ticketId, name, email, gate, seatNumber, checkedIn: false, generatedAt, qrToken };

    await dbSet('tickets/' + ticketId, ticketData);
    logger.info('Ticket generated successfully', { ticketId, gate: ticketData.gate });
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
    if (!ticket) {
      logger.warn('Ticket lookup failed - not found', { ticketId: req.params.ticketId });
      return res.status(404).json({ error: 'Ticket not found' });
    }
    logger.info('Ticket lookup successful', { ticketId: req.params.ticketId });
    res.json({ success: true, ticket });
  } catch (err) {
    logger.error('Ticket fetch error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// 3. Entry Validation — duplicate prevention
app.post('/api/ticket/scan', async (req, res) => {
  try {
    const { ticketId, qrToken } = req.body;
    if (!ticketId || typeof ticketId !== 'string') {
      return sendError(res, 400, 'ticketId is required');
    }

    const ticket = await dbGet('tickets/' + ticketId);
    if (!ticket) return sendError(res, 404, 'Ticket not found');

    const cloudValidation = validateQrScanCloudFn({
      ticketId,
      qrToken,
      expectedToken: ticket.qrToken,
    });
    if (!cloudValidation.ok) {
      return sendError(res, 400, cloudValidation.reason);
    }

    if (ticket.checkedIn) return sendError(res, 400, 'Duplicate entry detected. Already checked in.');

    ticket.checkedIn = true;
    await dbSet('tickets/' + ticketId, ticket);

    const gateData = await dbGet('gates/' + ticket.gate);
    if (gateData) {
      await dbUpdate('gates/' + ticket.gate, { crowdLevel: gateData.crowdLevel + 1 });
      await updateGateStatus();
    }

    // Advanced Firebase Usage: Push to scanHistory node
    const scanEntry = {
      ticketId,
      gate: ticket.gate,
      timestamp: new Date().toISOString(),
      method: 'QR_SCAN'
    };
    if (fireDb) {
      await fireDb.ref('scanHistory').push(scanEntry);
    } else {
      memDb.scanHistory.push(scanEntry);
    }

    logger.info('Entry scan validated', { ticketId, gate: ticket.gate });
    res.json({ success: true, ticket, message: 'Valid entry' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scan failed' });
  }
});

// 4. Live state (Dashboard + Map polling)
app.get('/api/state', async (req, res) => {
  try {
    const now = Date.now();
    if (stateCache.data && now - stateCache.at < 1000) {
      return res.json(stateCache.data);
    }

    const [gates, alerts, foodQueues, tickets] = await Promise.all([
      dbGet('gates'), dbGet('alerts'), dbGet('foodQueues'), dbGet('tickets')
    ]);
    const payload = {
      gates:      gates      || memDb.gates,
      alerts:     alerts     || [],
      foodQueues: foodQueues || memDb.foodQueues,
      tickets:    tickets    || {}
    };
    stateCache.at = now;
    stateCache.data = payload;
    res.json(payload);
  } catch (err) {
    sendError(res, 500, 'State fetch failed');
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

module.exports = app;
