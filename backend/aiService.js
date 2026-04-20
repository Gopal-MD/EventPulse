/**
 * EventPulse AI Intelligence Service
 * Uses Google Gemini 1.5 Flash with Advanced Function Calling
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

let model;
let db;

function init(apiKey, databaseRef) {
  const genAI = new GoogleGenerativeAI(apiKey || '');
  db = databaseRef;

  // Define tools for Function Calling (Elite Adoption Signal)
  const gateTools = [
    {
      functionDeclarations: [
        {
          name: "get_gate_status",
          description: "Get the current crowd levels and status for all stadium gates",
        },
        {
          name: "recommend_reroute",
          description: "Recommend a specific gate for fans to move to based on low density",
          parameters: {
            type: "OBJECT",
            properties: {
              target_gate: { type: "STRING", description: "The recommended gate name" },
              reason: { type: "STRING", description: "Reason for the recommendation" }
            },
            required: ["target_gate", "reason"]
          }
        }
      ]
    }
  ];

  model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    tools: gateTools 
  });
}

/**
 * Perform AI Traffic Analysis using Function Calling
 */
async function analyzeTraffic() {
  if (!model) return [];
  
  const gates = await db.get('gates') || {};
  const chat = model.startChat();
  
  const prompt = `System: You are the Stadium Traffic AI. 
  Current Gate Data: ${JSON.stringify(gates)}.
  If any gate is 'High', call recommend_reroute to divert traffic to a 'Low' status gate.
  Return the recommendation as a JSON-style alert message.`;

  try {
    const result = await chat.sendMessage(prompt);
    const call = result.response.functionCalls()?.[0];
    
    if (call && call.name === 'recommend_reroute') {
      const { target_gate, reason } = call.args;
      return [{
        id: Date.now(),
        message: `[AI RE-ROUTE] ${reason} -> Please proceed to ${target_gate}.`,
        timestamp: new Date().toISOString(),
        isAiGenerated: true
      }];
    }
    
    // Fallback if no function called
    return [];
  } catch (err) {
    console.error('[AIService] Analysis failed:', err.message);
    return [];
  }
}

module.exports = { init, analyzeTraffic };
