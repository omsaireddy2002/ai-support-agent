import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      // Fake HTTP so tests never hit the real backend.
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Support Desk Agent');
  });

  it('New chat should clear messages and change the session id', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const oldId = app.sessionId();
    app.messages.set([{ role: 'user', text: 'hi' }]);
    app.newChat();
    expect(app.messages()).toEqual([]);
    expect(app.sessionId()).not.toBe(oldId);
  });
});
