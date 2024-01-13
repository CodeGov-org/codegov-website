import { ProfileService } from './profile.service';

export type ProfileServiceMock = jasmine.SpyObj<ProfileService>;

export function profileServiceMockFactory(): ProfileServiceMock {
  return jasmine.createSpyObj<ProfileService>('ProfileService', [
    'loadProfile',
    'saveProfile',
  ]);
}
