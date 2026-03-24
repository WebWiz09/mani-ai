export interface InterviewState {
  type: string;
  answers: { question: string; answer: string }[];
  currentQuestion: string;
  isComplete: boolean;
}

const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const OUTPUT_INSTRUCTIONS: Record<string, string> = {
  "Startup Pitch": "Write a punchy startup pitch under 150 words. NO headers. NO bullet points. Plain paragraphs only.",
  "Proposal": `Write a professional freelance proposal. Date: ${today}. Use bold labels for 2-3 sections max. NO H1/H2 headers. Under 250 words.`,
  "Grant": `Write a structured grant application. Date: ${today}. Sections: Project Title, Executive Summary, Problem Statement, Proposed Solution, Expected Impact, Budget Overview, Closing Statement. Bold labels only. 300-400 words.`,
  "Professional Bio": "Write a concise third-person bio. 3 short paragraphs max. NO headers. NO bullet points. Under 120 words.",
};

async function callClaude(prompt: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "API error");
  return data.content[0].text.trim();
}

export async function getNextQuestion(state: InterviewState): Promise<string> {
  const prompt = `
    You are Mani, a world-class interviewer for ${state.type}s.
    Your goal is to gather enough information to write a professional ${state.type}.
    
    CRITICAL RULES:
    1. DO NOT repeat any question already asked.
    2. Ask ONE short, clear question at a time.
    3. Do NOT acknowledge the previous answer — just ask the next question directly.
    4. If you have enough info (usually after 4-6 questions), respond ONLY with the word "COMPLETE".
    
    Previous Interview:
    ${state.answers.length === 0 ? "No questions asked yet." : state.answers.map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`).join('\n')}
    
    Progress: ${state.answers.length} questions answered.
    What is the single most important NEXT question?
  `;

  try {
    const text = await callClaude(prompt);
    return text === "COMPLETE" ? "COMPLETE" : text;
  } catch (error: any) {
    console.error("Claude API Error:", error);
    return "I encountered an error. Please try again.";
  }
}

export async function generateOutput(state: InterviewState): Promise<string> {
  const instructions = OUTPUT_INSTRUCTIONS[state.type] || OUTPUT_INSTRUCTIONS["Proposal"];

  const prompt = `
    You are Mani, an expert at crafting ${state.type}s.
    Based on this interview, write a ${state.type} for this person.

    FORMATTING RULES — follow exactly:
    ${instructions}
    
    Interview Data:
    ${state.answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join('\n')}
  `;

  try {
    return await callClaude(prompt);
  } catch (error: any) {
    console.error("Claude API Error:", error);
    return "Failed to generate output. Please try again.";
  }
}
