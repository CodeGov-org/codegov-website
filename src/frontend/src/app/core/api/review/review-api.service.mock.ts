import { ReviewApiService } from './review-api.service';

export type ReviewApiServiceMock = jasmine.SpyObj<ReviewApiService>;

export function reviewApiServiceMockFactory(): ReviewApiServiceMock {
  return jasmine.createSpyObj<ReviewApiServiceMock>('ReviewApiService', [
    'createProposalReview',
    'updateProposalReview',
    'listProposalReviews',
    'getProposalReview',
    'getMyProposalReview',
    'getOrCreateMyProposalReview',
  ]);
}
