import { CommitReviewApiService } from './commit-review-api.service';

export type CommitReviewApiServiceMock = jasmine.SpyObj<CommitReviewApiService>;

export function CommitReviewApiServiceMockFactory(): CommitReviewApiServiceMock {
  return jasmine.createSpyObj<CommitReviewApiServiceMock>(
    'CommitReviewApiService',
    [
      'createProposalCommitReview',
      'updateProposalReviewCommit',
      'deleteProposalReviewCommit',
    ],
  );
}
