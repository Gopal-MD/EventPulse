/**
 * EventPulse Database Abstraction Layer
 * Handles the switch between Firebase Realtime DB and In-memory fallback
 */
const path = require('path');
const fs = require('fs');

let fireDb = null;
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

function init(admin) {
  try {
    const keyPath = path.join(__dirname, 'firebase-key.json');
    let credential;

    if (fs.existsSync(keyPath)) {
      credential = admin.credential.cert(require('./firebase-key.json'));
    } else if (process.env.FIREBASE_PRIVATE_KEY) {
      credential = admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      });
    } else {
      throw new Error('No Firebase credentials — using memory');
    }

    admin.initializeApp({
      credential,
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://promptwars-events-default-rtdb.asia-southeast1.firebasedatabase.app'
    });

    fireDb = admin.database();
    console.log('[Database] Firebase connected');

    fireDb.ref('gates').once('value').then(snap => {
      if (!snap.exists()) {
        fireDb.ref('gates').set(memDb.gates);
        fireDb.ref('foodQueues').set(memDb.foodQueues);
      }
    });

  } catch (err) {
    console.warn('[Database] Falling back to Memory:', err.message);
    fireDb = null;
  }
}

/**
 * Get data from the active provider
 */
async function get(path) {
  if (fireDb) {
    const snap = await fireDb.ref(path).once('value');
    return snap.val();
  }
  return path.split('/').reduce((obj, key) => obj?.[key], memDb) ?? null;
}

/**
 * Set data in the active provider
 */
async function set(path, value) {
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

/**
 * Push to a list in the active provider
 */
async function push(path, value) {
  if (fireDb) {
    await fireDb.ref(path).push(value);
  } else {
    const list = await get(path) || [];
    list.push(value);
    await set(path, list);
  }
}

/**
 * Update data (partial) in the active provider
 */
async function update(path, value) {
  if (fireDb) {
    await fireDb.ref(path).update(value);
  } else {
    const existing = await get(path) || {};
    await set(path, { ...existing, ...value });
  }
}

module.exports = { 
  init, 
  get, 
  set, 
  push, 
  update,
  get isFirebase() { return !!fireDb; } 
};
