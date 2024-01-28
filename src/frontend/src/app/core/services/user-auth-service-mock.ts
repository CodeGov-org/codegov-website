import { UserAuthService } from './user-auth.service';

export type UserAuthServiceMock = jasmine.SpyObj<UserAuthService>;

export function userAuthServiceMockFactory(): UserAuthServiceMock {
  return jasmine.createSpyObj<UserAuthService>('UserAuthService', [
    'login',
    'logout',
  ]);
}
