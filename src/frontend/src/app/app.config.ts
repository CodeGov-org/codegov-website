import { type ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  InMemoryScrollingFeature,
  InMemoryScrollingOptions,
  provideRouter,
  withInMemoryScrolling,
} from '@angular/router';
import { provideIcAgent, provideIcAuth } from '@hadronous/ic-angular';

import { BackendActorService } from '~core/services';
import { ENV } from '~env';
import { ROUTES } from './app.routes';

const scrollConfig: InMemoryScrollingOptions = {
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled',
};

const inMemoryScrollingFeature: InMemoryScrollingFeature =
  withInMemoryScrolling(scrollConfig);

export const APP_CONFIG: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(ROUTES, inMemoryScrollingFeature),
    provideIcAgent({
      apiGateway: ENV.API_GATEWAY,
      fetchRootKey: !ENV.IS_MAINNET,
    }),
    provideIcAuth({
      identityProvider: ENV.IDENTITY_PROVIDER,
      derivationOrigin: ENV.DERIVATION_ORIGIN,
    }),
    BackendActorService,
  ],
};
