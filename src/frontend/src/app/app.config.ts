import { type ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideIcAgent, provideIcAuth } from '@hadronous/ic-angular';
import { environment } from '@env';
import { routes } from './app.routes';
import { BackendActorService } from '@core/services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideIcAgent({
      apiGateway: environment.API_GATEWAY,
      fetchRootKey: !environment.IS_MAINNET,
    }),
    provideIcAuth({
      identityProvider: environment.IDENTITY_PROVIDER,
      derivationOrigin: environment.DERIVATION_ORIGIN,
    }),
    BackendActorService,
  ],
};
