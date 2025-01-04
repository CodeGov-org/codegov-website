import { Dialog } from '@angular/cdk/dialog';
import { Injectable } from '@angular/core';
import { IcAuthService } from '@hadronous/ic-angular';
import { Observable } from 'rxjs';

import { ProfileService } from '~core/state';
import { LoadingDialogComponent } from '~core/ui';
import { LoadingDialogInput, getLoadingDialogConfig } from '~core/ui';

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

    await this.profileService.loadCurrentUserProfile();
  }

  public async logout(): Promise<void> {
    await this.icAuthService.logout();
    window.location.reload();
  }
}
