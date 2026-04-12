/**
 * SmartVenue — Main Application Controller
 * Handles Tab Navigation, Maps Integration, and Geolocation
 */

const App = (() => {
  let _map;
  let _userMarker;
  let _routeLine;
  const _activeTab = 'home';

  const init = async () => {
    Logger.info('App', 'SmartVenue Initializing...');
    
    initTabNavigation();
    initChatHandler();
    initFeedbackHandler();
    initCheckinLogic();
    renderMenu();
    
    // Initial data load
    refreshQueues();
    loadAlerts();

    // Map initialization (Deferred to Tab Switch to save resources)
  };

  /* ----------------------------------------------------------
     1. Navigation Logic
     ---------------------------------------------------------- */
  const initTabNavigation = () => {
    const navItems = queryAll('.nav-item');
    navItems.forEach(nav => {
      nav.addEventListener('click', () => {
        const tabId = nav.dataset.tab;
        switchTab(tabId);
      });
    });
  };

  const switchTab = (tabId) => {
    Logger.debug('Navigation', `Switching to ${tabId}`);
    
    // UI update
    queryAll('.tab-panel').forEach(p => p.hidden = true);
    queryAll('.nav-item').forEach(n => n.classList.remove('nav-item--active'));

    getEl(`tab-${tabId}`).hidden = false;
    document.querySelector(`.nav-item[data-tab="${tabId}"]`).classList.add('nav-item--active');

    // Contextual actions
    if (tabId === 'map') initMap();
    if (tabId === 'queue') refreshQueues();
    if (tabId === 'chat') scrollToBottom('chat-feed');
  };

  /* ----------------------------------------------------------
     2. Google Maps & Wayfinding (Feature 1)
     ---------------------------------------------------------- */
  const initMap = () => {
    if (_map) return; // Only init once

    const container = getEl('map-canvas');
    if (!container) return;

    Logger.info('Maps', 'Initializing Google Maps API...');
    
    // Mocking Map if API key is not active
    if (CONFIG.KEYS.MAPS === 'YOUR_MAPS_API_KEY') {
      container.innerHTML = `
        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; flex-direction:column; background:#1B263B;">
          <span class="material-symbols-outlined" style="font-size:4rem; color:var(--navy-accent);">map</span>
          <p style="text-align:center; padding:var(--sp-lg); color:var(--gray-muted);">
            Google Maps API Key required for live rendering.<br>
            Using interactive SVG Stadium Overlay for demo.
          </p>
          <div style="border:2px dashed var(--electric-blue); width:80%; height:50%; border-radius:12px; position:relative;">
             <div class="map-zone zone--high" style="position:absolute; top:20%; left:50%;">H</div>
             <div class="map-zone zone--low" style="position:absolute; top:80%; left:20%;">L</div>
          </div>
        </div>Base Stadium
      `;
      return;
    }

    // Real API Init (requires script tag from index.html)
    try {
      _map = new google.maps.Map(container, {
        center: CONFIG.VENUE.COORDINATES,
        zoom: 18,
        styles: MapStyles, // Dark theme styles
        mapTypeId: 'satellite'
      });
    } catch (e) {
      Logger.error('Maps', 'API Initialization failed', e);
    }
  };

  const findUserLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        Logger.info('Geo', 'User at:', coords);
        // Map updates inhibited in demo mode
      },
      (err) => Logger.error('Geo', err)
    );
  };

  /* ----------------------------------------------------------
     3. Queue & Home UI Renderers
     ---------------------------------------------------------- */
  const refreshQueues = async () => {
    const queues = await getLiveQueues();
    const container = getEl('queue-container');
    if (!container) return;

    container.innerHTML = queues.map(q => `
      <div class="queue-card">
        <div class="queue-info">
          <h4>${q.name}</h4>
          <p>${q.id.includes('gate') ? 'Entrance' : 'Food Stall'}</p>
        </div>
        <div class="queue-stat">
          <div class="wait-minutes ${q.wait > 10 ? 'danger' : ''}">${q.wait}m</div>
          <div class="wait-label">Wait Time</div>
        </div>
      </div>
    `).join('');

    // Update AI Hint on Dashboard
    const tip = await GeminiAI.getSmartQueueTip(queues);
    const hintContainer = getEl('ai-smart-tip');
    if (hintContainer) hintContainer.textContent = tip;
  };

  const renderMenu = () => {
    const container = getEl('food-menu');
    if (!container) return;

    container.innerHTML = CONFIG.MENU.map(item => `
      <div class="menu-item" onclick="Pay.openCheckout('${item.id}')">
        <div class="menu-icon">${item.icon}</div>
        <span class="menu-name">${item.name}</span>
        <span class="menu-price">₹${item.price}</span>
      </div>
    `).join('');
  };

  const loadAlerts = () => {
    const container = getEl('alerts-container');
    if (!container) return;

    container.innerHTML = CONFIG.DEMO.ALERTS.map(a => `
      <div class="announcement">
        <p>${a.text}</p>
        <small>${a.time}</small>
      </div>
    `).join('');
  };

  /* ----------------------------------------------------------
     4. AI Assistant & Chat (Feature 3)
     ---------------------------------------------------------- */
  const initChatHandler = () => {
    const form = getEl('chat-form');
    const input = getEl('chat-message');
    const feed = getEl('chat-feed');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) return;

      // Add user bubble
      appendChatBubble('user', query);
      input.value = '';

      // Thinking bubble
      const thinkingId = `ai_${Date.now()}`;
      appendChatBubble('ai', 'Thinking...', thinkingId);

      try {
        const response = await GeminiAI.askConcierge(query);
        const bubble = getEl(thinkingId);
        if (bubble) bubble.textContent = response;
      } catch (error) {
        const bubble = getEl(thinkingId);
        if (bubble) bubble.textContent = "Sorry, I'm having trouble connecting to my stadium database. Please try again!";
      }
    });
  };

  const appendChatBubble = (role, text, id = null) => {
    const feed = getEl('chat-feed');
    const bubble = createElement('div', {
      className: `bubble bubble--${role}`,
      html: text,
      attrs: id ? { id } : {}
    });
    feed.appendChild(bubble);
    feed.scrollTop = feed.scrollHeight;
  };

  const initFeedbackHandler = () => {
    const form = getEl('feedback-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = getEl('fb-text').value.trim();
      if (!text) return;

      const output = getEl('sentiment-output');
      output.textContent = "...Analysing sentiment with AI...";
      output.hidden = false;

      const sentiment = await GeminiAI.analyzeFeedback(text);
      output.innerHTML = `<strong>Organizer Insight:</strong> ${sentiment}`;
    });
  };

  const initCheckinLogic = () => {
    const btnView = getEl('btn-view-ticket');
    const btnScan = getEl('btn-simulate-scan');
    const statusBadge = getEl('checkin-status');
    
    if (!btnView) return;

    // Load persisted state
    const isCheckedIn = localStorage.getItem('smartvenue_checkedin') === 'true';
    if (isCheckedIn) {
      statusBadge.textContent = 'CHECKED-IN';
      statusBadge.className = 'chip chip--success';
      getEl('checkin-action-area').hidden = true;
      getEl('checkin-success-area').hidden = false;
    }

    btnView.onclick = () => {
      const modal = getEl('ticket-modal');
      const qrImg = getEl('qr-img');
      
      // Generate real QR (Feature Bonus)
      const ticketData = `ID:PV-992|Fan:CSK-Gopal|Seat:C-102|Venue:Pune`;
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ticketData)}&size=180x180&color=0D1B2A`;
      
      modal.hidden = false;
    };

    btnScan.onclick = async () => {
      btnScan.disabled = true;
      btnScan.textContent = 'Scanning...';
      
      await new Promise(r => setTimeout(r, 1500));
      
      localStorage.setItem('smartvenue_checkedin', 'true');
      getEl('checkin-action-area').hidden = true;
      getEl('checkin-success-area').hidden = false;
      
      statusBadge.textContent = 'CHECKED-IN';
      statusBadge.className = 'chip chip--success';
      
      showToast("Verification Successful! Welcome to the stadium.", "success");
    };
  };

  return { init, switchTab, findUserLocation };
})();

// Helper definitions needed by App
const MapStyles = [
  { "elementType": "geometry", "stylers": [{ "color": "#1B263B" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#778DA9" }] }
];

document.addEventListener('DOMContentLoaded', App.init);
getEl('btn-recenter').onclick = App.findUserLocation;
getEl('btn-find-seat').onclick = () => App.switchTab('map');
