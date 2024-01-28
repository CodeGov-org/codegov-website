import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IcAuthService } from '@hadronous/ic-angular';
import { Observable } from 'rxjs';

import { isErr, isOk } from '~core/utils';
import { BackendActorService } from './backend-actor.service';

@Injectable({
  providedIn: 'root',
})
export class UserAuthService {
  public readonly isAuthenticated$: Observable<boolean>;

  constructor(
    private readonly icAuthService: IcAuthService,
    private readonly actorService: BackendActorService,
    private readonly router: Router,
  ) {
    this.isAuthenticated$ = this.icAuthService.isAuthenticated$;
  }

  public async login(): Promise<void> {
    await this.icAuthService.login();

    const getResponse = await this.actorService.get_my_user_profile();
    if (isOk(getResponse)) {
      return;
    }
    if (getResponse.err.code !== 404) {
      throw new Error(`${getResponse.err.code}: ${getResponse.err.message}`);
    }

    const createResponse = await this.actorService.create_my_user_profile();
    if (isErr(createResponse)) {
      throw new Error(
        `${createResponse.err.code}: ${createResponse.err.message}`,
      );
    }

    this.router.navigate(['profile/edit']);
  }

  public async logout(): Promise<void> {
    await this.icAuthService.logout();
    window.location.reload();
  }
}
