/* ============================================================
   EventPulse — Utility Functions
   Pure helper functions — no side effects, no state mutations
   ============================================================ */

/* ----------------------------------------------------------
   Logger Utility Class
   Replaces console.log in production code
   ---------------------------------------------------------- */

/**
 * Centralized logging utility with severity levels
 * All production logging goes through this class
 */
class Logger {
  /** @type {boolean} */
  static enabled = true;

  /** @type {string[]} */
  static levels = ['debug', 'info', 'warn', 'error'];

  /**
   * Logs a debug-level message
   * @param {string} context - Source function or module name
   * @param {...*} args - Data to log
   */
  static debug(context, ...args) {
    if (Logger.enabled) {
      Logger._log('debug', context, ...args);
    }
  }

  /**
   * Logs an informational message
   * @param {string} context - Source function or module name
   * @param {...*} args - Data to log
   */
  static info(context, ...args) {
    Logger._log('info', context, ...args);
  }

  /**
   * Logs a warning message
   * @param {string} context - Source function or module name
   * @param {...*} args - Data to log
   */
  static warn(context, ...args) {
    Logger._log('warn', context, ...args);
  }

  /**
   * Logs an error message
   * @param {string} context - Source function or module name
   * @param {...*} args - Data to log
   */
  static error(context, ...args) {
    Logger._log('error', context, ...args);
  }

  /**
   * Logs a passing test result
   * @param {string} testName - Name of the test
   */
  static pass(testName) {
    Logger._log('info', 'TEST', `✅ PASS: ${testName}`);
  }

  /**
   * Logs a failing test result
   * @param {string} testName - Name of the test
   * @param {Error} error - The error that caused failure
   */
  static fail(testName, error) {
    Logger._log('error', 'TEST', `❌ FAIL: ${testName} — ${error.message}`);
  }

  /**
   * Internal log dispatcher
   * @param {string} level - Severity level
   * @param {string} context - Source context
   * @param {...*} args - Data to log
   * @private
   */
  static _log(level, context, ...args) {
    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
    const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    Function.prototype.call.call(
      globalThis.console[method],
      globalThis.console,
      prefix,
      ...args
    );
  }
}


/* ----------------------------------------------------------
   Input Sanitization
   ---------------------------------------------------------- */

/**
 * Removes HTML tags, script elements, and dangerous characters from input
 * @param {string} input - Raw user input string
 * @returns {string} Sanitized string safe for display and API calls
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .trim();
};


/* ----------------------------------------------------------
   Time Formatting
   ---------------------------------------------------------- */

/**
 * Converts 24-hour time string to 12-hour format with AM/PM
 * @param {string} time24 - Time in "HH:MM" format (e.g., "14:30")
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
const formatTime = (time24) => {
  const [hoursStr, minutes] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${minutes} ${period}`;
};


/* ----------------------------------------------------------
   Debounce
   ---------------------------------------------------------- */

/**
 * Creates a debounced version of a function that delays execution
 * @param {Function} func - Function to debounce
 * @param {number} waitMs - Delay in milliseconds
 * @returns {Function} Debounced function
 */
const debounce = (func, waitMs) => {
  let timeoutId = null;
  return (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };
};


/* ----------------------------------------------------------
   Crowd Level Helpers
   ---------------------------------------------------------- */

/**
 * Maps crowd level string to a hex color code
 * @param {string} level - Crowd level: "Low", "Medium", "High", or "Full"
 * @returns {string} Hex color code for the crowd level
 */
const getCrowdColor = (level) => {
  const colorMap = {
    Low: '#4CAF50',
    Medium: '#FFB300',
    High: '#FF7043',
    Full: '#F44336'
  };
  return colorMap[level] || '#6e6e99';
};

/**
 * Maps crowd level string to a CSS modifier class name
 * @param {string} level - Crowd level: "Low", "Medium", "High", or "Full"
 * @returns {string} BEM modifier (e.g., "low", "medium")
 */
const getCrowdModifier = (level) => {
  const modifierMap = {
    Low: 'low',
    Medium: 'medium',
    High: 'high',
    Full: 'full'
  };
  return modifierMap[level] || 'low';
};


/* ----------------------------------------------------------
   Profile Validation
   ---------------------------------------------------------- */

/**
 * Validates a networking profile object for required fields
 * @param {Object} profile - Profile with name, role, interests/skills
 * @param {string} profile.name - Attendee full name
 * @param {string} profile.role - Job title or role
 * @param {string} profile.interests - Skills or interests
 * @returns {{ isValid: boolean, errors: string[] }} Validation result
 */
const validateProfile = (profile) => {
  const errors = [];
  if (!profile.name || profile.name.trim().length === 0) {
    errors.push('Name is required');
  }
  if (!profile.role || profile.role.trim().length === 0) {
    errors.push('Role is required');
  }
  if (!profile.interests || profile.interests.trim().length === 0) {
    errors.push('Interests or skills are required');
  }
  return { isValid: errors.length === 0, errors };
};


/* ----------------------------------------------------------
   Onboarding Validation
   ---------------------------------------------------------- */

