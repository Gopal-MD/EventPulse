/**
 * events.js
 * Handles event CRUD, discovery, and participation (Join/Leave/RSVP)
 */

const EventManager = {
  /** @type {Array<Object>} Currently active events memory cache */
  allEvents: [],

  /**
   * Loads events from Sheets or demo data
   * @returns {Promise<Array<Object>>}
   */
  async loadAllEvents() {
    Logger.info('EventManager', 'Loading all events');
    
    // 1. Fetch from config for demo/mock
    this.allEvents = [...CONFIG.DEMO.EVENTS];
    
    // 2. TBD: Fetch from Google Sheets if configured
    // const sheetRows = await SheetsClient.readRange(CONFIG.SHEETS.EVENTS_TAB);
    // this.allEvents = this._parseSheetRows(sheetRows);

    return this.allEvents;
  },

  /**
   * Filters events by keyword or category
   * @param {string} query 
   * @param {string} category 
   * @returns {Array<Object>}
   */
  searchEvents(query = '', category = 'All') {
    const term = query.toLowerCase();
    return this.allEvents.filter(ev => {
      const matchTerm = ev.name.toLowerCase().includes(term) || ev.description.toLowerCase().includes(term);
      const matchCategory = category === 'All' || ev.category === category;
      return matchTerm && matchCategory;
    });
  },

  /**
   * Creates a new event (Organizer only)
   * @param {Object} eventData 
   * @returns {Promise<Object>} The created event
   */
  async createEvent(eventData) {
    Logger.info('EventManager', `Creating event: ${eventData.name}`);
    
    const newEvent = {
      id: `ev${Date.now()}`,
      organizerId: UserSession.user.id,
      name: sanitizeInput(eventData.name),
      description: sanitizeInput(eventData.description),
      date: eventData.date,
      time: eventData.time,
      venue: sanitizeInput(eventData.venue),
      category: eventData.category || 'Tech',
      maxAttendees: eventData.maxAttendees || 100,
      sessions: []
    };

    // Store in demo list
    CONFIG.DEMO.EVENTS.push(newEvent);
    this.allEvents.push(newEvent);

    Logger.info('EventManager', `Event published: ${newEvent.id}`);
    return newEvent;
  },

  /**
   * Joins an event
   * @param {string} userId 
   * @param {string} eventId 
   * @returns {Promise<boolean>}
   */
  async joinEvent(userId, eventId) {
    Logger.info('EventManager', `User ${userId} joining event ${eventId}`);
    
    // Update local config demo participation
    // (In real app, we would write to SHEETS.PARTICIPATION_TAB)
    if (!CONFIG.DEMO.PARTICIPATION) CONFIG.DEMO.PARTICIPATION = [];
    
    const exists = CONFIG.DEMO.PARTICIPATION.some(p => p.userId === userId && p.eventId === eventId);
    if (!exists) {
      CONFIG.DEMO.PARTICIPATION.push({ userId, eventId, status: 'Going' });
    }
    
    return true;
  },

  /**
   * Leaves an event
   * @param {string} userId 
   * @param {string} eventId 
   * @returns {Promise<boolean>}
   */
  async leaveEvent(userId, eventId) {
    Logger.info('EventManager', `User ${userId} leaving event ${eventId}`);
    
    if (CONFIG.DEMO.PARTICIPATION) {
      CONFIG.DEMO.PARTICIPATION = CONFIG.DEMO.PARTICIPATION.filter(
        p => !(p.userId === userId && p.eventId === eventId)
      );
    }
    
    return true;
  },

  /**
   * Gets events joined by a specific user
   * @param {string} userId 
   * @returns {Array<Object>}
   */
  getUserEvents(userId) {
    if (!CONFIG.DEMO.PARTICIPATION) return [];
    
    const joinedIds = CONFIG.DEMO.PARTICIPATION
      .filter(p => p.userId === userId)
      .map(p => p.eventId);
      
    return this.allEvents.filter(ev => joinedIds.includes(ev.id));
  }
};
