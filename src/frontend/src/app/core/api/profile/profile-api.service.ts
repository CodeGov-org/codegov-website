import { inject, Injectable } from '@angular/core';

import { BackendActorService } from '../../services';
import { Cachable, handleErr } from '../../utils';
import {
  mapCreateMyUserProfileResponse,
  mapGetMyUserProfileResponse,
  mapListReviewerProfilesResponse,
  mapUpdateMyUserProfileRequest,
} from './profile-api.mapper';
import {
  CreateMyUserProfileResponse,
  GetMyUserProfileResponse,
  UpdateMyUserProfileRequest,
} from './profile-api.model';

export const CURRENT_USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const REVIEWER_CACHE_TTL = 60 * 60 * 1000; // 1 hour

@Injectable({
  providedIn: 'root',
})
export class ProfileApiService {
  private readonly actorService = inject(BackendActorService);

  @Cachable({ ttl: REVIEWER_CACHE_TTL })
  public async listReviewerProfiles(): Promise<GetMyUserProfileResponse[]> {
    const res = await this.actorService.list_reviewer_profiles();
    const okRes = handleErr(res);

    return mapListReviewerProfilesResponse(okRes);
  }

  @Cachable({ ttl: CURRENT_USER_CACHE_TTL })
  public async getMyUserProfile(): Promise<GetMyUserProfileResponse> {
    const res = await this.actorService.get_my_user_profile();
    const okRes = handleErr(res);

    return mapGetMyUserProfileResponse(okRes);
  }

  public async updateMyUserProfile(
    req: UpdateMyUserProfileRequest,
  ): Promise<null> {
    const apiReq = mapUpdateMyUserProfileRequest(req);

    const res = await this.actorService.update_my_user_profile(apiReq);
    const okRes = handleErr(res);

    return okRes;
  }

  public async createMyUserProfile(): Promise<CreateMyUserProfileResponse> {
    const res = await this.actorService.create_my_user_profile();
    const okRes = handleErr(res);

    return mapCreateMyUserProfileResponse(okRes);
  }
}
