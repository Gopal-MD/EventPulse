# 🏟️ EventPulse — AI-Powered Smart Stadium System

> **PromptWars Hackathon Submission** · Vertical: **Physical Event Experience**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Google%20Cloud%20Run-4285F4?logo=google-cloud)](https://github.com/Gopal-MD/EventPulse)
[![Firebase](https://img.shields.io/badge/Database-Firebase%20Realtime%20DB-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Google Maps](https://img.shields.io/badge/Maps-Google%20Static%20Maps%20API-34A853?logo=google-maps)](https://developers.google.com/maps)
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
  → Push rerouting alert to all clients
  → Highlight on stadium satellite map
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
6. Users see satellite map with colored gate dots + smart alert banner
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
| 6 | Google Maps Static API satellite view with gate overlays | ✅ |
| 7 | Food Queue Optimization (lowest wait-time suggestion) | ✅ |
| 8 | Admin Dashboard — entries, gate density, alerts | ✅ |
| 9 | Camera QR Scanner (60fps, instant decode) | ✅ |
| 10 | **Bonus** — AR-style directional alert banner | ✅ |

---

## 🗺️ Stadium Map — Indian Cricket Grounds

The Map page uses **Google Maps Static API** to display real satellite photography of:

| Stadium | City | Capacity |
|---|---|---|
| Wankhede Stadium | Mumbai | 33,108 |
| Eden Gardens | Kolkata | 68,000 |
| M. Chinnaswamy Stadium | Bengaluru | 38,000 |
| Narendra Modi Stadium | Ahmedabad | 1,32,000 |
| MA Chidambaram Stadium | Chennai | 50,000 |

Live crowd-status dots are overlaid on the satellite image per gate. High-crowd gates pulse red with an animation.

---

## ☁️ Google Services Integration

| Service | How It's Used |
|---|---|
| **Firebase Realtime Database** | Persistent storage for tickets, crowd levels, alerts, food queues |
| **Firebase Admin SDK** | Secure server-side write/read, atomic flag updates for duplicate prevention |
| **Google Maps Static API** | High-res satellite imagery of 5 real Indian cricket stadiums |
| **Google Cloud Run** | Containerized deployment via `Dockerfile` — auto-scales to zero |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Google Cloud Run                    │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │          Node.js Express Server                 │ │
│  │                                                 │ │
│  │  /api/ticket/generate  →  Gate Assignment Rule  │ │
│  │  /api/ticket/scan      →  Duplicate Prevention  │ │
│  │  /api/simulate         →  AI Crowd Simulation   │ │
│  │  /api/state            →  Live State Snapshot   │ │
│  │  /*                    →  Serve React (dist/)   │ │
│  └────────────┬────────────────────────────────────┘ │
│               │ Firebase Admin SDK                   │
└───────────────┼──────────────────────────────────────┘
                │
   ┌────────────▼──────────────┐
   │  Firebase Realtime DB     │
   │  (asia-southeast1)        │
   │  /tickets /gates          │
   │  /alerts  /foodQueues     │
   └───────────────────────────┘
```

---

## 📁 Project Structure

```
EventPulse/
├── Dockerfile                # Multi-stage build for Cloud Run
├── .dockerignore
├── .gitignore                # Excludes firebase-key.json, .env, node_modules
├── README.md
├── backend/
│   ├── server.js             # Express API + Firebase Admin + static serving
│   ├── firebase-key.json     # 🔒 GITIGNORED — service account (add manually)
│   └── package.json
└── frontend/
    ├── .env                  # 🔒 GITIGNORED — VITE_MAPS_API_KEY
    ├── vite.config.js        # Proxy /api to backend in dev
    └── src/
        ├── App.jsx           # Router + Nav
        ├── index.css         # Design system (glassmorphism, dark theme)
        └── pages/
            ├── TicketView.jsx       # QR ticket generation
            ├── ScannerInterface.jsx # QR camera scanner + manual input
            ├── Dashboard.jsx        # Admin control center
            └── LiveNavigation.jsx   # Satellite stadium map
```

---

## 🔐 Security

- **`firebase-key.json` is gitignored** — never committed to the repository
- **Google Maps API Key** stored as a Vite env variable (`VITE_MAPS_API_KEY`) — not hardcoded in source
- **Duplicate scan prevention** via atomic Firebase flag, preventing ticket reuse
- **Input validation** on all API endpoints (name, email required; ticket ID existence check)
- **CORS** enabled only for trusted origins via `cors` middleware

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- A `firebase-key.json` from your Firebase project placed in `/backend`
- A `.env` file in `/frontend` with `VITE_MAPS_API_KEY=<your-key>`

### Option 1: Docker (matches Cloud Run exactly)
```bash
docker build -t eventpulse .
docker run -p 8080:8080 \
  -v $(pwd)/backend/firebase-key.json:/app/backend/firebase-key.json \
  eventpulse
```
Open: http://localhost:8080

### Option 2: Node Dev Mode
```bash
# Terminal 1 — Backend
cd backend
npm install
node server.js

# Terminal 2 — Frontend (with hot reload)
cd frontend
npm install
npm run dev
```
Open: http://localhost:5173

---

## ☁️ Deploy to Google Cloud Run
```bash
# One-command deploy from repo root
gcloud run deploy eventpulse \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars VITE_MAPS_API_KEY=<your-key>
```

---

## 🧪 Testing the System

1. **Ticket Generation** — Go to `/` → enter any name starting with A–F → confirm Gate 1 is assigned
2. **Gate Logic** — Test names starting with G, M, S → verify Gates 2, 3, 4 are assigned respectively
3. **Duplicate Prevention** — Scan same Ticket ID twice → second scan shows "Duplicate entry detected"
4. **Crowd Simulation** — Go to `/dashboard` → click "Force Simulate Crowd Change" → watch gate statuses and alerts update live
5. **Rerouting Alert** — Trigger simulation until a gate hits "High" → alert banner appears on both Dashboard and Map page
6. **Stadium Map** — Go to `/nav` → switch between 5 Indian cricket stadiums in dropdown → satellite map updates in real time

---

## 📐 Assumptions

1. Gate assignment is based on the **first letter of the attendee's name** — a simple, effective heuristic for even distribution.
2. Crowd levels are **simulated server-side** with randomized periodic updates (representative of real sensor feeds in production).
3. The **Firebase Realtime Database URL** is region-specific to `asia-southeast1` for low-latency access from India.
4. The system is designed as an **MVP prototype** — production hardening (rate limiting, auth tokens, real IoT crowd sensors) would be the next phase.
5. The `firebase-key.json` and `.env` API keys are excluded from the repo by design — operators must provide their own credentials.

---

## 👤 Author

**Gopal MD** · [github.com/Gopal-MD/EventPulse](https://github.com/Gopal-MD/EventPulse)

*Built for PromptWars Hackathon — Physical Event Experience vertical*
