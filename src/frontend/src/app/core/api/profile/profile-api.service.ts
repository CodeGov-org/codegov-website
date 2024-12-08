import { inject, Injectable } from '@angular/core';

import { BackendActorService } from '../../services';
import { handleErr } from '../../utils';
import {
  mapGetMyUserProfileResponse,
  mapUpdateMyUserProfileRequest,
} from './profile-api.mapper';
import {
  GetMyUserProfileResponse,
  UpdateMyUserProfileRequest,
} from './profile-api.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileApiService {
  private readonly actorService = inject(BackendActorService);

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

  public async createMyUserProfile(): Promise<GetMyUserProfileResponse> {
    const res = await this.actorService.create_my_user_profile();
    const okRes = handleErr(res);

    return mapGetMyUserProfileResponse(okRes);
  }
}
