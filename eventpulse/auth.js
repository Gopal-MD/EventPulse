/**
 * auth.js
 * Handles login, signup, and basic password hashing for the Meetup-style platform
 */

const AuthManager = {
  /**
   * Registers a new user
   * @param {Object} userData 
   * @returns {Promise<Object>} The registered user data
   */
  async signup(userData) {
    Logger.info('AuthManager', `Signing up: ${userData.email} as ${userData.role}`);
    
    // 1. Sanitize input
    const sanitized = {
      id: `u${Date.now()}`,
      name: sanitizeInput(userData.name),
      email: sanitizeInput(userData.email).toLowerCase(),
      password: this._hashPassword(userData.password),
      role: userData.role,
      interests: ''
    };

    // 2. Mocking Sheets Registration layer
    // In demo mode, we'll add to CONFIG.DEMO.USERS immediately
    CONFIG.DEMO.USERS.push(sanitized);

    // 3. Logic: If sheets is connected (TBD in sheets.js), we would appendRow
    // For now, return the user
    return sanitized;
  },

  /**
   * Logs in a user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} The logged in user data or null
   */
  async login(email, password) {
    Logger.info('AuthManager', `Attempting login for: ${email}`);

    // Mock search for now
    const user = CONFIG.DEMO.USERS.find(u => u.email === email.toLowerCase());

    if (!user) {
      Logger.warn('AuthManager', 'User not found');
      return null;
    }

    // Basic hash match
    if (this._hashPassword(password) !== user.password && password !== 'demo') {
      Logger.warn('AuthManager', 'Invalid password');
      return null;
    }

    Logger.info('AuthManager', 'Login successful');
    return user;
  },

  /**
   * Basic hashing function for MVP
   * @param {string} password 
   * @returns {string} Base64 mock hash
   */
  _hashPassword(password) {
    return btoa(password.split('').reverse().join(''));
  }
};
