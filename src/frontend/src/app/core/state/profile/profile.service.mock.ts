import { ProfileService } from './profile.service';

export type ProfileServiceMock = jasmine.SpyObj<ProfileService>;

export function profileServiceMockFactory(): ProfileServiceMock {
  return jasmine.createSpyObj<ProfileServiceMock>('ProfileService', [
    'loadReviewerProfiles',
    'loadCurrentUserProfile',
    'updateCurrentUserProfile',
  ]);
}
