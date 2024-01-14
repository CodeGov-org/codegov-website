/* eslint-disable import/order */

// [TODO] - remove this when cbor library is replaced in agent-js
import getGlobalThis from 'globalthis/polyfill';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = getGlobalThis();

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { APP_CONFIG } from './app/app.config';

bootstrapApplication(AppComponent, APP_CONFIG).catch(err => {
  console.error(err);
});
