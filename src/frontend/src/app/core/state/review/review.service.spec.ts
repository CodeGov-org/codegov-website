import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(() => {
    service = new ReviewService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
