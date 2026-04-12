const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('./firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://promptwars-events-default-rtdb.asia-southeast1.firebasedatabase.app"
});
const fireDb = admin.database();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Initialize default state if missing
async function initializeDb() {
  const gatesRef = fireDb.ref('gates');
  const snap = await gatesRef.once('value');
  if (!snap.exists()) {
    await gatesRef.set({
      'Gate 1': { crowdLevel: 0, status: 'Low' },
      'Gate 2': { crowdLevel: 0, status: 'Low' },
      'Gate 3': { crowdLevel: 0, status: 'Low' },
      'Gate 4': { crowdLevel: 0, status: 'Low' }
    });
    await fireDb.ref('foodQueues').set([
      { id: 1, name: 'Burger Queen', waitTime: 5 },
      { id: 2, name: 'Nacho King', waitTime: 12 },
      { id: 3, name: 'Pizza Planet', waitTime: 25 },
      { id: 4, name: 'Vegan Bytes', waitTime: 3 }
    ]);
    await fireDb.ref('alerts').set([]);
  }
}
initializeDb();

// API ROUTES

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 1. Smart QR Ticket System
app.post('/api/ticket/generate', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });

  const firstLetter = name.trim().charAt(0).toUpperCase();
  let gate = 'Gate 4';
  if (firstLetter >= 'A' && firstLetter <= 'F') gate = 'Gate 1';
  else if (firstLetter >= 'G' && firstLetter <= 'L') gate = 'Gate 2';
  else if (firstLetter >= 'M' && firstLetter <= 'R') gate = 'Gate 3';

  const ticketId = `TKT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const seatNumber = `S-${Math.floor(Math.random() * 500) + 1}`;

  const ticketData = { ticketId, name, email, gate, seatNumber, checkedIn: false, generatedAt: Date.now() };
  
  await fireDb.ref('tickets/' + ticketId).set(ticketData);
  res.json({ success: true, ticket: ticketData });
});

app.get('/api/ticket/:ticketId', async (req, res) => {
  const snap = await fireDb.ref('tickets/' + req.params.ticketId).once('value');
  if (!snap.exists()) return res.status(404).json({ error: 'Ticket not found' });
  res.json({ success: true, ticket: snap.val() });
});

// 2. Entry Validation System
app.post('/api/ticket/scan', async (req, res) => {
  const { ticketId } = req.body;
  const ticketRef = fireDb.ref('tickets/' + ticketId);
  const snap = await ticketRef.once('value');
  
  if (!snap.exists()) return res.status(404).json({ error: 'Ticket not found' });
  
  const ticket = snap.val();
  if (ticket.checkedIn) return res.status(400).json({ error: 'Duplicate entry detected. Already checked in.' });

  ticket.checkedIn = true;
  await ticketRef.set(ticket);

  // Increment crowd counter
  const gateRef = fireDb.ref('gates/' + ticket.gate);
  const gateSnap = await gateRef.once('value');
  if (gateSnap.exists()) {
    const gateData = gateSnap.val();
    await gateRef.update({ crowdLevel: gateData.crowdLevel + 1 });
    await updateGateStatus();
  }

  res.json({ success: true, ticket, message: 'Valid entry' });
});

// 3. Live Crowd & Alert System Simulation
async function updateGateStatus() {
  const thresholds = { high: 80, medium: 40 };
  const gatesSnap = await fireDb.ref('gates').once('value');
  const gates = gatesSnap.val();
  let newAlerts = [];

  for (let gate of Object.keys(gates)) {
    let crowd = gates[gate].crowdLevel;
    let newStatus = 'Low';
    if (crowd > thresholds.high) newStatus = 'High';
    else if (crowd > thresholds.medium) newStatus = 'Medium';
    
    await fireDb.ref('gates/' + gate).update({ status: newStatus });

    if (newStatus === 'High') {
      const alternate = Object.keys(gates).find(g => gates[g].status !== 'High') || 'any available gate';
      newAlerts.push({
        id: Date.now(),
        message: `${gate} is highly crowded! Please route to ${alternate}.`,
        timestamp: new Date().toISOString()
      });
    }
  }
  await fireDb.ref('alerts').set(newAlerts);
}

// Endpoint for Dashboard & Live Nav
app.get('/api/state', async (req, res) => {
  const snap = await fireDb.ref('/').once('value');
  const dbVal = snap.val() || {};
  res.json({
    gates: dbVal.gates || {},
    alerts: dbVal.alerts || [],
    foodQueues: dbVal.foodQueues || [],
    tickets: dbVal.tickets || {}
  });
});

// Endpoint to force simulate crowd for testing
app.post('/api/simulate', async (req, res) => {
  const gatesSnap = await fireDb.ref('gates').once('value');
  if (gatesSnap.exists()) {
    const gates = gatesSnap.val();
    for (let gate of Object.keys(gates)) {
      await fireDb.ref('gates/' + gate).update({ crowdLevel: Math.floor(Math.random() * 100) });
    }
  }
  const foodSnap = await fireDb.ref('foodQueues').once('value');
  if (foodSnap.exists()) {
    const queues = foodSnap.val();
    for (let i = 0; i < queues.length; i++) {
        await fireDb.ref(`foodQueues/${i}`).update({ waitTime: Math.floor(Math.random() * 30) });
    }
  }
  
  await updateGateStatus();
  const fullSnap = await fireDb.ref('/').once('value');
  res.json({ success: true, message: 'Simulated new crowd data', state: fullSnap.val() });
});

// Serve React Frontend (For Cloud Run)
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running with Firebase DB on port ${PORT}`);
});
