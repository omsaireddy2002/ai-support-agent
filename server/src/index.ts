// index.ts — the web server. Must load .env FIRST so GEMINI_API_KEY exists
// before agent.ts creates the Gemini client.
import "dotenv/config";
import express from "express";
import cors from "cors";
import { runAgent } from "./agent.js";
import { tickets } from "./tickets.js";

const app = express();

app.use(cors({ origin: "http://localhost:4200" })); // allow the Angular dev app
app.use(express.json()); // parse JSON request bodies into req.body

// Chat with the agent: { sessionId, message } -> { reply, steps }
app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body ?? {};

  // Basic validation: both must be non-empty strings.
  if (typeof sessionId !== "string" || !sessionId.trim() || typeof message !== "string" || !message.trim()) {
    res.status(400).json({ error: "sessionId and message are required" });
    return;
  }

  try {
    const result = await runAgent(sessionId, message);
    res.json(result);
  } catch (err) {
    // Log details for us; give the client a generic message.
    console.error("Agent error:", err);
    res.status(502).json({ error: "The AI service failed. Please try again." });
  }
});

// See the current tickets (handy for checking what the agent did).
app.get("/api/tickets", (_req, res) => {
  res.json(tickets);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
