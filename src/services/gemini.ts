import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY });

export interface InterviewState {
  type: string;
  answers: { question: string; answer: string }[];
  currentQuestion: string;
  isComplete: boolean;
}

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isQuotaError =
      error.status === "RESOURCE_EXHAUSTED" ||
      error.code === 429 ||
      error.error?.status === "RESOURCE_EXHAUSTED" ||
      error.error?.code === 429;
    if (retries > 0 && isQuotaError) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const OUTPUT_INSTRUCTIONS: Record<string, string> = {
  "Startup Pitch": "Write a punchy startup pitch under 150 words. NO headers. NO bullet points. Plain paragraphs only.",
  "Proposal": `Write a professional freelance proposal. Date: ${today}. Use bold labels for 2-3 sections max. NO H1/H2 headers. Under 250 words.`,
  "Grant": `Write a structured grant application. Date: ${today}. Sections: Project Title, Executive Summary, Problem Statement, Proposed Solution, Expected Impact, Budget Overview, Closing Statement. Bold labels only — NO H1/H2 headers. 300-400 words.`,
  "Professional Bio": "Write a concise third-person bio. 3 short paragraphs max. NO headers. NO bullet points. Under 120 words.",
};

export async function getNextQuestion(state: InterviewState): Promise<string> {
  const prompt = `
    You are Mani, a world-class interviewer for ${state.type}s.
    Your goal is to gather enough information to write a professional ${state.type}.
    
    CRITICAL RULES:
    1. DO NOT repeat any of the questions already asked.
    2. Ask one short, clear question at a time.
    3. Do NOT acknowledge the previous answer — just ask the next question directly.
    4. If you have enough information (usually after 4-6 questions), respond ONLY with the word "COMPLETE".
    
    Previous Interview History:
    ${state.answers.length === 0 ? "No questions asked yet." : state.answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join('\n')}
    
    Current Progress: ${state.answers.length} questions answered.
    What is the single most important NEXT question to ask?
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.7 }
    }));
    const text = response.text?.trim() || "";
    return text === "COMPLETE" ? "COMPLETE" : text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const isQuotaError =
      error.status === "RESOURCE_EXHAUSTED" || error.code === 429 ||
      error.error?.status === "RESOURCE_EXHAUSTED" || error.error?.code === 429;
    if (isQuotaError) return "I'm currently experiencing high demand. Please wait a moment and try again.";
    return "I encountered an error. Please try again.";
  }
}

export async function generateOutput(state: InterviewState): Promise<string> {
  const instructions = OUTPUT_INSTRUCTIONS[state.type] || OUTPUT_INSTRUCTIONS["Proposal"];

  const prompt = `
    You are Mani, an expert at crafting ${state.type}s.
    Based on the following interview, write a ${state.type} for this person.

    FORMATTING RULES — follow exactly:
    ${instructions}
    
    Interview Data:
    ${state.answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n')}
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: prompt }] }],
    }));
    return response.text || "Failed to generate output.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const isQuotaError =
      error.status === "RESOURCE_EXHAUSTED" || error.code === 429 ||
      error.error?.status === "RESOURCE_EXHAUSTED" || error.error?.code === 429;
    if (isQuotaError) return "Quota exceeded. Please try again in a few minutes.";
    return "Failed to generate output due to an error.";
  }
}
