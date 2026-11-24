// chat-panel.ts — shows the messages and the input box.
// It doesn't call the API itself: it just tells its parent "send this text".
import { Component, ElementRef, afterRenderEffect, input, output, signal, viewChild } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { ChatMessage } from '../models';

@Component({
  selector: 'app-chat-panel',
  imports: [JsonPipe, FormField],
  templateUrl: './chat-panel.html',
  styleUrl: './chat-panel.css',
})
export class ChatPanel {
  // ---- Inputs from the parent, and one output event back to it ----
  readonly messages = input.required<ChatMessage[]>();
  readonly thinking = input(false);
  readonly error = input('');
  readonly send = output<string>();

  // ---- The message form (Signal Forms) ----
  // The form wraps a plain signal; [formField] in the template keeps the
  // textarea and this signal in sync both ways.
  private readonly draft = signal({ text: '' });
  readonly chatForm = form(this.draft);

  // A reference to the scrolling message list, so we can scroll it.
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  constructor() {
    // After the screen updates with new messages, scroll to the bottom.
    afterRenderEffect(() => {
      this.messages();
      this.thinking();
      const el = this.list().nativeElement;
      el.scrollTop = el.scrollHeight;
    });
  }

  /** Enter sends; Shift+Enter makes a new line. */
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  onSubmit(event: Event) {
    event.preventDefault(); // stop the browser from reloading the page
    this.submit();
  }

  private submit() {
    const text = this.draft().text.trim();
    if (!text || this.thinking()) return; // ignore empty messages or double sends
    this.send.emit(text);
    this.draft.set({ text: '' }); // clear the box
  }
}