/**
 * Validates onboarding form data for required fields
 * @param {Object} data - Onboarding answers
 * @param {string} data.role - Selected role
 * @param {string} data.interests - Topics of interest
 * @param {string} data.goal - Main event goal
 * @returns {{ isValid: boolean, errors: Object }} Validation result with field-level errors
 */
const validateOnboarding = (data) => {
  const errors = {};
  if (!data.role) errors.role = 'Please select your role';
  if (!data.interests || data.interests.trim().length === 0) {
    errors.interests = 'Please enter your interests';
  }
  if (!data.goal) errors.goal = 'Please select your goal';
  return { isValid: Object.keys(errors).length === 0, errors };
};


/* ----------------------------------------------------------
   Feedback Validation
   ---------------------------------------------------------- */

/**
 * Validates feedback form data
 * @param {Object} data - Feedback data
 * @param {string} data.sessionId - Selected session ID
 * @param {number} data.rating - Star rating (1-5)
 * @param {string} data.comment - Optional comment text
 * @returns {{ isValid: boolean, errors: Object }} Validation result
 */
const validateFeedback = (data) => {
  const errors = {};
  if (!data.sessionId) errors.session = 'Please select a session';
  if (!data.rating || data.rating < 1 || data.rating > 5) {
    errors.rating = 'Please select a rating';
  }
  if (data.comment && data.comment.length > 200) {
    errors.comment = 'Comment must be 200 characters or fewer';
  }
  return { isValid: Object.keys(errors).length === 0, errors };
};


/* ----------------------------------------------------------
   DOM Helpers
   ---------------------------------------------------------- */

/**
 * Shortcut for document.getElementById
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Found element or null
 */
const getEl = (id) => document.getElementById(id);

/**
 * Shortcut for document.querySelector
 * @param {string} selector - CSS selector
 * @returns {HTMLElement|null} First matching element or null
 */
const queryEl = (selector) => document.querySelector(selector);

/**
 * Shortcut for document.querySelectorAll
 * @param {string} selector - CSS selector
 * @returns {NodeList} All matching elements
 */
const queryAll = (selector) => document.querySelectorAll(selector);

/**
 * Creates an HTML element with optional class and text content
 * @param {string} tag - HTML tag name
 * @param {Object} [options={}] - Element options
 * @param {string} [options.className] - CSS class(es) to add
 * @param {string} [options.text] - Text content
 * @param {string} [options.html] - Inner HTML content
 * @param {Object} [options.attrs] - Key-value pairs for attributes
 * @returns {HTMLElement} Newly created element
 */
const createElement = (tag, options = {}) => {
  const element = document.createElement(tag);
  if (options.className) element.className = options.className;
  if (options.text) element.textContent = options.text;
  if (options.html) element.innerHTML = options.html;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  return element;
};


/* ----------------------------------------------------------
   Sleep / Delay
   ---------------------------------------------------------- */

/**
 * Returns a promise that resolves after specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>} Resolves after delay
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


/* ----------------------------------------------------------
   Assertion Helper (for tests)
   ---------------------------------------------------------- */

/**
 * Asserts a condition is true; throws Error if false
 * @param {boolean} condition - Condition to assert
 * @param {string} message - Error message if assertion fails
 * @throws {Error} If condition is false
 */
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};


/* ----------------------------------------------------------
   Text Truncation
   ---------------------------------------------------------- */

/**
 * Truncates text to a maximum length with ellipsis
 * @param {string} text - Input text
 * @param {number} maxLength - Maximum character length
 * @returns {string} Truncated text with "..." if exceeded
 */
const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.substring(0, maxLength)}...`;
};


/* ----------------------------------------------------------
   Initials Generator
   ---------------------------------------------------------- */

/**
 * Generates initials from a full name string
 * @param {string} name - Full name (e.g., "John Doe")
 * @returns {string} Uppercase initials (e.g., "JD")
 */
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};


/* ----------------------------------------------------------
   Rating Labels
   ---------------------------------------------------------- */

/**
 * Returns a human-readable label for a numeric star rating
 * @param {number} rating - Star rating (1-5)
 * @returns {string} Descriptive label for the rating
 */
const getRatingLabel = (rating) => {
  const labels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };
  return labels[rating] || 'No rating selected';
};


/* ----------------------------------------------------------
   CacheManager Class
   ---------------------------------------------------------- */

/**
 * In-memory cache with Time-To-Live (TTL) support per entry
 * Used to reduce redundant Google Sheets API calls
 */
class CacheManager {
  constructor() {
    /** @type {Map<string, {value: *, expiry: number}>} */
    this.store = new Map();
  }

  /**
   * Stores a value with a TTL in seconds
   * @param {string} key - Cache key
   * @param {*} value - Data to cache
   * @param {number} ttlSeconds - Time-to-live in seconds
   */
  set(key, value, ttlSeconds) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiry });
  }

  /**
   * Retrieves a cached value if it hasn't expired
   * @param {string} key - Cache key
   * @returns {*|null} Cached value or null if expired/missing
   */
  get(key) {
    const item = this.store.get(key);
    if (!item || Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Removes a specific entry from the cache
   * @param {string} key - Cache key to remove
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Clears all cached entries
   */
  clear() {
    this.store.clear();
  }
}
