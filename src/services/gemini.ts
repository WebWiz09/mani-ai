import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

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

const OUTPUT_INSTRUCTIONS: Record<string, string> = {
  "Startup Pitch":
    "Write a punchy, confident startup pitch. Keep it under 150 words. Structure: one opening hook, one problem statement, one solution sentence, one traction/differentiator line, one closing ask. No headers. No bullet points. Plain flowing paragraphs only.",
  "Proposal":
    `Write a professional freelance proposal. Use today's date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Structure: greeting, brief intro of who you are, understanding of the project, your approach, relevant experience, a clear call to action. Use a maximum of 2 short sections with simple bold labels only. No H1 or H2 markdown headers. Keep it under 250 words.`,
  "Grant":
    `Write a structured grant application. Use today's date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Structure: Project Title, Executive Summary, Problem Statement, Proposed Solution, Expected Impact, Budget Overview, Closing Statement. Use simple bold labels for each section. No H1 or H2 markdown headers. Be thorough — this should be 300-400 words.`,
  "Professional Bio":
    "Write a concise professional bio in third person. Keep it to 3 short paragraphs maximum — who they are, what they do, and one personal/professional touch. No headers. No bullet points. Plain flowing text only. Under 120 words.",
};

export async function getNextQuestion(state: InterviewState): Promise<string> {
  const prompt = `
    You are Mani, a world-class interviewer helping someone write a ${state.type}.
    Your goal is to gather enough information to write a high quality ${state.type}.
    
    CRITICAL RULES:
    1. NEVER repeat any question already asked.
    2. Ask ONE short, clear question at a time.
    3. If you have gathered enough information (usually after 4-6 questions), respond ONLY with the word "COMPLETE".
    4. Do NOT add any preamble, explanation, or acknowledgement — just ask the next question directly.
    
    Previous Interview:
    ${state.answers.length === 0 ? "No questions asked yet." : state.answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join('\n')}
    
    Current Progress: ${state.answers.length} questions answered.
    
    What is the single most important NEXT question to ask?
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.7 }
    }));
    const text = response.text?.trim() || "";
    return text === "COMPLETE" ? "COMPLETE" : text;
  } catch (error: any) {
    const isQuotaError =
      error.status === "RESOURCE_EXHAUSTED" ||
      error.code === 429 ||
      error.error?.status === "RESOURCE_EXHAUSTED" ||
      error.error?.code === 429;
    if (isQuotaError) {
      return "I'm experiencing high demand. Please wait a moment and try again.";
    }
    return "I encountered an error. Please try again.";
  }
}

export async function generateOutput(state: InterviewState): Promise<string> {
  const instructions = OUTPUT_INSTRUCTIONS[state.type] || OUTPUT_INSTRUCTIONS["Proposal"];

  const prompt = `
    You are Mani, an expert writer.
    Based on the following interview, write a ${state.type} for this person.
    
    FORMATTING RULES:
    ${instructions}
    
    Interview Data:
    ${state.answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n')}
    
    Write the ${state.type} now. Follow the formatting rules exactly.
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ parts: [{ text: prompt }] }],
    }));
    return response.text || "Failed to generate output.";
  } catch (error: any) {
    const isQuotaError =
      error.status === "RESOURCE_EXHAUSTED" ||
      error.code === 429 ||
      error.error?.status === "RESOURCE_EXHAUSTED" ||
      error.error?.code === 429;
    if (isQuotaError) {
      return "Quota exceeded. Please try again in a few minutes.";
    }
    return "Failed to generate output due to an error.";
  }
}
    return "Failed to generate output due to an error.";
  }
}
