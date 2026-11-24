// tickets.ts — our fake "database" plus the tools the AI is allowed to use.
import { Type, type FunctionDeclaration } from "@google/genai";

// ---- Data shape ----
export type Status = "open" | "closed";
export type Priority = "low" | "medium" | "high";

export interface Ticket {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
}

// ---- In-memory data (resets every time the server restarts) ----
export const tickets: Ticket[] = [
  { id: 1, title: "Login page is slow", status: "open", priority: "high" },
  { id: 2, title: "Typo on pricing page", status: "open", priority: "low" },
  { id: 3, title: "Payment fails for some cards", status: "open", priority: "high" },
  { id: 4, title: "Add dark mode", status: "closed", priority: "medium" },
];

let nextId = 5; // id for the next ticket we create

// ---- Tool functions ----
// Each tool takes one "args" object (that's how Gemini sends arguments)
// and returns a plain object that we send back to the model.

function get_tickets(args: { status?: Status }) {
  // No status given -> return everything.
  const list = args.status ? tickets.filter((t) => t.status === args.status) : tickets;
  return { tickets: list };
}

function close_ticket(args: { id: number }) {
  const ticket = tickets.find((t) => t.id === args.id);
  if (!ticket) return { error: `Ticket ${args.id} not found` };
  ticket.status = "closed";
  return { ticket };
}

function create_ticket(args: { title: string; priority: Priority }) {
  const ticket: Ticket = { id: nextId++, title: args.title, status: "open", priority: args.priority };
  tickets.push(ticket);
  return { ticket };
}

function delete_ticket(args: { id: number }) {
  const index = tickets.findIndex((t) => t.id === args.id);
  if (index === -1) return { error: `Ticket ${args.id} not found` };
  const [removed] = tickets.splice(index, 1);
  return { deleted: removed };
}

// ---- Tool lookup: name -> function ----
// The agent uses this to run whatever tool the model asks for, by name.
// `any` keeps it simple: the model's args arrive as untyped JSON anyway.
export const tools: Record<string, (args: any) => unknown> = {
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
