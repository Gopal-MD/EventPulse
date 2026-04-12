/**
 * chat.js
 * Handles the event-specific discussion board and real-time messaging
 */

const ChatManager = {
  /** @type {Object} Local cache of chats per event */
  chats: {},

  /**
   * Sends a message to an event's discussion board
   * @param {string} eventId 
   * @param {string} text 
   * @returns {Promise<Object>} The sent message
   */
  async sendMessage(eventId, text) {
    if (!UserSession.isLoggedIn()) return null;

    const message = {
      id: `m${Date.now()}`,
      eventId,
      userId: UserSession.user.id,
      userName: UserSession.user.name,
      text: sanitizeInput(text),
      timestamp: new Date().toISOString()
    };

    // Store in demo memory
    if (!CONFIG.DEMO.CHAT) CONFIG.DEMO.CHAT = [];
    CONFIG.DEMO.CHAT.push(message);

    Logger.info('ChatManager', `Message sent to ${eventId}`);
    return message;
  },

  /**
   * Fetches messages for an event
   * @param {string} eventId 
   * @returns {Promise<Array<Object>>}
   */
  async getMessages(eventId) {
    if (!CONFIG.DEMO.CHAT) return [];
    return CONFIG.DEMO.CHAT.filter(msg => msg.eventId === eventId);
  }
};
