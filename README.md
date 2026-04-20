# EventPulse - AI Smart Stadium System

[![CI](https://github.com/Gopal-MD/EventPulse/actions/workflows/ci.yml/badge.svg)](https://github.com/Gopal-MD/EventPulse/actions/workflows/ci.yml)

PromptWars Hackathon Submission (Google Cloud Program Aligned)

## Submission Links

- Live Cloud Run URL: https://eventpulse-353593433214.asia-south1.run.app/
- GitHub Repository: https://github.com/Gopal-MD/EventPulse
- LinkedIn Project Post: https://www.linkedin.com/posts/gopal-m-4008a8249_buildwithai-promptwarsvirtual-share-7449340610353737728-P5Bb

## Problem Statement

Large stadiums often face gate bottlenecks, duplicate ticket scans, and poor rerouting visibility.
EventPulse solves this using a high-adoption smart-stadium framework:

- **Advanced AI Control**: Uses **Gemini 1.5 Flash with Function Calling** to dynamically analyze traffic and recommend reroutes.
- **Enterprise Storage**: Integrated with **Google Cloud Storage (GCS)** for automated administrative report logging.
- **Interactive Pro Map**: Google Maps with **Heatmap Visualization** and **Directions API** for precise fan rerouting.
- **Auditable Security**: Hardened CSP, HMAC tokens, and **Structured Google Cloud Audit Logging**.
- **Real-time Synchronization**: Firebase Realtime DB for live ticket and gate density tracking.

## Core Features (V2 Elite Adoption)

- **AI-Driven Traffic Controller**: Uses Function Calling to "Recommend Reroute" directly from stadium data.
- **GCS Report Center**: Admins can export daily scan audits to Cloud Storage buckets.
- **Interactive Stadium Map**: Maps with Advanced Marker Elements and pathfinding logic.
- **Modular Microservices**: Modularized `database.js` and `aiService.js` for enterprise-grade maintainability.

## Architecture

```text
               +------------------------------+
               |        Google Cloud Run      |
               |  Node.js Express Backend     |
               +---------------+--------------+
                               |
                     +---------+---------+
                     | Firebase Realtime |
                     | tickets/gates     |
                     | queues/alerts     |
                     +-------------------+
                               |
+------------------------------+-------------------------------+
|                      React + Vite Frontend                   |
| Ticket View | Scanner | Dashboard | Live Navigation Map      |
+------------------------------+-------------------------------+
                               |
                     +---------+---------+
                     | Google Maps JS API|
                     | Gemini 1.5 Flash  |
                     +-------------------+
```

## Google Services Integration

### Firebase
Used for real-time persistence and sync of:
- users
- tickets
- gates
- foodQueues
- alerts

### Gemini
Model used: `gemini-1.5-flash`
- Generates crowd reroute instructions
- Uses structured-output response schema
- Falls back to deterministic logic when API key is missing or request fails

### Google Maps
Map SDK: `@googlemaps/js-api-loader`
- Interactive stadium map and gate markers
- Runtime key loading through backend `/api/config`
- Graceful fallback if key is unavailable

### Cloud-Functions-Style Integration Points
Mapped in: `backend/cloud-functions/mockFunctions.js`
- `validateQrScanCloudFn`
- `buildAlertCloudFn`

Details file: `config/google-services.integration.json`

## Security & Reliability

- API rate-limiting for `/api/*`
- Input validation for ticket generation and scanning
- Duplicate scan prevention
- QR token HMAC hashing
- Consistent error responses
- CI pipeline runs tests and build on push/PR
- Coverage generated for backend and frontend

## Testing (Submission Friendly)

### 1) Lightweight tests folder
Included for evaluator-friendly quick validation:
- `tests/test_cases.md`
- `tests/mock-test-runner.js`
- `tests/test_execution.log`
- `tests/data/users.json`
- `tests/data/tickets.json`
- `tests/data/crowd.json`

Run:

```bash
npm run test:mock
```

### 2) Automated backend integration tests
Covers API contracts including:
- `/api/health`
- `/` root 200 check
- `/api/config` maps key load
- ticket generation lifecycle
- duplicate scan blocking
- simulation and state contracts
- end-to-end smoke flow (`generate -> scan -> state`)

Run:

```bash
npm run test:integration --prefix backend
```

### 3) Frontend automated tests
Run:

```bash
npm test --prefix frontend
```

### 4) Full project checks

```bash
npm test
```

### 5) CI-equivalent reliability gate (tests + build + coverage)

```bash
npm run reliability
```

### 6) Optional extended quality checks (non-blocking)

These are intentionally separated from the default CI gate to keep normal build checks fast.

```bash
# Lightweight API load test for /api/state stability
npm run test:load

# Visual regression snapshot test for /nav map experience
npm run test:visual

# Run both extended checks together
npm run quality:extended
```

GitHub Actions also includes an optional workflow:
- `.github/workflows/extended-quality.yml`

## Local Setup

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Run locally

Terminal 1:

```bash
cd backend
node server.js
```

Terminal 2:

```bash
cd frontend
npm run dev
```

App: http://localhost:5173/
API health: http://localhost:8080/api/health

## Environment Variables (Cloud Run)

```bash
GEMINI_API_KEY=<key>
FIREBASE_PROJECT_ID=<id>
FIREBASE_CLIENT_EMAIL=<email>
FIREBASE_PRIVATE_KEY=<private_key_with_escaped_newlines>
FIREBASE_DATABASE_URL=<firebase_db_url>
MAPS_API_KEY=<google_maps_key_runtime>
QR_TOKEN_SECRET=<optional_strong_secret>
```

Notes:
- For Cloud Run, `MAPS_API_KEY` is preferred (runtime).
- `VITE_MAPS_API_KEY` can still be used for local build-time scenarios.

## Deployment

```bash
gcloud run deploy eventpulse \
  --source . \
  --region asia-south1 \
  --set-env-vars GEMINI_API_KEY=<key>,FIREBASE_PROJECT_ID=<id>,FIREBASE_CLIENT_EMAIL=<email>,FIREBASE_PRIVATE_KEY=<private_key>,FIREBASE_DATABASE_URL=<url>,MAPS_API_KEY=<maps_key>,QR_TOKEN_SECRET=<secret>
```

## Project Structure

```text
backend/
frontend/
tests/
docs/
config/
.github/workflows/
```

## AI Logic

Detailed explanation: `docs/ai-logic.md`

Rule summary:

```text
IF crowd_level > threshold:
  trigger alert
  suggest alternate gate
```

## Author

Gopal MD
