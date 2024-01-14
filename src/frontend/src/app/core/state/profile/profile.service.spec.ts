import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;

  beforeEach(() => {
    service = new ProfileService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
