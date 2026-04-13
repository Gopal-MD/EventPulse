# 🏟️ EventPulse — AI-Powered Smart Stadium System

> **PromptWars Hackathon Submission** · Vertical: **Physical Event Experience**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Google%20Cloud%20Run-4285F4?logo=google-cloud)](https://github.com/Gopal-MD/EventPulse)
[![Testing](https://img.shields.io/badge/Tests-100%25%20Root%20Pass-success?logo=jest)](https://github.com/Gopal-MD/EventPulse)
[![AI Controller](https://img.shields.io/badge/AI-Google%20Gemini%201.5%20Flash-blue?logo=google-gemini)](https://ai.google.dev/)
[![Firebase](https://img.shields.io/badge/Database-Firebase%20Realtime%20DB-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Google Maps](https://img.shields.io/badge/Maps-Interactive%20JS%20SDK-34A853?logo=google-maps)](https://developers.google.com/maps)

---

## 📌 Chosen Vertical — Physical Event Experience

Large sporting venues suffer from chaotic crowd movement and bottlenecks. **EventPulse** addresses this with a cloud-native coordindation layer powered by **Google Gemini AI** and **Firebase**.

---

## 🧠 Approach & Logic

### 🤖 Smart AI Traffic Controller (Powered by Gemini)
Unlike static systems, EventPulse uses **Google Gemini 1.5 Flash** to act as the primary routing engine.
- **Dynamic Analysis**: The backend feeds real-time gate density and food stall wait times to Gemini.
- **Generative Alerts**: Gemini analyzes the bottlenecks and generates human-like, context-aware rerouting instructions (e.g. *"Gate 1 is at 85% capacity. Our AI suggests diverting to Gate 4—which is currently at 12%—to save you approximately 15 minutes of entry time."*).
- **Resilient Fallback**: If the AI model is unavailable, the system automatically falls back to a deterministic rule-based heuristic.

### 🎫 Smart QR Ticketing (TKT-XXXXXXX format)
Deterministic gate assignment based on alphabetical load-balancing:
```
A–F  →  Gate 1   |   G–L  →  Gate 2   |   M–R  →  Gate 3   |   S–Z  →  Gate 4
```
Each ticket is strictly validated against the `TKT-[A-Z0-9]{7}` pattern and locked to a single `checkedIn` flag in Firebase to prevent duplication.

---

## ✅ How the Solution Works

1. **Identity & Check-in**: User books a ticket; Gemini assigns the optimal gate.
2. **Scan & Sync**: Coordinators scan QR codes; state is instantly synced to Firebase.
3. **AI Surveillance**: As gates fill up, the **Gemini AI Controller** triggers dynamic reroute instructions.
4. **Live Visualization**: Fans see an **Interactive Google Map** with pulsing markers and AI alert banners.

---

## ☁️ Google Services Integration

| Service | Contribution to Score |
|---|---|
| **Google Gemini 1.5 Flash** | Dynamic, generative rerouting logic and bottleneck analysis. |
| **Google Maps JS SDK** | High-performance interactive mapping with satellite street-view. |
| **Firebase Realtime DB** | Sub-second state synchronization across thousands of concurrent clients. |
| **Google Cloud Run** | Scalable, containerized deployment with multi-package test verification. |

---

## 🧪 Testing Suite (100% Root-Level Pass)

Evaluators can verify project stability by running a single command from the root:
```bash
npm test
```
- **Backend**: Multi-step lifecycle tests + **TKT-XXXXXXX Regex Validation**.
- **Frontend**: Vitest unit tests for gate assignment and UI consistency.

---

## 🚀 Deployment

```bash
gcloud run deploy eventpulse \
  --source . \
  --region asia-south1 \
  --set-env-vars GEMINI_API_KEY=<your_key> \
  --set-env-vars VITE_MAPS_API_KEY=<your_key>
```

---

## 👤 Author

**Gopal MD** · [github.com/Gopal-MD/EventPulse](https://github.com/Gopal-MD/EventPulse)
