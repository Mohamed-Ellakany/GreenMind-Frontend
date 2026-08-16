import { registerLocaleData } from '@angular/common';
import localeArEgypt from '@angular/common/locales/ar-EG';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideToastr } from 'ngx-toastr';
import { authInterceptor } from '@core/auth/auth.interceptor';

import { routes } from './app.routes';

registerLocaleData(localeArEgypt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'top',
      }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'ar-EG' },
    provideToastr({
      closeButton: true,
      newestOnTop: true,
      positionClass: 'toast-top-left',
      preventDuplicates: true,
      progressBar: true,
      timeOut: 3200,
    }),
  ]
};
