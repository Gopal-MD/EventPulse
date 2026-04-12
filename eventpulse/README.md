# EventPulse — Smart Physical Event Companion

## Vertical
Physical Event Experience

## Problem Statement
Attendees at large physical events lose valuable time navigating venues, missing relevant sessions, and failing to connect with the right people due to lack of real-time, personalized guidance.

## Solution
EventPulse is a browser-based AI companion that provides personalized agendas, live crowd data, AI-powered networking matches, natural language venue navigation, and instant session feedback — all powered by Google Services.

## Google Services Used
| Service | Purpose |
|---|---|
| Gemini 1.5 Flash | Agenda personalization, networking AI, venue Q&A |
| Google Sheets API | Live crowd data, attendee profiles, announcements, feedback |
| Google Fonts (Inter) | Typography system |
| Google Material Symbols | Consistent icon system |

## Features
- Personalized AI agenda based on user role and interests
- Live session crowd meter (color-coded)
- AI networking matchmaker with icebreaker suggestions
- Natural language venue navigator
- Real-time announcements feed
- One-tap session feedback to Sheets

## How to Run
1. Clone this repository
2. Copy config.js and fill in your API keys
3. Enable Gemini API and Google Sheets API in Google Cloud Console
4. Create Google Sheet with tabs: crowd_data, attendees, announcements, feedback
5. Open index.html in any browser

## Assumptions
- Event data is pre-loaded; real deployment would pull from Sheets
- Crowd data is updated by organizers manually in Google Sheets
- Single-day event format assumed for MVP

## Future Improvements
- QR code check-in with Google Wallet
- Google Maps indoor navigation integration
- Firebase Realtime Database for sub-second updates
- Google Calendar integration for agenda sync
- Progressive Web App (PWA) with offline support
