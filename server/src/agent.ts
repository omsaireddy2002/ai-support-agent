// agent.ts — the "agent loop": talk to Gemini, run the tools it asks for, repeat.
import { GoogleGenAI, type Content, type Part } from "@google/genai";
import { tools, functionDeclarations } from "./tickets.js"; // NodeNext needs the .js extension
import { Conversation } from "./models.js";

// The SDK reads the key from the environment; we never print it.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { timeout: 30_000 }, // give up on a request after 30 seconds
});

const MODEL = "gemini-3.5-flash-lite";
const MAX_STEPS = 10; // safety net so a confused model can't loop forever

const SYSTEM_INSTRUCTION = `You are a helpful support-ticket assistant.
- Always use the tools to read or change tickets. Never guess ticket data.
- Always look up tickets first and wait for the results before changing them.
- Before deleting a ticket, ask the user to confirm. Only call delete_ticket after they explicitly say yes.`;

// What we report back about each tool call.
export interface Step {
  tool: string;
  args: unknown;
  result: unknown;
}

export async function runAgent(sessionId: string, message: string) {
  // Load this session's saved history from MongoDB (empty for a new session).
  // We change only this in-memory copy during the turn. If anything fails,
  // nothing is saved, so the database never holds a half-finished turn.
  const saved = await Conversation.findOne({ sessionId }).lean();
  const history = (saved?.contents ?? []) as Content[];
  history.push({ role: "user", parts: [{ text: message }] });

  const steps: Step[] = [];

  for (let i = 0; i < MAX_STEPS; i++) {
    // 1. Ask the model what to do next, given everything so far.
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations }],
      },
    });

    // 2. Save the model's answer into the history (text and/or tool calls).
    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) history.push(modelContent);

    // 3. No tool calls? The model is done -> save history and return its text.
    const calls = response.functionCalls ?? [];
    if (calls.length === 0) {
      // Upsert = update the session's document, or create it if it doesn't exist yet.
      await Conversation.updateOne({ sessionId }, { contents: history }, { upsert: true });
      return { reply: response.text ?? "", steps };
    }

    // 4. Run every tool the model asked for, ONE AT A TIME, in order.
    // `await` inside a for...of loop waits for each tool to finish before
    // starting the next, so e.g. "get" always runs before "close" in a batch.
    // (Promise.all would run them in parallel, and their order would be unpredictable.)
    const resultParts: Part[] = [];
    for (const call of calls) {
      const name = call.name ?? "";
      const tool = tools[name];
      // Tools return fresh plain objects from the database, so each result is
      // already a safe snapshot (no structuredClone needed any more).
      const result = tool ? await tool(call.args ?? {}) : { error: `Unknown tool: ${name}` };
      steps.push({ tool: name, args: call.args, result });

      resultParts.push({
        functionResponse: {
          id: call.id, // links this result to the exact call that asked for it
          name,
          response: { result },
        },
      });
    }

    // 5. Send the results back as the next "user" message, then loop again.
    history.push({ role: "user", parts: resultParts });
  }

  // Too many steps: treat as a failure, so history is NOT saved.
  throw new Error(`Agent stopped after ${MAX_STEPS} steps without a final answer`);
}
