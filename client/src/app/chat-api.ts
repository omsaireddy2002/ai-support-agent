// chat-api.ts — the ONLY place that talks to the backend.
// Components ask this service for data instead of calling HttpClient directly.
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatResponse, Ticket } from './models';

const API_URL = 'http://localhost:3000/api';

@Service() // one shared instance for the whole app
export class ChatApi {
  private readonly http = inject(HttpClient);

  /** Send a message to the agent. Returns an Observable (a value that arrives later). */
  sendMessage(sessionId: string, message: string) {
    return this.http.post<ChatResponse>(`${API_URL}/chat`, { sessionId, message });
  }

  /** Get the current list of tickets. */
  getTickets() {
    return this.http.get<Ticket[]>(`${API_URL}/tickets`);
  }
}
