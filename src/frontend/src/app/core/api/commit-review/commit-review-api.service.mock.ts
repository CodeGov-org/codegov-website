import { CommitReviewApiService } from './commit-review-api.service';

export type CommitReviewApiServiceMock = jasmine.SpyObj<CommitReviewApiService>;

export function commitReviewApiServiceMockFactory(): CommitReviewApiServiceMock {
  return jasmine.createSpyObj<CommitReviewApiServiceMock>(
    'CommitReviewApiService',
    [
      'createProposalCommitReview',
      'deleteProposalReviewCommit',
      'updateProposalReviewCommit',
    ],
  );
}
