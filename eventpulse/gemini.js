/* ============================================================
   EventPulse — Gemini API Integration
   All AI-powered features: recommendations, matchmaking, summaries
   ============================================================ */

const GeminiAPI = (() => {
  let _lastCallTime = 0;

  const _hasCredentials = () => CONFIG.GEMINI.API_KEY !== 'YOUR_GEMINI_API_KEY_HERE';

  const _rateLimit = async () => {
    const elapsed = Date.now() - _lastCallTime;
    const minDelay = CONFIG.DEBOUNCE.API_CALL;
    if (elapsed < minDelay) await sleep(minDelay - elapsed);
    _lastCallTime = Date.now();
  };

  const _buildUrl = () => `${CONFIG.GEMINI.API_URL}/${CONFIG.GEMINI.MODEL}:generateContent?key=${CONFIG.GEMINI.API_KEY}`;

  const _buildRequestBody = (systemPrompt, userPrompt) => ({
    contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userPrompt}` }] }],
    generationConfig: { maxOutputTokens: CONFIG.GEMINI.MAX_TOKENS, temperature: 0.7 }
  });

  const generate = async (systemPrompt, userPrompt, retries = 2) => {
    if (!_hasCredentials()) return _getDemoResponse(systemPrompt, userPrompt);

    await _rateLimit();
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(_buildUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(_buildRequestBody(systemPrompt, userPrompt))
        });
        if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (error) {
        if (attempt === retries) throw error;
        await sleep(1000 * (attempt + 1));
      }
    }
  };

  const _getDemoResponse = (systemPrompt, userPrompt) => {
    const p = userPrompt.toLowerCase();
    if (systemPrompt.includes('recommend events')) {
      return `Based on your interest in **AI and Startups**, I recommend:
      \n1. **TechSphere 2025** — The flagship event for emerging tech.
      \n2. **Startup Founders Mixer** — Perfect for networking with investors.`;
    }
    if (systemPrompt.includes('icebreaker')) {
      return "I see you're both attending TechSphere. Why not ask them about their take on the AI Keynote earlier today?";
    }
    return "This event is a great opportunity to learn about industry trends and connect with like-minded professionals.";
  };

  return { generate };
})();

/**
 * Platform AI Features
 */

const getEventRecommendations = async (userInterests, joinedEvents) => {
  const eventsContext = CONFIG.DEMO.EVENTS.map(e => `${e.name} (${e.category}): ${e.description}`).join('\n');
  const systemPrompt = `You are an event matchmaker. Recommend the best 2 events from the list based on user interests. Be brief.`;
  const userPrompt = `Interests: ${userInterests}\nPast/Joined Events: ${joinedEvents.join(', ')}\n\nEvents List:\n${eventsContext}`;
  
  return GeminiAPI.generate(systemPrompt, userPrompt);
};

const getIcebreaker = async (userProfile, matchProfile) => {
  const systemPrompt = `Generate a single creative networking icebreaker question based on two profiles.`;
  const userPrompt = `User: ${userProfile}\nMatch: ${matchProfile}`;
  
  return GeminiAPI.generate(systemPrompt, userPrompt);
};

const getEventSummary = async (description) => {
  const systemPrompt = `Summarize this event description in exactly one punchy sentence for a mobile app.`;
  return GeminiAPI.generate(systemPrompt, description);
};
