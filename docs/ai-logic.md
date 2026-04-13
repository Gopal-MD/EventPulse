# AI Decision Logic

EventPulse uses a deterministic threshold model with Gemini-assisted message generation.

## Core Rule

IF crowd_level > threshold:
trigger alert
suggest alternate gate

## Execution Flow

1. The backend reads gate crowd levels.
2. Each gate is labeled as Low, Medium, or High.
3. If any gate is High:
- Gemini generates rerouting instructions using structured JSON output.
- If Gemini is unavailable, fallback logic generates a deterministic alert.
4. The dashboard and live map consume alerts through /api/state.

## Prediction and Reaction

Prediction in this project is lightweight and reactive:
- Current crowd level is the prediction signal.
- Threshold crossings indicate likely congestion growth.
- The system reacts by rerouting users to low-density gates in real time.

## Why this is reliable

- Structured output keeps AI responses parse-safe.
- Fallback mode prevents service interruption when AI is unavailable.
- Rate-limited APIs reduce noisy updates and protect stability.
