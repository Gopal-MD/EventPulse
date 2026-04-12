# SmartVenue — AI-Powered Stadium Companion

## 🚀 Overview
SmartVenue is a full-stack Progressive Web App (PWA) designed to revolutionize the attendee experience at large-scale venues. This solution addresses the critical bottlenecks of physical event management: **crowd congestion**, **excessive waiting times**, and **disjointed navigation**.

---

## 🎯 Vertical: Physical Event Experience
**Context**: Maharashtra Cricket Stadium, Pune (IPL Match Day)

---

## 🏗️ Architecture Diagram

```mermaid
graph TD
    User((Attendee)) -->|PWA App| Shell[App Shell / Service Worker]
    
    subgraph UI_Layer [Frontend - HTML/CSS/JS]
        Shell --> Tabs[Home | Map | Queue | Chat | Alerts]
        Tabs --> Wayfinding[Smart Wayfinding]
        Tabs --> Queues[Live Queue Intelligence]
        Tabs --> Chat[AI Concierge]
    end

    subgraph Logic_Layer [Service Modules]
        Wayfinding --> MapsAPI[Google Maps JS API]
        Queues --> SheetsAPI[Google Sheets API]
        Chat --> GeminiAPI[Gemini 1.5 Flash]
        Alerts --> Firebase[Firebase Realtime DB]
        Orders --> PayAPI[Google Pay API]
    end

    subgraph Data_Layer [Backend & External]
        SheetsAPI --- DB[(Google Sheets)]
        Firebase --- Realtime[(Firebase DB)]
        GeminiAPI --- LLM[LLM Context]
    end
```

---

## 🔌 Google Services Integration

| Service | Specific Usage |
|:--- |:--- |
| **Google Maps JS API** | Renders the stadium floorplan, tracks user geolocation, and overlays "Take Me To My Seat" polylines. |
| **Gemini 1.5 Flash** | Powers the AI Concierge for navigation advice, generates natural language queue suggestions, and performs post-event sentiment analysis. |
| **Google Sheets API** | Acts as the real-time "Database" for stall occupancy, queue wait times, and gate traffic. |
| **Firebase Realtime DB** | Enables instant, low-latency push notifications from stadium staff to all attendees. |
| **Google Pay API** | Facilitates secure, one-tap food pre-ordering to minimize physical queues at stalls. |
| **Google Fonts** | Implements 'Inter' for high readability in high-motion environments. |
| **Google Forms** | Bridges physical feedback collection with digital sentiment analysis. |

---

## 🛠️ How to Run Locally & Deploy

1. **Local Setup**:
   - Clone the repository.
   - Open `index.html` in a local server (e.g., Live Server or `python -m http.server`).
   - Add your API keys in `config.js`.

2. **Deployment**:
   - Deploy as a static site to **GitHub Pages** or **Firebase Hosting**.
   - Ensure `sw.js` is at the root to enable PWA features.

---

## 💡 Assumptions
- **Queue Data**: Simulated as being crowd-sourced or entered by staff into the linked Google Sheet.
- **Wayfinding**: Uses lat/lng coordinates mapped to stadium zones; "Take Me To My Seat" calculates the path based on pre-defined stadium paths.
- **Mocking**: Includes a robust "Demo Mode" fallback for all API integrations to ensure a functional presentation even without active API keys.

---

## ⚡ BONUS — QR Check-in Simulation
The app includes a fully functional digital ticket check-in simulation to showcase end-to-end event logistics.
- **Dynamic QR**: Generates a real scannable QR code of the user's booking data using the QRServer API.
- **Simulation**: Fans can "simulate" a scan at the turnstile. Once verified, the dashboard updates their status to "CHECKED-IN" and saves this state locally.
- **Impact**: Demonstrates transition from "Attendee" to "Participant" persona, enabling downstream features like in-seat ordering.

---
*Built with ❤️ for the Google Antigravity Code Challenge.*
