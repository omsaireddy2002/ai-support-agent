// tickets.ts — the tools the AI is allowed to use, now backed by MongoDB.
import { Type, type FunctionDeclaration } from "@google/genai";
import { Ticket } from "./models.js";

// ---- Data shape the AI and the Angular app see ----
// (Same as before: `id`, not Mongo's `ticketId`/`_id`, so nothing else has to change.)
export type Status = "open" | "closed";
export type Priority = "low" | "medium" | "high";

export interface TicketData {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
}

// Turn a database document into the plain shape above.
// Picking only these fields drops _id, __v, createdAt and updatedAt.
function toTicket(doc: { ticketId: number; title: string; status: string; priority: string }): TicketData {
  return {
    id: doc.ticketId,
    title: doc.title,
    status: doc.status as Status,
    priority: doc.priority as Priority,
  };
}

// ---- Starter data, inserted only when the collection is empty ----
const STARTER_TICKETS = [
  { ticketId: 1, title: "Login page is slow", status: "open", priority: "high" },
  { ticketId: 2, title: "Typo on pricing page", status: "open", priority: "low" },
  { ticketId: 3, title: "Payment fails for some cards", status: "open", priority: "high" },
  { ticketId: 4, title: "Add dark mode", status: "closed", priority: "medium" },
];

export async function seedTickets() {
  const count = await Ticket.countDocuments();
  if (count === 0) {
    await Ticket.insertMany(STARTER_TICKETS);
    console.log("Inserted 4 starter tickets");
  }
}

/** All tickets, sorted by id. Used by GET /api/tickets. */
export async function listTickets(): Promise<TicketData[]> {
  // .lean() returns plain JS objects instead of full Mongoose documents (faster, simpler).
  const docs = await Ticket.find().sort({ ticketId: 1 }).lean();
  return docs.map(toTicket);
}

// ---- Tool functions ----
// Each tool takes one "args" object (that's how Gemini sends arguments),
// talks to the database, and returns a plain object for the model.
// Because they return fresh plain objects, results are safe snapshots:
// a later tool can't change a result we already collected.

async function get_tickets(args: { status?: Status }) {
  // No status given -> {} means "match everything".
  const filter = args.status ? { status: args.status } : {};
  const docs = await Ticket.find(filter).sort({ ticketId: 1 }).lean();
  return { tickets: docs.map(toTicket) };
}

async function close_ticket(args: { id: number }) {
  // Find by our number id, set status, and return the UPDATED document.
  const doc = await Ticket.findOneAndUpdate(
    { ticketId: args.id },
    { status: "closed" },
    { returnDocument: "after" }
  ).lean();
  if (!doc) return { error: `Ticket ${args.id} not found` };
  return { ticket: toTicket(doc) };
}

async function create_ticket(args: { title: string; priority: Priority }) {
  // Next id = highest existing id + 1 (or 1 if there are no tickets).
  const last = await Ticket.findOne().sort({ ticketId: -1 }).lean();
  const created = await Ticket.create({
    ticketId: (last?.ticketId ?? 0) + 1,
    title: args.title,
    priority: args.priority, // status defaults to "open" in the schema
  });
  return { ticket: toTicket(created) };
}

async function delete_ticket(args: { id: number }) {
  const doc = await Ticket.findOneAndDelete({ ticketId: args.id }).lean();
  if (!doc) return { error: `Ticket ${args.id} not found` };
  return { deleted: toTicket(doc) };
}

// ---- Tool lookup: name -> function ----
// The agent uses this to run whatever tool the model asks for, by name.
// Every tool is async now, so each one returns a Promise.
// `any` keeps it simple: the model's args arrive as untyped JSON anyway.
export const tools: Record<string, (args: any) => Promise<unknown>> = {
  get_tickets,
  close_ticket,
  create_ticket,
  delete_ticket,
};

// ---- Descriptions the model reads to decide which tool to call ----
export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_tickets",
    description: "List support tickets. Optionally filter by status.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ["open", "closed"], description: "Only return tickets with this status" },
      },
    },
  },
  {
    name: "close_ticket",
    description: "Close a ticket by its id.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.NUMBER, description: "Ticket id" } },
      required: ["id"],
    },
  },
  {
    name: "create_ticket",
    description: "Create a new open ticket.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short summary of the problem" },
        priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
      },
      required: ["title", "priority"],
    },
  },
  {
    name: "delete_ticket",
    description:
      "Permanently delete a ticket by id. Use this ONLY after the user has explicitly confirmed they want this specific ticket deleted.",
    parameters: {
      type: Type.OBJECT,
      properties: { id: { type: Type.NUMBER, description: "Ticket id" } },
      required: ["id"],
    },
  },
];
