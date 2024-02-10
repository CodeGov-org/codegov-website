import { profileServiceMockFactory } from '~core/state/profile/profile.service.mock';
import { icAuthServiceMockFactory, dialogMockFactory } from '~testing';
import { UserAuthService } from './user-auth.service';

describe('UserAuthService', () => {
  let service: UserAuthService;
  const icAuthServiceMock = icAuthServiceMockFactory();
  const profileServiceMock = profileServiceMockFactory();
  const dialogMock = dialogMockFactory();

  beforeEach(() => {
    service = new UserAuthService(
      icAuthServiceMock,
      profileServiceMock,
      dialogMock,
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
