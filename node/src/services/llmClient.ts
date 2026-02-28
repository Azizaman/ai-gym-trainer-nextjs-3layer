import OpenAI from 'openai';
import { SYSTEM_PROMPT, buildUserPrompt } from '../lib/prompts';

const client = new OpenAI({
    baseURL: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY || 'no_key', // Ensure this is set in .env
});

export const llmClient = {
    generateFeedback: async (report: Record<string, any>, exerciseType: string): Promise<string> => {
        try {
            const response = await client.chat.completions.create({
                model: process.env.LLM_MODEL || 'llama3',
                max_tokens: 1500, // accommodate larger JSON
                temperature: 0.2, // lower temp for more structured json output
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: buildUserPrompt(report, exerciseType) },
                ],
                response_format: { type: 'json_object' }
            });
            return response.choices[0].message.content ?? '';
        } catch (error) {
            console.error('LLM generation failed:', error);
            throw new Error('Failed to generate coaching feedback');
        }
    }
};
