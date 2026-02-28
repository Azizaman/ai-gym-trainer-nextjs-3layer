"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmClient = void 0;
const openai_1 = __importDefault(require("openai"));
const prompts_1 = require("../lib/prompts");
const client = new openai_1.default({
    baseURL: process.env.LLM_BASE_URL || 'http://localhost:11434/v1',
    apiKey: 'ollama', // required by SDK but ignored by Ollama
});
exports.llmClient = {
    generateFeedback: async (report) => {
        try {
            const response = await client.chat.completions.create({
                model: process.env.LLM_MODEL || 'llama3',
                max_tokens: 300,
                temperature: 0.7,
                messages: [
                    { role: 'system', content: prompts_1.SYSTEM_PROMPT },
                    { role: 'user', content: (0, prompts_1.buildUserPrompt)(report) },
                ],
            });
            return response.choices[0].message.content ?? '';
        }
        catch (error) {
            console.error('LLM generation failed:', error);
            throw new Error('Failed to generate coaching feedback');
        }
    }
};
