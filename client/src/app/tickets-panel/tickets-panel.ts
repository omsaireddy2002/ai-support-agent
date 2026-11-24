// tickets-panel.ts — a simple table of tickets. It only displays what it's given.
import { Component, input } from '@angular/core';
import { Ticket } from '../models';

@Component({
  selector: 'app-tickets-panel',
  template: `
    <section class="panel" aria-labelledby="tickets-heading">
      <h2 id="tickets-heading">Tickets</h2>

      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }

      <div class="table-wrap">
        <table>
          <thead>
            <tr><th scope="col">#</th><th scope="col">Title</th><th scope="col">Status</th><th scope="col">Priority</th></tr>
          </thead>
          <tbody>
            @for (t of tickets(); track t.id) {
              <tr>
                <td>{{ t.id }}</td>
                <td>{{ t.title }}</td>
                <!-- class binding picks a colour based on the value -->
                <td><span class="badge" [class]="t.status">{{ t.status }}</span></td>
                <td><span class="badge" [class]="t.priority">{{ t.priority }}</span></td>
              </tr>
            } @empty {
              <tr><td colspan="4" class="empty">No tickets</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; min-height: 0; }
    section { padding: 1rem; overflow: auto; max-height: 100%; }
    h2 { font-size: 1rem; margin: 0 0 0.75rem; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { text-align: left; padding: 0.45rem 0.4rem; border-bottom: 1px solid var(--border); }
    th { color: var(--muted-text); font-weight: 600; }
    .empty { text-align: center; color: var(--muted-text); }
    .badge { padding: 0.1rem 0.5rem; border-radius: 999px; font-size: 0.75rem; white-space: nowrap; }
    .open { background: var(--ok-bg); color: var(--ok-text); }
    .closed { background: var(--muted-bg); color: var(--muted-text); }
    .high { background: var(--error-bg); color: var(--error-text); }
    .medium { background: var(--warn-bg); color: var(--warn-text); }
    .low { background: var(--info-bg); color: var(--info-text); }
    .error { padding: 0.5rem; border-radius: 8px; background: var(--error-bg); color: var(--error-text); }
  `,
})
export class TicketsPanel {
  readonly tickets = input.required<Ticket[]>();
  readonly error = input('');
}
