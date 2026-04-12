/* ============================================================
   EventPulse — Google Sheets API Integration
   REST v4 calls with caching layer and demo fallback
   ============================================================ */

/**
 * Cache instance shared across all Sheets operations
 * @type {CacheManager}
 */
const sheetsCache = new CacheManager();

/**
 * Google Sheets API wrapper with caching, retry, and demo fallback
 * @namespace SheetsAPI
 */
const SheetsAPI = (() => {

  /**
   * Checks if real API credentials are configured
   * @returns {boolean} True if valid API key is set
   * @private
   */
  const _hasCredentials = () => {
    return (
      CONFIG.SHEETS.API_KEY !== 'YOUR_SHEETS_API_KEY_HERE' &&
      CONFIG.SHEETS.SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE'
    );
  };

  /**
   * Builds the Sheets API URL for a given tab and range
   * @param {string} tab - Sheet tab name
   * @param {string} [range=''] - Optional A1 notation range
   * @returns {string} Full REST API URL
   * @private
   */
  const _buildUrl = (tab, range = '') => {
    const base = CONFIG.SHEETS.BASE_URL;
    const sheetId = CONFIG.SHEETS.SPREADSHEET_ID;
    const rangeStr = range ? `${tab}!${range}` : tab;
    const key = CONFIG.SHEETS.API_KEY;
    return `${base}/${sheetId}/values/${rangeStr}?key=${key}`;
  };

  /**
   * Builds the Sheets API append URL for writing data
   * @param {string} tab - Sheet tab name
   * @returns {string} Full REST API URL for appending
   * @private
   */
  const _buildAppendUrl = (tab) => {
    const base = CONFIG.SHEETS.BASE_URL;
    const sheetId = CONFIG.SHEETS.SPREADSHEET_ID;
    const key = CONFIG.SHEETS.API_KEY;
    return `${base}/${sheetId}/values/${tab}:append?valueInputOption=USER_ENTERED&key=${key}`;
  };

  /**
   * Performs a fetch request with retry logic
   * @param {string} url - API endpoint URL
   * @param {Object} [options={}] - Fetch options
   * @param {number} [retries=2] - Number of retry attempts
   * @returns {Promise<Object>} Parsed JSON response
   * @private
   */
  const _fetchWithRetry = async (url, options = {}, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`Sheets API ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        const isLastAttempt = attempt === retries;
        if (isLastAttempt) throw error;
        Logger.warn('SheetsAPI', `Retry ${attempt + 1}/${retries}`, error.message);
        await sleep(1000 * (attempt + 1));
      }
    }
  };

  /**
   * Reads data from a Google Sheets tab with caching
   * @param {string} tab - Sheet tab name
   * @param {string} [range=''] - Optional A1 notation range
   * @param {number} [ttl=60] - Cache TTL in seconds
   * @returns {Promise<Array<Array<string>>>} Rows of data
   */
  const read = async (tab, range = '', ttl = 60) => {
    const cacheKey = `sheets_${tab}_${range}`;
    const cached = sheetsCache.get(cacheKey);
    if (cached !== null) {
      Logger.debug('SheetsAPI', `Cache hit: ${cacheKey}`);
      return cached;
    }

    if (!_hasCredentials()) {
      Logger.info('SheetsAPI', `Demo mode: returning fallback for ${tab}`);
      return _getDemoData(tab);
    }

    try {
      const url = _buildUrl(tab, range);
      const data = await _fetchWithRetry(url);
      const rows = data.values || [];
      sheetsCache.set(cacheKey, rows, ttl);
      return rows;
    } catch (error) {
      Logger.error('SheetsAPI.read', error);
      return _getDemoData(tab);
    }
  };

  /**
   * Appends a row of data to a Google Sheets tab
   * @param {string} tab - Sheet tab name
   * @param {Array<string>} rowData - Array of cell values to append
   * @returns {Promise<boolean>} True if write succeeded
   */
  const write = async (tab, rowData) => {
    if (!_hasCredentials()) {
      Logger.info('SheetsAPI', `Demo mode: simulated write to ${tab}`);
      await sleep(800);
      return true;
    }

    try {
      const url = _buildAppendUrl(tab);
      const body = { values: [rowData] };
      await _fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return true;
    } catch (error) {
      Logger.error('SheetsAPI.write', error);
      return false;
    }
  };

  /**
   * Returns demo fallback data for a given tab
   * @param {string} tab - Sheet tab name
   * @returns {Array} Demo data array
   * @private
   */
  const _getDemoData = (tab) => {
    switch (tab) {
      case CONFIG.SHEETS.CROWD_TAB:
        return _formatCrowdData();
      case CONFIG.SHEETS.ANNOUNCEMENTS_TAB:
        return _formatAnnouncementData();
      case CONFIG.SHEETS.ATTENDEES_TAB:
        return _formatAttendeeData();
      default:
        return [];
    }
  };

  /**
   * Formats demo crowd data into Sheets-like rows
   * @returns {Array<Array<string>>} Formatted crowd rows
   * @private
   */
  const _formatCrowdData = () => {
    return Object.entries(CONFIG.DEMO_CROWD).map(([id, data]) => {
      return [id, data.level, String(data.count)];
    });
  };

  /**
   * Formats demo announcement data into Sheets-like rows
   * @returns {Array<Array<string>>} Formatted announcement rows
   * @private
   */
  const _formatAnnouncementData = () => {
    return CONFIG.DEMO_ANNOUNCEMENTS.map((ann) => {
      return [ann.id, ann.text, ann.time, String(ann.urgent)];
    });
  };

  /**
   * Formats demo attendee data into Sheets-like rows
   * @returns {Array<Array<string>>} Formatted attendee rows
   * @private
   */
  const _formatAttendeeData = () => {
    return CONFIG.DEMO_ATTENDEES.map((att) => {
      return [att.name, att.role, att.company, att.skills, att.looking];
    });
  };

  /* -- Public API -- */
  return { read, write };
})();


/* ----------------------------------------------------------
   Domain-Specific Sheets Functions
   ---------------------------------------------------------- */

/**
 * Fetches live crowd level data for a specific session
 * @param {string} sessionId - Unique session identifier
 * @returns {Promise<{level: string, count: number}>} Crowd data
 */
const fetchCrowdLevel = async (sessionId) => {
  try {
    const data = await SheetsAPI.read(
      CONFIG.SHEETS.CROWD_TAB,
      '',
      CONFIG.CACHE_TTL.CROWD
    );
    return parseCrowdData(data, sessionId);
  } catch (error) {
    Logger.error('fetchCrowdLevel', error);
    return { level: 'unknown', count: 0 };
  }
};

/**
 * Parses crowd data rows to find a specific session
 * @param {Array<Array<string>>} data - Raw crowd data rows
 * @param {string} sessionId - Session ID to find
 * @returns {{ level: string, count: number }} Parsed crowd info
 */
const parseCrowdData = (data, sessionId) => {
  const row = data.find((row) => row[0] === sessionId);
  if (!row) return { level: 'Low', count: 0 };
  return { level: row[1] || 'Low', count: parseInt(row[2], 10) || 0 };
};

/**
 * Fetches all crowd levels for all sessions
 * @returns {Promise<Object>} Map of sessionId to crowd data
 */
const fetchAllCrowdLevels = async () => {
  try {
    const data = await SheetsAPI.read(
      CONFIG.SHEETS.CROWD_TAB,
      '',
      CONFIG.CACHE_TTL.CROWD
    );
    return parseAllCrowdData(data);
  } catch (error) {
    Logger.error('fetchAllCrowdLevels', error);
    return {};
  }
};

/**
 * Parses all crowd data into a lookup map
 * @param {Array<Array<string>>} data - Raw crowd data rows
 * @returns {Object} Map of sessionId to { level, count }
 */
const parseAllCrowdData = (data) => {
  const result = {};
  data.forEach((row) => {
    if (row[0]) {
      result[row[0]] = {
        level: row[1] || 'Low',
        count: parseInt(row[2], 10) || 0
      };
    }
  });
  return result;
};

/**
 * Fetches announcements from Google Sheets
 * @returns {Promise<Array<Object>>} Parsed announcement objects
 */
const fetchAnnouncements = async () => {
  try {
    const data = await SheetsAPI.read(
      CONFIG.SHEETS.ANNOUNCEMENTS_TAB,
      '',
      CONFIG.CACHE_TTL.ANNOUNCEMENTS
    );
    return parseAnnouncements(data);
  } catch (error) {
    Logger.error('fetchAnnouncements', error);
    return [];
  }
};

/**
 * Parses raw announcement rows into structured objects
 * @param {Array<Array<string>>} data - Raw announcement rows
 * @returns {Array<{id: string, text: string, time: string, urgent: boolean}>}
 */
const parseAnnouncements = (data) => {
  return data.map((row) => ({
    id: row[0] || '',
    text: row[1] || '',
    time: row[2] || '',
    urgent: row[3] === 'true'
  }));
};

/**
 * Fetches attendee profiles for matchmaking
 * @returns {Promise<Array<Object>>} Parsed attendee profiles
 */
const fetchAttendees = async () => {
  try {
    const data = await SheetsAPI.read(
      CONFIG.SHEETS.ATTENDEES_TAB,
      '',
      CONFIG.CACHE_TTL.ATTENDEES
    );
    return parseAttendees(data);
  } catch (error) {
    Logger.error('fetchAttendees', error);
    return [];
  }
};

/**
 * Parses raw attendee rows into structured objects
 * @param {Array<Array<string>>} data - Raw attendee rows
 * @returns {Array<{name: string, role: string, company: string, skills: string, looking: string}>}
 */
const parseAttendees = (data) => {
  return data.map((row) => ({
    name: row[0] || '',
    role: row[1] || '',
    company: row[2] || '',
    skills: row[3] || '',
    looking: row[4] || ''
  }));
};

/**
 * Saves an attendee networking profile to Google Sheets
 * @param {Object} profile - Profile data object
 * @returns {Promise<boolean>} True if write succeeded
 */
const saveProfile = async (profile) => {
  const row = [
    sanitizeInput(profile.name),
    sanitizeInput(profile.role),
    sanitizeInput(profile.company),
    sanitizeInput(profile.skills),
    sanitizeInput(profile.looking)
  ];
  return SheetsAPI.write(CONFIG.SHEETS.ATTENDEES_TAB, row);
};

/**
 * Submits session feedback to Google Sheets
 * @param {Object} feedback - Feedback data
 * @param {string} feedback.sessionId - Session ID
 * @param {number} feedback.rating - Star rating (1-5)
 * @param {string} feedback.comment - Optional comment
 * @returns {Promise<boolean>} True if write succeeded
 */
const submitFeedback = async (feedback) => {
  const row = [
    sanitizeInput(feedback.sessionId),
    String(feedback.rating),
    sanitizeInput(feedback.comment),
    new Date().toISOString()
  ];
  return SheetsAPI.write(CONFIG.SHEETS.FEEDBACK_TAB, row);
};
