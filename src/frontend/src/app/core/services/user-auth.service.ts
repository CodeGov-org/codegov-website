import { Dialog } from '@angular/cdk/dialog';
import { Injectable } from '@angular/core';
import { IcAuthService } from '@hadronous/ic-angular';
import { Observable } from 'rxjs';

import { ProfileService, UserRole } from '~core/state';
import { LoadingDialogComponent } from '~core/ui';
import { LoadingDialogInput, getLoadingDialogConfig } from '~core/ui';
import { extractOkResponse } from '~core/utils';
import { BackendActorService } from './backend-actor.service';

@Injectable({
  providedIn: 'root',
})
export class UserAuthService {
  public readonly isAuthenticated$: Observable<boolean>;

  private loadProfileMessage: LoadingDialogInput = {
    message: 'Logging in...',
  };

  constructor(
    private readonly icAuthService: IcAuthService,
    private readonly profileService: ProfileService,
    private readonly dialog: Dialog,
    private readonly actorService: BackendActorService,
  ) {
    this.isAuthenticated$ = this.icAuthService.isAuthenticated$;
  }

  public async login(): Promise<void> {
    const loadingDialog = this.dialog.open(
      LoadingDialogComponent,
      getLoadingDialogConfig(this.loadProfileMessage),
    );

    try {
      await this.icAuthService.login();
    } finally {
      loadingDialog.close();
    }

    await this.profileService.loadProfile();
  }

  public async logout(): Promise<void> {
    await this.icAuthService.logout();
    window.location.reload();
  }

  public async isLoggedAs(role: UserRole): Promise<boolean> {
    if (!(await this.icAuthService.isAuthenticated())) {
      return false;
    }

    const getResponse = await this.actorService.get_my_user_profile();
    const userConfig = extractOkResponse(getResponse).config;

    switch (role) {
      case UserRole.Reviewer:
        return 'reviewer' in userConfig;
      case UserRole.Admin:
        return 'admin' in userConfig;
      case UserRole.Anonymous:
        return 'anonymous' in userConfig;
    }
  }
}
