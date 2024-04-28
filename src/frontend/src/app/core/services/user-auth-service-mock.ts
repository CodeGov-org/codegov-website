import { UserAuthService } from './user-auth.service';

export type UserAuthServiceMock = jasmine.SpyObj<UserAuthService>;

export function userAuthServiceMockFactory(): UserAuthServiceMock {
  return jasmine.createSpyObj<UserAuthServiceMock>('UserAuthService', [
    'login',
    'logout',
  ]);
}
