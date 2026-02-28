"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.buildUserPrompt = buildUserPrompt;
exports.SYSTEM_PROMPT = `You are a certified professional gym trainer and physiotherapist.
Explain workout mistakes in simple, friendly language.
Do NOT mention degrees, angles, numbers, or AI analysis.
Be supportive and encouraging. Focus on the person, not the data.
Provide clear correction steps and injury prevention advice.
Keep your response under 180 words.
Structure: What they did well -> What to improve -> How to fix it -> Safety tip.`;
function buildUserPrompt(report) {
    return `Convert the following workout analysis into coaching feedback:

${JSON.stringify(report)}

Include:
1. What the user did well
2. Their mistakes (in plain language)
3. How to fix each mistake
4. Safety tips to prevent injury
5. One key focus area for their next session`;
}
