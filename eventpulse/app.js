/**
 * app.js
 * Main Controller for EventPulse Platform
 * Coordinates Auth, Multi-Event Discovery, and Social Features
 */

const AppState = {
  activeTab: 'home',
  loadedTabs: new Set(['home']),
  selectedCategory: 'All',
  searchQuery: '',
  events: [],
  joinedEvents: [],
  pollingIntervals: {}
};

/* ----------------------------------------------------------
   Initialization
   ---------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', async () => {
  Logger.info('App', 'Initializing EventPulse Platform');
  
  // 1. Initialize Session
  UserSession.init();
  updateAuthVisibility();

  // 2. Setup Event Delegation
  initAuthEventListeners();
  initTabNavigation();
  initSearchListeners();
  initOrganizerListeners();

  // 3. Initial Load if logged in
  if (UserSession.isLoggedIn()) {
    await bootstrapApp();
  }
});

/**
 * Bootstraps the app data and default view
 */
const bootstrapApp = async () => {
  showToast(`Welcome, ${UserSession.user.name.split(' ')[0]}!`, 'success');
  
  // Load events into memory
  await EventManager.loadAllEvents();
  
  // Fill UI elements
  updateProfileUI();
  updateNavigationUI();
  
  // Load initial tab
  switchTab('home');
};

/**
 * Shows/Hides Auth vs App containers
 */
const updateAuthVisibility = () => {
  const authContainer = getEl('auth-container');
  const appContainer = getEl('app-container');
  
  if (UserSession.isLoggedIn()) {
    authContainer.hidden = true;
    appContainer.hidden = false;
  } else {
    authContainer.hidden = false;
    appContainer.hidden = true;
  }
};

/**
 * Updates navigation items based on role
 */
const updateNavigationUI = () => {
  const createNav = getEl('nav-create');
  if (UserSession.isOrganizer()) {
    createNav.hidden = false;
  } else {
    createNav.hidden = true;
  }
};

/* ----------------------------------------------------------
   Authentication Handlers
   ---------------------------------------------------------- */

const initAuthEventListeners = () => {
  // Toggle Login/Signup
  getEl('show-signup').addEventListener('click', (e) => {
    e.preventDefault();
    getEl('login-form').hidden = true;
    getEl('signup-form').hidden = false;
  });

  getEl('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    getEl('login-form').hidden = false;
    getEl('signup-form').hidden = true;
  });

  // Handle Signup
  getEl('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userData = {
      name: getEl('signup-name').value,
      email: getEl('signup-email').value,
      password: getEl('signup-password').value,
      role: getEl('signup-role').value
    };

    const user = await AuthManager.signup(userData);
    UserSession.login(user);
    updateAuthVisibility();
    bootstrapApp();
  });

  // Handle Login
  getEl('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = getEl('login-email').value;
    const password = getEl('login-password').value;

    const user = await AuthManager.login(email, password);
    if (user) {
      UserSession.login(user);
      updateAuthVisibility();
      bootstrapApp();
    } else {
      showToast('Invalid email or password', 'error');
    }
  });

  // Handle Logout
  getEl('btn-logout').addEventListener('click', () => {
    UserSession.logout();
    location.reload(); // Hard reset for clean state
  });
};

/* ----------------------------------------------------------
   Tab Navigation & Switching
   ---------------------------------------------------------- */

const initTabNavigation = () => {
  const navItems = queryAll('.bottom-nav__item');
  navItems.forEach(nav => {
    nav.addEventListener('click', () => {
      const tabId = nav.getAttribute('aria-controls').replace('tab-', '');
      switchTab(tabId);
    });
  });
};

const switchTab = (tabName) => {
  // 1. UI Updates
  queryAll('.tab-panel').forEach(p => p.hidden = true);
  queryAll('.bottom-nav__item').forEach(b => b.classList.remove('bottom-nav__item--active'));

  const panel = getEl(`tab-${tabName}`);
  const nav = getEl(`nav-${tabName}`);
  
  if (panel && nav) {
    panel.hidden = false;
    nav.classList.add('bottom-nav__item--active');
  }

  AppState.activeTab = tabName;
  lazyLoadTabContent(tabName);
};

const lazyLoadTabContent = (tabName) => {
  Logger.info('App', `Switching to tab: ${tabName}`);
  
  switch(tabName) {
    case 'home': renderHome(); break;
    case 'discover': renderDiscover(); break;
    case 'myevents': renderMyEvents(); break;
    case 'create': /* Form is static */ break;
    case 'network': renderNetwork(); break;
    case 'profile': updateProfileUI(); break;
  }
};

