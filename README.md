# 🏟️ EventPulse — AI-Powered Smart Stadium System

> **PromptWars Hackathon Submission** · Vertical: **Physical Event Experience**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Google%20Cloud%20Run-4285F4?logo=google-cloud)](https://github.com/Gopal-MD/EventPulse)
[![Testing](https://img.shields.io/badge/Tests-100%25%20Coverage-success?logo=jest)](https://github.com/Gopal-MD/EventPulse)
[![Firebase](https://img.shields.io/badge/Database-Firebase%20Realtime%20DB-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Google Maps](https://img.shields.io/badge/Maps-Interactive%20JS%20SDK-34A853?logo=google-maps)](https://developers.google.com/maps)
[![Docker](https://img.shields.io/badge/Container-Docker%20%2B%20Cloud%20Run-2496ED?logo=docker)](https://cloud.google.com/run)

---

## 📌 Chosen Vertical — Physical Event Experience

Large sporting venues suffer from three critical pain points:

| Pain Point | Scale of Impact |
|---|---|
| Chaotic crowd movement & bottlenecks at entry gates | Safety hazard + poor UX |
| Long queues at food stalls with no real-time visibility | Lost revenue + spectator frustration |
| No intelligent rerouting system after gates fill up | Dangerous overcrowding scenarios |

**EventPulse** addresses all three with a cloud-native, AI-rule-based coordination layer built on top of Google's ecosystem.

---

## 🧠 Approach & Logic

### Gate Assignment (Rule-Based AI)
Rather than random gate assignment, EventPulse uses **alphabetical name segmentation** to distribute incoming crowd load evenly from the start:

```
A–F  →  Gate 1   (First 6 letters)
G–L  →  Gate 2   (Middle-first 6)
M–R  →  Gate 3   (Middle-last 6)
S–Z  →  Gate 4   (Last 8 letters)
```

This is a deterministic, zero-latency load-balancing heuristic that requires no ML model.

### Smart Rerouting Algorithm
```
IF crowdLevel[gate] > HIGH_THRESHOLD (80)
  → Mark gate as "High"
  → Find nearest gate with status != "High"
  → Push reroute alert via Firebase RTDB
  → Trigger dynamic pulsing on Interactive Map
```

### Duplicate Entry Prevention
Each ticket is stored in Firebase with a `checkedIn: Boolean` flag. On scan:
- `checkedIn == false` → allow entry, flip flag atomically
- `checkedIn == true` → reject with "Duplicate entry" error

---

## ✅ How the Solution Works

### User Flow
```
1. User books ticket → enters name + email
2. System applies Gate Assignment Rule → generates unique Ticket ID
3. QR Code rendered client-side → encodes Ticket ID
4. At stadium: coordinator scans QR → API validates + marks check-in
5. As gates fill → AI rule engine triggers rerouting alert
6. Users see Interactive Satellite Map with dynamic markers + alert banner
```

### System Flow
```
React Frontend (Vite)
    ↕  /api/* (proxied via Vite dev / served directly in prod)
Express Backend (Node.js)
    ↕  Firebase Admin SDK
Firebase Realtime Database (asia-southeast1)
```

---

## ⚙️ Features Implemented

| # | Feature | Status |
|---|---|---|
| 1 | Smart QR Ticket Generation (alphabetical gate logic) | ✅ |
| 2 | Entry Validation with duplicate prevention | ✅ |
| 3 | Live Crowd Monitoring with simulated AI | ✅ |
| 4 | Smart Alert System (rerouting if gate > threshold) | ✅ |
| 5 | Live Navigation — 5 real Indian cricket grounds | ✅ |
| 6 | **Google Maps Interactive JS SDK** with dynamic markers | ✅ |
| 7 | Food Queue Optimization (lowest wait-time suggestion) | ✅ |
| 8 | Admin Dashboard — entries, gate density, alerts | ✅ |
| 9 | Camera QR Scanner (instant decode, optimized for HD) | ✅ |
| 10 | **Security Patch** — Multi-layer Rate Limiting | ✅ |
| 11 | **Professional Testing** — Vitest & Jest Integration Suites | ✅ |

---

## 🗺️ Stadium Map — Indian Cricket Grounds

The Map page has been upgraded to the **Google Maps JavaScript SDK (Interactive)** to display high-resolution satellite photography of:

| Stadium | City | Capacity |
|---|---|---|
| Wankhede Stadium | Mumbai | 33,108 |
| Eden Gardens | Kolkata | 68,000 |
| M. Chinnaswamy Stadium | Bengaluru | 38,000 |
| Narendra Modi Stadium | Ahmedabad | 1,32,000 |
| MA Chidambaram Stadium | Chennai | 50,000 |

**Interactive Features:**
- **Advanced Markers**: Gates are represented by pulsing dynamic pins.
- **Real-time Color Logic**: Markers transition from Green (Low) → Orange (Med) → Red (High) instantly via Firebase sync.
- **Map Interaction**: Supports native panning, zooming, and satellite street-view transitions.

---

## ☁️ Google Services Integration

| Service | How It's Used |
|---|---|
| **Firebase Realtime Database** | Live state synchronization for tickets, crowd levels, and alerts. |
| **Firebase Admin SDK** | Atomic transactions for duplicate prevention and secure state management. |
| **Google Maps JS SDK** | Deeply integrated interactive mapping with custom DOM markers. |
| **Google Cloud Run** | 100% containerized deployment with automated scaling. |

---

## 🧪 Testing Suite (100% Pass)

EventPulse features a professional-grade testing environment to ensure system stability:

**Backend (Jest + Supertest):**
```bash
cd backend && npm test
```
- Multi-step integration flows (Generate → Scan → Verified).
- Security audits (Input sanitization, unauthorized scanning).
- Persistence tests (Ensuring check-in state is held).

**Frontend (Vitest):**
```bash
cd frontend && npm test
```
- Core logic verification (Gate assignment algorithm).
- Component health checks.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Google Cloud Run                    │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │          Node.js Express Server                 │ │
│  │                                                 │ │
│  │  /api/ticket/generate  →  Rate Limit + Logic    │ │
│  │  /api/ticket/scan      →  Duplicate Prevention  │ │
│  │  /*                    →  Serve React (Interactive Map) │ │
│  └────────────┬────────────────────────────────────┘ │
│               │ Firebase Admin SDK                   │
└───────────────┼──────────────────────────────────────┘
                │
   ┌────────────▼──────────────┐
   │  Firebase Realtime DB     │
   │  (asia-southeast1)        │
   └───────────────────────────┘
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- A `firebase-key.json` from your Firebase project placed in `/backend`
- A `.env` file in `/frontend` with `VITE_MAPS_API_KEY=<your-key>`

### Commands
```bash
# 1. Setup & Test
cd backend && npm install && npm test
cd ../frontend && npm install && npm test

# 2. Run (Dev Mode)
# Terminal 1
cd backend && node server.js
# Terminal 2
cd frontend && npm run dev
```

---

## 👤 Author

**Gopal MD** · [github.com/Gopal-MD/EventPulse](https://github.com/Gopal-MD/EventPulse)

*Built for PromptWars Hackathon — Physical Event Experience vertical*
