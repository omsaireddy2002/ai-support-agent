// models.ts — the shapes of the data our app works with.
// They match what the backend sends, so TypeScript can catch typos for us.

export type TicketStatus = 'open' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Ticket {
  id: number;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
}

/** One tool call the agent made while answering (e.g. close_ticket). */
export interface ToolStep {
  tool: string;
  args: unknown; // unknown = "could be anything"; we only display it as JSON
  result: unknown;
}

/** What POST /api/chat returns. */
export interface ChatResponse {
  reply: string;
  steps: ToolStep[];
}

/** One bubble in the chat. Agent messages also carry their tool steps. */
export interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
  steps?: ToolStep[];
}
