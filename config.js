/**
 * SmartVenue — Configuration
 * Event: IPL Match Day
 * Venue: Maharashtra Cricket Stadium, Pune
 */

const CONFIG = {
  VENUE: {
    NAME: "Maharashtra Cricket Stadium, Pune",
    EVENT: "IPL Match Day — CSK vs MI",
    COORDINATES: { lat: 18.6749, lng: 73.7121 }, // Actual Pune Stadium coords
    GATES: [
      { id: 'gate-1', name: 'Gate 1 (VVIP)', density: 'Low', wait: 2 },
      { id: 'gate-2', name: 'Gate 2 (East)', density: 'High', wait: 15 },
      { id: 'gate-4', name: 'Gate 4 (West)', density: 'Low', wait: 3 }
    ]
  },

  /** Hardcoded Menu Items */
  MENU: [
    { id: 'food-1', name: 'Vada Pav', price: 80, icon: '🍔' },
    { id: 'food-2', name: 'Samosa', price: 40, icon: '🥟' },
    { id: 'food-3', name: 'Cold Drink', price: 60, icon: '🥤' },
    { id: 'food-4', name: 'Popcorn', price: 100, icon: '🍿' },
    { id: 'food-5', name: 'Thali', price: 150, icon: '🍱' }
  ],

  /** API Configuration */
  KEYS: {
    GEMINI: "AIzaSyAtAZB3US-MPp9hW9-KhewaymXxPBDx0GI",
    SHEETS: "AIzaSyBRPMi8Vll22_ISCo8iD2HrMftkcp_MwFQ",
    MAPS: "YOUR_MAPS_API_KEY", // Placeholder
    FIREBASE: {
      apiKey: "YOUR_FIREBASE_KEY",
      databaseURL: "YOUR_DB_URL"
    }
  },

  /** Google Sheets Config */
  SHEETS_DB: {
    SPREADSHEET_ID: "13RJctPsySZbBzrbqY_-PK5frOIosboni5a9skQt4nb4",
    TABS: {
      QUEUES: "stadium_queues",
      ALERTS: "stadium_alerts",
      ORDERS: "stadium_orders"
    }
  },

  /** Hardcoded Demo Data */
  DEMO: {
    STALLS: [
      { id: 'stall-1', name: 'Pune Flavors (Vada Pav)', zone: 'North', wait: 2, icon: '🔥' },
      { id: 'stall-2', name: 'Bombay Bites', zone: 'East', wait: 7, icon: '🍱' },
      { id: 'stall-3', name: 'Cool Corner', zone: 'West', wait: 12, icon: '🍦' },
      { id: 'stall-4', name: 'Chai Point', zone: 'South', wait: 4, icon: '☕' }
    ],
    ALERTS: [
      { id: 'a1', text: "Section C restrooms temporarily closed", time: "18:30" },
      { id: 'a2', text: "Match resumes in 5 minutes", time: "19:15" },
      { id: 'a3', text: "Free merchandise distribution at Gate 1", time: "20:00" }
    ]
  }
};
