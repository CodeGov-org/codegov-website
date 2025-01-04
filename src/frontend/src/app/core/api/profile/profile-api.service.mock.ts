import { ProfileApiService } from './profile-api.service';

export type ProfileApiServiceMock = jasmine.SpyObj<ProfileApiService>;

export function profileApiServiceMockFactory(): ProfileApiServiceMock {
  return jasmine.createSpyObj<ProfileApiServiceMock>('ProfileApiService', [
    'listReviewerProfiles',
    'getMyUserProfile',
    'updateMyUserProfile',
    'createMyUserProfile',
  ]);
}
