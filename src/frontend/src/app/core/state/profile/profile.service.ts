import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map } from 'rxjs';

import {
  CreateMyUserProfileResponse,
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
import { ApiError, isNil } from '~core/utils';

const createProfileDialogInput: LoadingDialogInput = {
  message: 'Creating new profile...',
};

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly profileApiService = inject(ProfileApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);

  private readonly reviewerProfilesSubject = new BehaviorSubject<
    Record<string, GetMyUserProfileResponse>
  >({});
  public readonly reviewerProfiles$ =
    this.reviewerProfilesSubject.asObservable();

  private readonly userProfileSubject =
    new BehaviorSubject<GetMyUserProfileResponse | null>(null);
  public readonly currentUserProfile$ = this.userProfileSubject.asObservable();

  private readonly currentUserRole$ = this.currentUserProfile$.pipe(
    map(profile => profile?.role ?? null),
  );
  public readonly isCurrentUserReviewer$ = this.currentUserRole$.pipe(
    map(role => role === UserRole.Reviewer),
  );
  public readonly isCurrentUserAdmin$ = this.currentUserRole$.pipe(
    map(role => role === UserRole.Admin),
  );

  public async loadReviewerProfiles(): Promise<void> {
    const profiles = await this.profileApiService.listReviewerProfiles();
    const profilesMap = profiles.reduce<
      Record<string, GetMyUserProfileResponse>
    >(
      (accum, profile) => ({
        ...accum,
        [profile.id]: profile,
      }),
      {},
    );

    this.reviewerProfilesSubject.next(profilesMap);
  }

  public async loadCurrentUserProfile(): Promise<void> {
    try {
      await this.getCurrentUserProfile();
    } catch (error) {
      if (error instanceof ApiError && error.code === 404) {
        const loadingDialog = this.dialog.open(
          LoadingDialogComponent,
          getLoadingDialogConfig(createProfileDialogInput),
        );

        try {
          await this.createCurrentUserProfile();
          this.router.navigate(['profile/edit']);
        } finally {
          loadingDialog.close();
        }
      } else {
        throw error;
      }
    }
  }

  public async updateCurrentUserProfile(
    req: UpdateMyUserProfileRequest,
  ): Promise<void> {
    const currentProfile = this.userProfileSubject.getValue();
    if (isNil(currentProfile)) {
      throw new Error('User profile not loaded yet');
    }

    await this.profileApiService.updateMyUserProfile(req);

    this.userProfileSubject.next(mergeProfileUpdate(currentProfile, req));
  }

  private async getCurrentUserProfile(): Promise<GetMyUserProfileResponse> {
    const res = await this.profileApiService.getMyUserProfile();
    this.userProfileSubject.next(res);

    return res;
  }

  private async createCurrentUserProfile(): Promise<CreateMyUserProfileResponse> {
    const res = await this.profileApiService.createMyUserProfile();
    this.userProfileSubject.next(res);

    return res;
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
