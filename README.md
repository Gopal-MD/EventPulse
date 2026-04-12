# EventPulse - Smart Stadium System

## Problem Statement
Large sporting venues suffer from poor physical event experiences characterized by chaotic crowd movement, extensive waiting times at entry gates and food queues, and a lack of real-time crowd coordination. 

## Solution Approach
EventPulse is a lightweight, AI-simulated Smart Stadium system under 1MB source footprint. It mitigates crowd chaos through:
1. **Alphabetical Gate Splitting**: Distributes initial load evenly across gates through dynamic QR ticketing.
2. **Real-time Navigation & Rerouting**: Live dashboard intelligently reroutes incoming spectators from highly congested gates to sparser alternate gates using visually distinct rule-based alerts.
3. **Queue Optimizations**: Highlights the lowest-wait-time food stalls.
4. **Mock AR Directions**: Simplified pulse alerts indicating smart redirection parameters visually.

## Features Implemented
- **Smart QR Ticket System**: Generates custom QR passes validating seat, name, and intelligent gate routing.
- **Entry Validation System**: Prevents duplicate checks and manages valid coordination.
- **Live Crowd Monitoring (Simulated AI)**: Uses an Express backend to push dynamic traffic simulation states dynamically to the frontend arrays.
- **Live Navigation Dashboard**: Intuitive coordinate-based UI mapping out the arena's dynamic health with minimal asset reliance.

## Architecture
```
                  ┌────────────────────┐
                  │ Google Cloud Run   │
                  │   Node API & Host  │
                  └─────────┬──────────┘
                            │
              ┌─────────────┴────────────┐
              │                          │
       ┌──────▼──────┐             ┌─────▼─────┐
       │ Express API │◄───────────►│ React UI  │
       │(Data/State) │             │ (Vite)    │
       └─────────────┘             └───────────┘
```

## How to Run locally

### Via Docker (Cloud Run Match)
1. `docker build -t eventpulse .`
2. `docker run -p 8080:8080 eventpulse`
3. Access at `http://localhost:8080`

### Via Node (Development)
1. Terminal 1:
   ```bash
   cd backend
   npm install
   node server.js
   ```
2. Terminal 2:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Assumptions
- Uses a local mocked Node memory fallback as the Firebase DB configuration logic layer (Firebase & Maps APIs are seamlessly replaceable once keys are provided).
- Frontend design prioritizes vanilla CSS logic (no Tailwind) to aggressively reduce compilation sizes and keep source codes explicitly under the 1MB limit.
