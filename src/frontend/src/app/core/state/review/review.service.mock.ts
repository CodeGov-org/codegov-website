import { ReviewService } from './review.service';

export type ReviewServiceMock = jasmine.SpyObj<ReviewService>;

export function reviewServiceMockFactory(): ReviewServiceMock {
  return jasmine.createSpyObj<ReviewServiceMock>('ReviewService', [
    'loadReviewListByProposalId',
    'loadReviewListByReviewerId',
    'loadReview',
  ]);
}
