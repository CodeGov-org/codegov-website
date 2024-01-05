// [TODO] - remove this when cbor library is replaced in agent-js
import getGlobalThis from 'globalthis/polyfill';
(window as any).global = getGlobalThis();

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch(err => {
  console.error(err);
});
