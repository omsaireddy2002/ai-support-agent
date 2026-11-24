// app.ts — the root component. It owns the app's state (session, messages,
// tickets) and passes it down to two "display" components.
import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ChatApi } from './chat-api';
import { ChatMessage, Ticket } from './models';
import { ChatPanel } from './chat-panel/chat-panel';
import { TicketsPanel } from './tickets-panel/tickets-panel';

@Component({
  selector: 'app-root',
  imports: [ChatPanel, TicketsPanel],
  template: `
    <header class="top-bar">
      <h1>Support Desk Agent</h1>
      <button type="button" class="secondary" (click)="newChat()">New chat</button>
    </header>

    <main class="layout">
      <app-chat-panel
        [messages]="messages()"
        [thinking]="thinking()"
        [error]="error()"
        (send)="send($event)"
      />
      <app-tickets-panel [tickets]="tickets()" [error]="ticketsError()" />
    </main>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100dvh; }
    .top-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); background: var(--surface);
    }
    h1 { font-size: 1.15rem; margin: 0; }
    /* Desktop: chat on the left, tickets on the right. */
    .layout {
      flex: 1; min-height: 0; display: grid; gap: 1rem; padding: 1rem;
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    }
    /* Mobile: stack them, chat first. The page scrolls instead. */
    @media (max-width: 800px) {
      :host { height: auto; min-height: 100dvh; }
      .layout { grid-template-columns: minmax(0, 1fr); padding: 0.5rem; }
    }
  `,
})
export class App {
  private readonly api = inject(ChatApi);

  // ---- State (signals: when they change, the screen updates automatically) ----
  readonly sessionId = signal(crypto.randomUUID()); // new id each time the app loads
  readonly messages = signal<ChatMessage[]>([]);
  readonly thinking = signal(false);
  readonly error = signal('');
  readonly tickets = signal<Ticket[]>([]);
  readonly ticketsError = signal('');

  constructor() {
    this.loadTickets(); // show tickets right away
  }

  /** Called when the chat panel emits a message. */
  send(text: string) {
    const sessionId = this.sessionId(); // remember which chat this belongs to
    this.messages.update((list) => [...list, { role: 'user', text }]);
    this.error.set('');
    this.thinking.set(true);

    this.api.sendMessage(sessionId, text).subscribe({
      next: (res) => {
        // If the user clicked "New chat" while we waited, drop this old answer.
        if (sessionId !== this.sessionId()) return;
        this.messages.update((list) => [...list, { role: 'agent', text: res.reply, steps: res.steps }]);
        this.thinking.set(false);
        this.loadTickets(); // the agent may have changed tickets
      },
      error: (err: HttpErrorResponse) => {
        if (sessionId !== this.sessionId()) return;
        this.thinking.set(false);
        this.error.set(friendlyError(err));
      },
    });
  }

  /** Start over: new session id, empty chat. */
  newChat() {
    this.sessionId.set(crypto.randomUUID());
    this.messages.set([]);
    this.error.set('');
    this.thinking.set(false);
  }

  loadTickets() {
    this.api.getTickets().subscribe({
      next: (list) => {
        this.tickets.set(list);
        this.ticketsError.set('');
      },
      error: (err: HttpErrorResponse) => this.ticketsError.set(friendlyError(err)),
    });
  }
}

/** Turn an HTTP error into a message a human can understand. */
function friendlyError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return "Can't reach the server. Is the backend running on port 3000?";
  }
  return 'Sorry, the agent could not answer right now. Please try again.';
}
