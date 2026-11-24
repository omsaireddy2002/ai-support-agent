import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Makes HttpClient available to inject(). withFetch uses the browser's fetch API.
    provideHttpClient(withFetch()),
  ],
};
