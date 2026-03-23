import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY});

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
      console.warn(`Quota exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export async function getNextQuestion(state: InterviewState): Promise<string> {
  const prompt = `
    You are Mani, a world-class interviewer for ${state.type}s.
    Your goal is to gather enough information to write a professional ${state.type}.
    
    CRITICAL RULES:
    1. DO NOT repeat any of the questions already asked.
    2. Ask one short, clear, and insightful question at a time.
    3. If you have enough information (usually after 4-6 questions), respond ONLY with the word "COMPLETE".
    
    Previous Interview History:
    ${state.answers.length === 0 ? "No questions asked yet." : state.answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join('\n')}
    
    Current Progress: ${state.answers.length} questions answered.
    
    Based on the history above, what is the single most important NEXT question to ask to help you write a high-quality ${state.type}?
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
      }
    }));

    const text = response.text?.trim() || "";
    return text === "COMPLETE" ? "COMPLETE" : text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const isQuotaError = 
      error.status === "RESOURCE_EXHAUSTED" || 
      error.code === 429 ||
      error.error?.status === "RESOURCE_EXHAUSTED" ||
      error.error?.code === 429;

    if (isQuotaError) {
      return "I'm currently experiencing high demand. Please wait a moment and try again.";
    }
    return "I encountered an error. Please try again.";
  }
}

export async function generateOutput(state: InterviewState): Promise<string> {
  const prompt = `
    You are Mani, an expert at crafting ${state.type}s.
    Based on the following interview, write a polished, professional, and compelling ${state.type}.
    
    Interview Data:
    ${state.answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n')}
    
    Format the output using clear headings, bullet points, and professional language. 
    Make it ready for use in a professional setting.
  `;

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    }));

    return response.text || "Failed to generate output.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const isQuotaError = 
      error.status === "RESOURCE_EXHAUSTED" || 
      error.code === 429 ||
      error.error?.status === "RESOURCE_EXHAUSTED" ||
      error.error?.code === 429;

    if (isQuotaError) {
      return "Quota exceeded. I'm unable to generate the final output right now. Please try again in a few minutes.";
    }
    return "Failed to generate output due to an error.";
  }
}
