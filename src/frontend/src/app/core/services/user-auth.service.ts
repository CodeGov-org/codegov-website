import { Injectable } from '@angular/core';
import { IcAuthService } from '@hadronous/ic-angular';
import { Observable } from 'rxjs';

import { ProfileService } from '~core/state';

@Injectable({
  providedIn: 'root',
})
export class UserAuthService {
  public readonly isAuthenticated$: Observable<boolean>;

  constructor(
    private readonly icAuthService: IcAuthService,
    private readonly profileService: ProfileService,
  ) {
    this.isAuthenticated$ = this.icAuthService.isAuthenticated$;
  }

  public async login(): Promise<void> {
    await this.icAuthService.login();
    await this.profileService.loadProfile();
  }

  public async logout(): Promise<void> {
    await this.icAuthService.logout();
    window.location.reload();
  }
}
