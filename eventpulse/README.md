# EventPulse Platform — Smart Meetup Experience

EventPulse is an AI-powered multi-event platform designed for organizers to host events and attendees to discover, join, and interact in real-time. It transforms the traditional event experience using Google Services and Gemini AI.

---

## 🌟 CORE FEATURES

### 🔐 Authentication & Roles
- **Dual Personas:** Signup as an **Attendee** (to discover events) or an **Organizer** (to host and manage them).
- **Persistent Sessions:** Uses `localStorage` for a seamless, login-once experience.
- **Secure MVP:** Input sanitization and basic hashing for a robust prototype.

### 🏢 Organizer Dashboard
- **Marketplace Publishing:** Create events with descriptions, categories, and custom session agendas.
- **Management:** View attendee participation and post real-time urgent announcements.

### 👥 Attendee Experience
- **Discovery Engine:** Search events by keyword or filter by category (Tech, Business, Social, etc.).
- **My Events:** One-tap joining and automatic schedule synchronization.
- **Profile Hub:** Personal networking profile with AI-matched connection suggestions.

### 🤝 Social & Networking
- **RSVP System:** Multi-status participation (Going / Interested).
- **Group Chat:** Event-specific discussion boards for community interaction.
- **AI Icebreakers:** Automatically generated conversation starters to help people connect.

### 🧠 Gemini AI Intelligence
- **Smart Recommendations:** Suggests events based on user interests and past attendance.
- **Session Personalization:** Recommends the best sessions within a single event.
- **Event Summarizer:** Generates punchy, one-sentence summaries for event descriptions.

---

## 🏗️ PROJECT ARCHITECTURE

```text
/eventpulse
  index.html          ← Semantic HTML5, ARIA labels, 6-tab navigation
  style.css           ← Blue/Amber theme, BEM naming, glassmorphism
  app.js              ← Main platform controller & tab state
  auth.js             ← Login/Signup logic
  user.js             ← Session & Role-based access management
  events.js           ← Event CRUD & participation logic
  chat.js             ← Discussion board logic
  gemini.js           ← All AI/LLM logic (Gemini 1.5 Flash)
  sheets.js           ← Google Sheets API persistence layer
  config.js           ← Centralized secrets & tab definition
  utils.js            ← Helpers (XSS sanitization, formatters)
  tests.js            ← Unit tests for platform logic
```

---

## 🚀 GETTING STARTED

1. **Configure API Keys:**
   Open `config.js` and add your **Gemini API Key** and **Google Sheets API Key**.

2. **Setup Sheet Structure:**
   Create 5 tabs in your Google Sheet: `users`, `events`, `participation`, `announcements`, and `messages`.

3. **Deploy:**
   Host the `/eventpulse` folder on any static web server (GitHub Pages, Netlify, Vercel).

4. **Run Locally:**
   Simply open `index.html` in any modern web browser or use a local dev server.

---

## 🚦 TESTING

Open the developer console and execute `runAllTests()` to verify:
- [x] Login/Signup validation
- [x] Event creation logic
- [x] Joining/Leaving synchronization
- [x] Gemini response parsing

---

**Developed for TechSphere 2025 by Gopal MD.**
Web App (PWA) with offline support
