import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { BackendActorService } from '~core/services';
import { isErr, isOk } from '~core/utils';
import {
  mapProfileResponse,
  mapUpdateProfileRequest,
  mergeProfileUpdate,
} from './profile.mapper';
import { Profile, ProfileUpdate } from './profile.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private userProfileSubject = new BehaviorSubject<Profile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  constructor(
    private readonly actorService: BackendActorService,
    private readonly router: Router,
  ) {}

  public async loadProfile(): Promise<void> {
    const getResponse = await this.actorService.get_my_user_profile();

    if (isOk(getResponse)) {
      this.userProfileSubject.next(mapProfileResponse(getResponse.ok));
      return;
    }

    if (getResponse.err.code !== 404) {
      throw new Error(`${getResponse.err.code}: ${getResponse.err.message}`);
    }

    await this.createProfile();

    this.router.navigate(['profile/edit']);
  }

  public async saveProfile(profileUpdate: ProfileUpdate): Promise<void> {
    const currentProfile = this.userProfileSubject.getValue();
    if (!currentProfile) {
      throw new Error('User profile not loaded yet');
    }

    const updateResponse = await this.actorService.update_my_user_profile(
      mapUpdateProfileRequest(profileUpdate),
    );

    if (isErr(updateResponse)) {
      throw new Error(
        `${updateResponse.err.code}: ${updateResponse.err.message}`,
      );
    }

    this.userProfileSubject.next(
      mergeProfileUpdate(currentProfile, profileUpdate),
    );
  }

  private async createProfile(): Promise<void> {
    const createResponse = await this.actorService.create_my_user_profile();
    if (isErr(createResponse)) {
      throw new Error(
        `${createResponse.err.code}: ${createResponse.err.message}`,
      );
    }

    this.userProfileSubject.next(mapProfileResponse(createResponse.ok));
  }
}
