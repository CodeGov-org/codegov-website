import { ReviewSubmissionService } from './review-submission.service';

export type ReviewSubmissionServiceMock =
  jasmine.SpyObj<ReviewSubmissionService>;

export function reviewSubmissionServiceMockFactory(): ReviewSubmissionServiceMock {
  return jasmine.createSpyObj<ReviewSubmissionServiceMock>(
    'ReviewSubmissionService',
    [
      'addCommit',
      'loadOrCreateReview',
      'removeCommit',
      'updateCommit',
      'updateReview',
    ],
  );
}
