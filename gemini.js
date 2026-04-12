/**
 * SmartVenue — Gemini AI Orchestrator
 * Powers AI Chatbot, Queue Intelligence, and Sentiment Analysis
 */

const GeminiAI = (() => {
  const _hasKey = () => CONFIG.KEYS.GEMINI !== "YOUR_GEMINI_API_KEY";

  const _callAPI = async (systemPrompt, userPrompt) => {
    if (!_hasKey()) {
      Logger.info('GeminiAI', 'Demo Mode: Simulating AI response');
      return _getMockResponse(userPrompt);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.KEYS.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${CONFIG.KEYS.GEMINI}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nAttendee: ${userPrompt}` }] }],
          generationConfig: { maxOutputTokens: 256, temperature: 0.7 }
        })
      });
      if (!response.ok) throw new Error('Gemini API request failed');
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      Logger.error('GeminiAI', error);
      return _getMockResponse(userPrompt);
    }
  };

  /**
   * System Prompts for different features
   */
  const SYSTEM_PROMPTS = {
    CONCIERGE: `You are SmartVenue Assistant, a helpful AI concierge for ${CONFIG.VENUE.EVENT} at ${CONFIG.VENUE.NAME}. 
      Use the provided venue layout, today's schedule, food menu, and crowd conditions to help the attendee.
      - Menu: ${CONFIG.MENU.map(m => m.name).join(', ')}
      - Keep answers under 3 sentences. Be sporty and friendly. Use emojis.`,
    
    OPTIMIZER: `You are a stadium logistics expert. Analyze the providing queue data and suggest the fastest gate or food stall.
      Provide a one-sentence high-energy tip for the attendee.`,

    SENTIMENT: `Analyze the following attendee feedback from a stadium event.
      Provide a summary in the format: "X% positive — [Core Theme]".`
  };

  /**
   * Mock responses for Presentation Mode
   */
  const _getMockResponse = (prompt) => {
    const p = prompt.toLowerCase();
    if (p.includes('vegetaries') || p.includes('vadapav') || p.includes('food')) {
      return "The nearest vegetarian stall is **Pune Flavors** near the North Stand. It's serving hot Vada Pav with only a 2-minute wait! 🍔🔥";
    }
    if (p.includes('gate') || p.includes('crowd') || p.includes('entrance')) {
      return "Gate 4 (West) is looking great with a low 3-minute wait. Avoid Gate 2 right now—it's at its peak! 🏟️🏃";
    }
    if (p.includes('start') || p.includes('match') || p.includes('when')) {
      return "The pre-match ceremony starts in 10 minutes, and first ball is at 7:30 PM sharp. Get your snacks now! 🏏✨";
    }
    return "I'm your SmartVenue Assistant! I can help you find your seat, locate the best food, or navigate the stadium traffic. What's on your mind? 🏏";
  };

  return {
    askConcierge: (q) => _callAPI(SYSTEM_PROMPTS.CONCIERGE, q),
    getSmartQueueTip: (data) => _callAPI(SYSTEM_PROMPTS.OPTIMIZER, `Live Data: ${JSON.stringify(data)}`),
    analyzeFeedback: (feedback) => _callAPI(SYSTEM_PROMPTS.SENTIMENT, `Feedback: ${feedback}`)
  };
})();
