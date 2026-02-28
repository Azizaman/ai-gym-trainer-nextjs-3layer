export const SYSTEM_PROMPT = `You are an expert certified personal trainer and biomechanics specialist.`;

export function buildUserPrompt(report: Record<string, any>, exerciseType: string, options: any = {}): string {
    const focusAreas = options.focusAreas?.join(", ") || "general form";
    const fitnessLevel = options.fitnessLevel || "intermediate";

    return `Analyze this ${exerciseType} action for a ${fitnessLevel} level athlete based on the vision model analysis data:

${JSON.stringify(report)}

Focus on: ${focusAreas}

Provide a detailed form analysis. Be specific, actionable, and encouraging.

Respond ONLY with a valid JSON object in this exact shape (no markdown, no backticks, no markdown formatting):
{
  "isFormCorrect": boolean,
  "score": number,
  "exerciseDetected": string,
  "repCount": number | null,
  "goodPoints": string[],
  "issues": [
    {
      "severity": "critical" | "moderate" | "minor",
      "body_part": string,
      "description": string
    }
  ],
  "corrections": string[],
  "safetyWarnings": string[],
  "summary": string,
  "recommendedDrills": string[]
}`;
}
