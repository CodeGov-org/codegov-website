import { profileServiceMockFactory } from '~core/state/profile/profile.service.mock';
import { icAuthServiceMockFactory } from '~testing';
import { UserAuthService } from './user-auth.service';

describe('UserAuthService', () => {
  let service: UserAuthService;
  const icAuthServiceMock = icAuthServiceMockFactory();
  const profileServiceMock = profileServiceMockFactory();

  beforeEach(() => {
    service = new UserAuthService(icAuthServiceMock, profileServiceMock);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
