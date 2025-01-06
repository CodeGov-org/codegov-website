import { ReviewService } from './review.service';

export type ReviewServiceMock = jasmine.SpyObj<ReviewService>;

export function reviewServiceMockFactory(): ReviewServiceMock {
  return jasmine.createSpyObj<ReviewServiceMock>('ReviewService', [
    'loadReviewsByProposalId',
    'loadReviewsByReviewerId',
    'loadReview',
  ]);
}
