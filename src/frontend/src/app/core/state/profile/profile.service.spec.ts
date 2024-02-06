import { backendActorServiceMockFactory } from '~core/services/backend-actor-service-mock';
import { dialogMockFactory, routerMockFactory } from '~testing';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  const backendActorServiceMock = backendActorServiceMockFactory();
  const routerMock = routerMockFactory();
  const dialogMock = dialogMockFactory();

  beforeEach(() => {
    service = new ProfileService(
      backendActorServiceMock,
      routerMock,
      dialogMock,
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
