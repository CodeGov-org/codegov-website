import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map } from 'rxjs';

import {
  GetMyUserProfileResponse,
  ProfileApiService,
  UpdateMyUserProfileRequest,
  UserRole,
} from '~core/api';
import {
  LoadingDialogComponent,
  LoadingDialogInput,
  getLoadingDialogConfig,
} from '~core/ui';
import { ApiError, isNil, isNotNil } from '~core/utils';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly profileApiService = inject(ProfileApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);

  private readonly userProfileSubject =
    new BehaviorSubject<GetMyUserProfileResponse | null>(null);
  public readonly userProfile$ = this.userProfileSubject.asObservable();

  public readonly userRole$ = this.userProfile$.pipe(
    map(profile => (isNil(profile) ? null : profile.role)),
  );

  public readonly isReviewer$ = this.userRole$.pipe(
    map(role => role === UserRole.Reviewer),
  );

  public readonly isAdmin$ = this.userRole$.pipe(
    map(role => role === UserRole.Admin),
  );

  private createProfileMessage: LoadingDialogInput = {
    message: 'Creating new profile...',
  };

  public async loadProfile(): Promise<void> {
    const currentProfile = this.userProfileSubject.getValue();
    if (isNotNil(currentProfile)) {
      return;
    }

    try {
      const res = await this.profileApiService.getMyUserProfile();
      this.userProfileSubject.next(res);
    } catch (error) {
      if (error instanceof ApiError && error.code === 404) {
        const loadingDialog = this.dialog.open(
          LoadingDialogComponent,
          getLoadingDialogConfig(this.createProfileMessage),
        );

        try {
          await this.createProfile();
          this.router.navigate(['profile/edit']);
        } finally {
          loadingDialog.close();
        }

        return;
      }

      throw error;
    }
  }

  public async saveProfile(
    profileUpdate: UpdateMyUserProfileRequest,
  ): Promise<void> {
    const currentProfile = this.userProfileSubject.getValue();
    if (isNil(currentProfile)) {
      throw new Error('User profile not loaded yet');
    }

    await this.profileApiService.updateMyUserProfile(profileUpdate);

    this.userProfileSubject.next(
      mergeProfileUpdate(currentProfile, profileUpdate),
    );
  }

  private async createProfile(): Promise<void> {
    const res = await this.profileApiService.createMyUserProfile();

    this.userProfileSubject.next(res);
  }
}

function mergeProfileUpdate(
  profile: GetMyUserProfileResponse,
  profileUpdate: UpdateMyUserProfileRequest,
): GetMyUserProfileResponse {
  // create a new object reference so Angular will detect the changes
  profile = { ...profile };

  if (
    profile.role === UserRole.Anonymous &&
    profileUpdate.role === UserRole.Anonymous
  ) {
    if (profileUpdate.username) {
      profile.username = profileUpdate.username;
    }
  } else if (
    profile.role === UserRole.Reviewer &&
    profileUpdate.role === UserRole.Reviewer
  ) {
    if (profileUpdate.username) {
      profile.username = profileUpdate.username;
    }
    if (profileUpdate.bio) {
      profile.bio = profileUpdate.bio;
    }
    if (profileUpdate.walletAddress) {
      profile.walletAddress = profileUpdate.walletAddress;
    }
    if (profileUpdate.socialMedia) {
      profile.socialMedia = profileUpdate.socialMedia;
    }
  } else if (
    profile.role === UserRole.Admin &&
    profileUpdate.role === UserRole.Admin
  ) {
    if (profileUpdate.username) {
      profile.username = profileUpdate.username;
    }
    if (profileUpdate.bio) {
      profile.bio = profileUpdate.bio;
    }
  } else {
    throw new Error('Users cannot change their own role');
  }

  return profile;
}
