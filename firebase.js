/**
 * SmartVenue — Firebase Realtime Module
 * Listens for live stadium alerts (Feature 5)
 */

const FirebaseAlerts = (() => {
  const _hasConfig = () => 
    CONFIG.KEYS.FIREBASE.apiKey !== "YOUR_FIREBASE_KEY";

  /**
   * Initialize listener for live alerts node
   */
  const init = () => {
    Logger.info('Firebase', 'Initializing Realtime DB listener...');

    if (!_hasConfig()) {
      Logger.info('Firebase', 'Demo Mode: Simulating staff-pushed alerts');
      _simulateLiveAlerts();
      return;
    }

    // Real Firebase listener would go here
    // firebase.database().ref('alerts/').on('child_added', (snapshot) => { ... })
  };

  /**
   * Pushes a new alert to the UI
   */
  const pushAlert = (text, type = 'info') => {
    const container = getEl('alerts-container');
    if (!container) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const alertEl = createElement('div', {
      className: `announcement fadeIn`,
      html: `
        <div style="display:flex; justify-content:space-between; align-items:start;">
          <p>${text}</p>
          <span class="chip chip--${type === 'urgent' ? 'danger' : 'success'}">${type}</span>
        </div>
        <small class="text-muted">${time}</small>
      `
    });

    container.prepend(alertEl);
    showToast(text, type === 'urgent' ? 'error' : 'info');
  };

  /**
   * Logic to simulate incoming alerts for demo presentation
   */
  const _simulateLiveAlerts = () => {
    // Alert 1 (Immediate)
    setTimeout(() => {
      pushAlert("🏏 Welcome to Maharashtra Cricket Stadium! Hope you're ready for an epic match.", 'staff');
    }, 5000);

    // Alert 2 (Delayed)
    setTimeout(() => {
      pushAlert("⚠️ TRAFFIC ALERT: Gate 2 is highly congested. Use Gate 4 (West) for 5-minute entry.", 'urgent');
    }, 20000);

    // Alert 3 (Event-based)
    setTimeout(() => {
      pushAlert("🍔 FLASH DEAL: 50% off Samosas at Stall 2 for the next 15 minutes! Use Pre-order to skip the line.", 'promo');
    }, 45000);
  };

  return { init, pushAlert };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', FirebaseAlerts.init);
