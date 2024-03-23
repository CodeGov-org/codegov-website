import { Injectable } from '@angular/core';
import { createIcActorService } from '@hadronous/ic-angular';

import { _SERVICE, idlFactory } from '@cg/backend';
import { ENV } from '~env';

@Injectable({ providedIn: 'root' })
export class BackendActorService extends createIcActorService<_SERVICE>({
  idlFactory,
  canisterId: ENV.CANISTER_ID_BACKEND,
}) {}
