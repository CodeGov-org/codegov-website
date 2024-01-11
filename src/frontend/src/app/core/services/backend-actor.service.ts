import { Injectable } from '@angular/core';
import { createIcActorService } from '@hadronous/ic-angular';
import { idlFactory, _SERVICE } from '@cg/backend';
import { environment } from '@env';

@Injectable({ providedIn: 'root' })
export class BackendActorService extends createIcActorService<_SERVICE>({
  idlFactory,
  canisterId: environment.BACKEND_CANISTER_ID,
}) {}
