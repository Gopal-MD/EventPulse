/**
 * user.js
 * Manages user session, roles, and basic state for the multi-event platform
 */

const UserSession = {
  /** @type {Object|null} Current logged in user object */
  user: null,

  /**
   * Initializes user session from localStorage
   */
  init() {
    const savedUser = localStorage.getItem('ep_session');
    if (savedUser) {
      this.user = JSON.parse(savedUser);
      Logger.info('UserSession', `Session restored: ${this.user.email}`);
    }
  },

  /**
   * Checks if a user is logged in
   * @returns {boolean}
   */
  isLoggedIn() {
    return !!this.user;
  },

  /**
   * Sets the user session
   * @param {Object} userData 
   */
  login(userData) {
    this.user = userData;
    localStorage.setItem('ep_session', JSON.stringify(userData));
    Logger.info('UserSession', `User logged in: ${userData.email}`);
  },

  /**
   * Clears the user session
   */
  logout() {
    this.user = null;
    localStorage.removeItem('ep_session');
    Logger.info('UserSession', 'User logged out');
  },

  /**
   * Checks if the current user is an organizer
   * @returns {boolean}
   */
  isOrganizer() {
    return this.user && this.user.role === CONFIG.ROLES.ORGANIZER;
  },

  /**
   * Gets user initials
   * @returns {string}
   */
  getInitials() {
    if (!this.user || !this.user.name) return '??';
    return this.user.name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
};

// Initialize session immediately
UserSession.init();
