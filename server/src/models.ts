// models.ts — Mongoose models: they describe what a document looks like
// and give us methods like Ticket.find() to query the collection.
import mongoose from "mongoose";

// ---- Ticket ----
const ticketSchema = new mongoose.Schema(
  {
    // Our own small number id (1, 2, 3…). The AI and the UI use this, not Mongo's _id.
    // unique: true also creates an index, so lookups by ticketId are fast.
    ticketId: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    priority: { type: String, enum: ["low", "medium", "high"], required: true },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

export const Ticket = mongoose.model("Ticket", ticketSchema); // collection: "tickets"

// ---- Conversation (one per chat session) ----
const conversationSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    // The Gemini history, stored exactly as the SDK gives it to us.
    // Mixed = "any shape", because Gemini messages have many different forms.
    contents: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  {
    timestamps: true,
    // By default Mongoose deletes empty objects like `args: {}` when saving.
    // We want the history saved exactly as it was, so turn that off.
    minimize: false,
  }
);

export const Conversation = mongoose.model("Conversation", conversationSchema); // collection: "conversations"
