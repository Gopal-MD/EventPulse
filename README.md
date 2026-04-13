# EventPulse - AI Smart Stadium System

PromptWars Hackathon Submission (Google Cloud Program Aligned)

## Problem Statement Alignment

Large stadiums often face gate bottlenecks, duplicate ticket scans, and weak rerouting visibility.
EventPulse addresses this with:
- Smart QR ticket generation and scan validation
- Live crowd-density status per gate
- AI-assisted reroute alerts using Gemini
- Interactive gate visualization with Google Maps

## Core Features

- Smart QR Ticketing with deterministic gate assignment (A-F, G-L, M-R, S-Z)
- Duplicate scan prevention
- Live control dashboard with food queue recommendations
- Interactive map with gate markers
- Gemini structured-output alert generation with fallback mode

## Architecture Diagram (Text)

```text
               +------------------------------+
               |        Google Cloud Run      |
               |  Node.js Express Backend     |
               +---------------+--------------+
                               |
                     +---------+---------+
                     | Firebase Realtime |
                     |  tickets/gates    |
                     |  queues/alerts    |
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
Used for real-time persistence and state synchronization:
- users
- tickets
- gates
- foodQueues
- alerts

### Google Cloud Functions (Integration Points)
Cloud-function-style handlers are mapped in:
- `backend/cloud-functions/mockFunctions.js`

Responsibilities:
- QR validation logic (`validateQrScanCloudFn`)
- Alert payload triggering (`buildAlertCloudFn`)

### Google Maps
Map is rendered with `@googlemaps/js-api-loader`:
- Interactive stadium map UI
- Gate marker overlays
- Fallback status banner when map is unavailable or key is missing

### Gemini
Gemini model (`gemini-1.5-flash`) is used for alert generation:
- Structured JSON output with schema validation
- Deterministic fallback alerts if Gemini key is missing or request fails

See integration map:
- `config/google-services.integration.json`

## Testing

### Lightweight evaluator-friendly tests
A no-framework mock test suite is included in root `tests` folder.

Files:
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

### Existing automated tests
- Backend Vitest + Supertest
- Frontend Vitest

Run full automated checks:

```bash
npm test
```

## Security Considerations

- Rate limiting for all `/api` routes
- Input validation on ticket generation and scan endpoints
- Duplicate scan prevention through `checkedIn` state lock
- QR token hashing for generated ticket records using HMAC-SHA256
- Centralized error response helper for consistent API failures

## AI Decision Logic

Detailed logic is documented in:
- `docs/ai-logic.md`

Summary:

```text
IF crowd_level > threshold:
  trigger alert
  suggest alternate gate
```

The system first applies deterministic thresholds, then optionally enriches alerts via Gemini.

## Efficiency Optimizations

- 1-second backend state cache for repeated dashboard polls
- Frontend polling skips hidden tabs to reduce unnecessary API calls
- Polling guards prevent overlapping fetch calls
- Lightweight static mock datasets for evaluation runs

## Accessibility Notes

- Labeled form inputs and controls in ticket and scanner flows
- ARIA roles and live regions for alerts and scanner results
- Keyboard-friendly controls for primary workflows
- Readable text contrast in map/dashboard alerts

## Sample Outputs

Mock test log:

```text
[PASS] QR generated successfully
[PASS] Duplicate entry blocked
[PASS] Alert triggered when crowd > threshold
[PASS] Gate assignment logic validated
```

Example API behaviors:

```text
POST /api/ticket/generate  -> success: true, ticketId: TKT-XXXXXXX
POST /api/ticket/scan      -> blocks duplicate entries
GET  /api/state            -> gates, alerts, foodQueues, tickets
```

## Environment Variables (Google Cloud Run)

```bash
GEMINI_API_KEY=<key>
FIREBASE_PROJECT_ID=<id>
FIREBASE_CLIENT_EMAIL=<email>
FIREBASE_PRIVATE_KEY=<private_key_with_escaped_newlines>
FIREBASE_DATABASE_URL=<firebase_db_url>
VITE_MAPS_API_KEY=<maps_key>
QR_TOKEN_SECRET=<optional_strong_secret>
```

## Deployment

```bash
gcloud run deploy eventpulse \
  --source . \
  --region asia-south1 \
  --set-env-vars GEMINI_API_KEY=<key>,FIREBASE_PROJECT_ID=<id>,FIREBASE_CLIENT_EMAIL=<email>,FIREBASE_PRIVATE_KEY=<private_key>,FIREBASE_DATABASE_URL=<url>,VITE_MAPS_API_KEY=<key>,QR_TOKEN_SECRET=<secret>
```

## Project Structure

```text
backend/
frontend/
tests/
docs/
config/
```

## Author

Gopal MD