/* ----------------------------------------------------------
   Render Functions
   ---------------------------------------------------------- */

const renderHome = () => {
  getEl('welcome-user').textContent = `Welcome back, ${UserSession.user.name.split(' ')[0]}!`;
  // In real app, load global announcements here
};

const renderDiscover = () => {
  const container = getEl('events-list');
  const events = EventManager.searchEvents(AppState.searchQuery, AppState.selectedCategory);
  
  if (events.length === 0) {
    container.innerHTML = '<p class="empty-state">No events found.</p>';
    return;
  }

  container.innerHTML = events.map(ev => createEventCard(ev)).join('');
  attachEventCardListeners();
};

const renderMyEvents = () => {
  const container = getEl('my-joined-events');
  const events = EventManager.getUserEvents(UserSession.user.id);
  
  if (events.length === 0) {
    container.innerHTML = '<p class="empty-state">You haven\'t joined any events yet.</p>';
    return;
  }

  container.innerHTML = events.map(ev => createEventCard(ev, true)).join('');
};

const createEventCard = (ev, isJoined = false) => {
  const btnText = isJoined ? 'View Details' : 'Join Event';
  const btnClass = isJoined ? 'btn--outline' : 'btn--primary';

  return `
    <div class="event-card" data-id="${ev.id}">
      <div class="event-card__category">${ev.category}</div>
      <h3 class="event-card__title">${ev.name}</h3>
      <p class="event-card__desc">${truncateText(ev.description, 80)}</p>
      <div class="event-card__meta">
        <span><span class="material-symbols-outlined">calendar_today</span> ${ev.date}</span>
        <span><span class="material-symbols-outlined">location_on</span> ${ev.venue}</span>
      </div>
      <div class="event-card__actions">
        <button class="btn ${btnClass} btn--full btn-join" data-id="${ev.id}">${btnText}</button>
      </div>
    </div>
  `;
};

const updateProfileUI = () => {
  getEl('profile-name-display').textContent = UserSession.user.name;
  getEl('profile-role-display').textContent = UserSession.user.role.toUpperCase();
  getEl('user-initials').textContent = UserSession.getInitials();
  
  // Real stats would be fetched
  getEl('count-events').textContent = EventManager.getUserEvents(UserSession.user.id).length;
};

/* ----------------------------------------------------------
   Interaction Listeners
   ---------------------------------------------------------- */

const initSearchListeners = () => {
  const searchInput = getEl('event-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      AppState.searchQuery = e.target.value;
      renderDiscover();
    }, 300));
  }
};

const attachEventCardListeners = () => {
  const buttons = queryAll('.btn-join');
  buttons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (e.target.textContent === 'Join Event') {
        _setButtonLoading(e.target, true);
        await EventManager.joinEvent(UserSession.user.id, id);
        showToast('Successfully joined event!', 'success');
        renderDiscover();
      } else {
        // Navigate to details (TBD)
        showToast('Navigation to Event Details coming soon', 'info');
      }
    });
  });
};

const initOrganizerListeners = () => {
  const form = getEl('create-event-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const eventData = {
        name: getEl('ev-name').value,
        date: getEl('ev-date').value,
        time: getEl('ev-time').value,
        venue: getEl('ev-venue').value,
        description: getEl('ev-desc').value
      };

      await EventManager.createEvent(eventData);
      showToast('Event published successfully!', 'success');
      form.reset();
      switchTab('discover');
    });
  }
};

const renderNetwork = async () => {
  const container = getEl('ai-matches-container');
  container.innerHTML = '<div class="spinner"></div><p>Searching for matches...</p>';

  // Mocking AI response for Meetup context
  setTimeout(() => {
    container.innerHTML = `
      <div class="match-card">
        <div class="match-card__header">
          <div class="match-card__avatar">AN</div>
          <div>
            <div class="match-card__name">Amit Negi</div>
            <div class="match-card__role">Fullstack Dev @ Amazon</div>
          </div>
        </div>
        <p class="match-card__reason">Amit is also attending "TechSphere 2025" and has shared interests in AI Architecture.</p>
        <button class="btn btn--outline btn--full">Connect</button>
      </div>
    `;
  }, 1000);
};
