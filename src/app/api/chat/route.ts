import { NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";

const ai = new OpenAI({
    apiKey: process.env.GROK_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.LLM_BASE_URL || "https://api.groq.com/openai/v1"
});

const SYSTEM_PROMPT = `You are FormAI Coach, an expert fitness and nutrition assistant. You are helpful, motivating, and knowledgeable about:

- Diet plans, macros, calories, meal prep
- Workout programming and periodization
- Injury prevention and recovery
- Supplements and hydration
- Exercise form and technique tips
- Goal-specific advice (weight loss, muscle gain, endurance, flexibility)

Guidelines:
- Keep answers concise but thorough (2-4 paragraphs max)
- Use bullet points for lists
- Be encouraging and positive
- If asked about medical conditions, advise consulting a healthcare professional
- Format responses with markdown for readability
- Use emojis sparingly for a friendly tone`;

interface ChatMessage {
    role: "user" | "model";
    text: string;
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, history } = (await request.json()) as {
            message: string;
            history: ChatMessage[];
        };

        if (!message?.trim()) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        // Build conversation messages for OpenAI-compatible API
        const messages = [
            { role: "system" as const, content: SYSTEM_PROMPT },
            { role: "assistant" as const, content: "Understood! I'm FormAI Coach, ready to help with fitness and nutrition questions. How can I help you today? 💪" },
            ...history.map((msg) => ({
                role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
                content: msg.text,
            })),
            { role: "user" as const, content: message },
        ];

        const response = await ai.chat.completions.create({
            model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
            messages,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const reply = response.choices[0]?.message?.content?.trim() ?? "Sorry, I couldn't process that. Please try again.";

        return NextResponse.json({ success: true, reply });
    } catch (error) {
        console.error("Chat error:", error);
        return NextResponse.json(
            { error: "Failed to get response" },
            { status: 500 }
        );
    }
}
