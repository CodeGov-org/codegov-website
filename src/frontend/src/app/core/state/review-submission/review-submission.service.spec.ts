import { TestBed } from '@angular/core/testing';

import {
  CommitReviewApiServiceMock,
  commitReviewApiServiceMockFactory,
} from '../../api/commit-review/commit-review-api.service.mock';
import {
  ReviewApiServiceMock,
  reviewApiServiceMockFactory,
} from '../../api/review/review-api.service.mock';
import {
  CommitReviewApiService,
  GetProposalReviewCommitResponse,
  GetProposalReviewResponse,
  ProposalReviewStatus,
  ReviewApiService,
} from '~core/api';
import { ApiError } from '~core/utils';
import {
  ReviewSubmissionService,
  UiProposalReviewCommit,
} from './review-submission.service';

describe('ReviewSubmissionService', () => {
  let service: ReviewSubmissionService;

  let reviewApiServiceMock: ReviewApiServiceMock;
  let commitReviewApiServiceMock: CommitReviewApiServiceMock;

  const currentDate = new Date();

  const proposalId = 'e4e6247e-fda4-4678-8590-2cf86b876c92';
  const userId = 'a36bc00d-3ead-4dd1-9115-6b68fce1783c';
  const commitSha = '96f4ab3090ad72964319346967f4ce9634df200e';

  beforeEach(() => {
    jasmine.clock().install().mockDate(currentDate);

    reviewApiServiceMock = reviewApiServiceMockFactory();
    commitReviewApiServiceMock = commitReviewApiServiceMockFactory();

    TestBed.configureTestingModule({
      providers: [
        { provide: ReviewApiService, useValue: reviewApiServiceMock },
        {
          provide: CommitReviewApiService,
          useValue: commitReviewApiServiceMock,
        },
      ],
    });

    service = TestBed.inject(ReviewSubmissionService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadOrCreateReview()', () => {
    it('should load or create a review', async () => {
      const reviewSpy = jasmine.createSpy();
      service.review$.subscribe(reviewSpy);

      const commitsSpy = jasmine.createSpy();
      service.commits$.subscribe(commitsSpy);

      const proposalReviewResponse = createProposalReviewResponse(
        proposalId,
        userId,
      );
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);

      expect(reviewSpy).toHaveBeenCalledTimes(2);
      expect(reviewSpy).toHaveBeenCalledWith(null);
      expect(reviewSpy).toHaveBeenCalledWith(proposalReviewResponse);

      expect(commitsSpy).toHaveBeenCalledTimes(2);
      expect(commitsSpy).toHaveBeenCalledWith(null);
      expect(commitsSpy).toHaveBeenCalledWith([]);
    });

    it('should throw an error if loading or creating the review fails', async () => {
      const reviewSpy = jasmine.createSpy();
      service.review$.subscribe(reviewSpy);

      const commitsSpy = jasmine.createSpy();
      service.commits$.subscribe(commitsSpy);

      const error = new ApiError({
        code: 500,
        message: 'Internal server error',
      });

      reviewApiServiceMock.getOrCreateMyProposalReview.and.rejectWith(error);

      await expectAsync(
        service.loadOrCreateReview(proposalId),
      ).toBeRejectedWith(error);

      expect(reviewSpy).toHaveBeenCalledTimes(1);
      expect(reviewSpy).toHaveBeenCalledWith(null);

      expect(commitsSpy).toHaveBeenCalledTimes(1);
      expect(commitsSpy).toHaveBeenCalledWith(null);
    });
  });

  describe('addCommit()', () => {
    it('should add a commit to the review', async () => {
      const commitsSpy = jasmine.createSpy();
      service.commits$.subscribe(commitsSpy);

      const proposalReviewResponse = createProposalReviewResponse(
        proposalId,
        userId,
      );
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);
      service.addCommit();

      expect(commitsSpy).toHaveBeenCalledTimes(3);
      expect(commitsSpy).toHaveBeenCalledWith(null);
      expect(commitsSpy).toHaveBeenCalledWith([]);
      expect(commitsSpy).toHaveBeenCalledWith([
        createUiProposalReviewCommit({ uiId: '0' }),
      ]);
    });

    it('should add subsequent commits to the review', async () => {
      const subsequentDate = new Date(currentDate);
      subsequentDate.setMilliseconds(currentDate.getMilliseconds() + 1_000);

      const commitsSpy = jasmine.createSpy();
      service.commits$.subscribe(commitsSpy);

      const proposalReviewResponse = createProposalReviewResponse(
        proposalId,
        userId,
      );
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);
      service.addCommit();

      const createdCommit = createProposalReviewCommitResponse({
        proposalReviewId: proposalId,
        createdAt: currentDate,
        commitSha,
        userId,
      });
      commitReviewApiServiceMock.createProposalCommitReview.and.resolveTo({
        ...createdCommit,
        id: '0',
      });
      commitReviewApiServiceMock.updateProposalReviewCommit.and.resolveTo(null);
      await service.updateCommit(null, commitSha, { reviewed: false });

      jasmine.clock().mockDate(subsequentDate);
      service.addCommit();

      expect(commitsSpy).toHaveBeenCalledTimes(5);
      expect(commitsSpy).toHaveBeenCalledWith(null);
      expect(commitsSpy).toHaveBeenCalledWith([]);
      expect(commitsSpy).toHaveBeenCalledWith([
        createUiProposalReviewCommit({ uiId: '0' }),
      ]);
      expect(commitsSpy).toHaveBeenCalledWith([
        createUiProposalReviewCommit({
          apiId: '0',
          uiId: '0',
          commit: {
            commitSha,
            details: {
              reviewed: false,
            },
          },
        }),
      ]);
      expect(commitsSpy).toHaveBeenCalledWith([
        createUiProposalReviewCommit({
          apiId: '0',
          uiId: '0',
          commit: {
            commitSha,
            details: {
              reviewed: false,
            },
          },
        }),
        createUiProposalReviewCommit({ uiId: '1' }),
      ]);
    });

    it('should throw an error if the proposal review already has an empty commit', async () => {
      const commitsSpy = jasmine.createSpy();
      service.commits$.subscribe(commitsSpy);

      const proposalReviewResponse = createProposalReviewResponse(
        proposalId,
        userId,
      );
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);
      service.addCommit();

      expect(() => service.addCommit()).toThrowError(
        `An existing empty commit for proposal with Id ${proposalId} already exists`,
      );
    });

    it('should throw an error if a proposal review has not been selected', async () => {
      expect(() => service.addCommit()).toThrowError(
        `Tried to add a commit to a review without selecting a proposal`,
      );
    });
  });

  describe('removeCommit()', () => {
    it('should delete a commit from the review', async () => {
      const commitsSpy = jasmine.createSpy();
      service.commits$.subscribe(commitsSpy);

      const proposalReviewResponse = createProposalReviewResponse(
        proposalId,
        userId,
      );
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);
      service.addCommit();

      await service.removeCommit(null);

      expect(commitsSpy).toHaveBeenCalledTimes(4);
      expect(commitsSpy).toHaveBeenCalledWith(null);
      expect(commitsSpy).toHaveBeenCalledWith([]);
      expect(commitsSpy).toHaveBeenCalledWith([
        createUiProposalReviewCommit({ uiId: '0' }),
      ]);
      expect(commitsSpy).toHaveBeenCalledWith([]);
    });

    it('should throw an error if the proposal review does not exist', async () => {
      await expectAsync(service.removeCommit(commitSha)).toBeRejectedWithError(
        `Tried to remove a commit from a review without selecting a proposal`,
      );
    });

    it('should throw an error if the commit does not exist', async () => {
      const proposalReviewResponse = createProposalReviewResponse(
        proposalId,
        userId,
      );
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);

      await expectAsync(service.removeCommit(commitSha)).toBeRejectedWithError(
        `Tried to remove a commit with SHA ${commitSha} from proposal with Id ${proposalId} but it does not exist`,
      );
    });
  });

  describe('updateCommit()', () => {
    it('should update a commit in the review', async () => {
      const commitsSpy = jasmine.createSpy();
      service.commits$.subscribe(commitsSpy);

      const proposalReviewResponse = createProposalReviewResponse(
        proposalId,
        userId,
      );
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);
      service.addCommit();

      const updatedCommit = createProposalReviewCommitResponse({
        proposalReviewId: proposalId,
        createdAt: currentDate,
        commitSha,
        userId,
      });
      commitReviewApiServiceMock.createProposalCommitReview.and.resolveTo({
        ...updatedCommit,
        id: '0',
      });
      commitReviewApiServiceMock.updateProposalReviewCommit.and.resolveTo(null);

      await service.updateCommit(null, commitSha, { reviewed: false });

      expect(commitsSpy).toHaveBeenCalledTimes(4);
      expect(commitsSpy).toHaveBeenCalledWith(null);
      expect(commitsSpy).toHaveBeenCalledWith([]);
      expect(commitsSpy).toHaveBeenCalledWith([
        createUiProposalReviewCommit({ uiId: '0' }),
      ]);
      expect(commitsSpy).toHaveBeenCalledWith([
        createUiProposalReviewCommit({
          apiId: '0',
          uiId: '0',
          commit: {
            commitSha,
            details: {
              reviewed: false,
            },
          },
        }),
      ]);
    });

    it('should throw an error if the proposal review does not exist', async () => {
      await expectAsync(
        service.updateCommit(commitSha, commitSha, {
          reviewed: true,
          comment: null,
          matchesDescription: null,
          highlights: [],
        }),
      ).toBeRejectedWithError(
        'Tried to update a commit for a review without selecting a proposal',
      );
    });

    it('should throw an error if the commit does not exist', async () => {
      const proposalReviewResponse = createProposalReviewResponse(
        proposalId,
        userId,
      );
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);

      await expectAsync(
        service.updateCommit(commitSha, commitSha, {
          reviewed: true,
          comment: null,
          matchesDescription: null,
          highlights: [],
        }),
      ).toBeRejectedWithError(
        `Tried to update a commit with SHA ${commitSha} from proposal with Id ${proposalId} but it does not exist`,
      );
    });
  });
});

function createProposalReviewResponse(
  proposalId: string,
  userId: string,
): GetProposalReviewResponse {
  return {
    id: proposalId,
    proposalId,
    userId,
    vote: null,
    createdAt: new Date('2021-09-01T00:00:00Z'),
    lastUpdatedAt: null,
    status: ProposalReviewStatus.Draft,
    summary: null,
    reviewDurationMins: null,
    buildReproduced: null,
    reproducedBuildImageId: [],
    commits: [],
  };
}

function createProposalReviewCommitResponse(
  opts: Partial<GetProposalReviewCommitResponse>,
): GetProposalReviewCommitResponse {
  return {
    id: '',
    commitSha: '',
    createdAt: new Date(),
    lastUpdatedAt: null,
    proposalReviewId: '',
    userId: '',
    ...opts,
    details: {
      reviewed: false,
      ...opts.details,
    },
  };
}

function createUiProposalReviewCommit(
  opts: Partial<UiProposalReviewCommit>,
): UiProposalReviewCommit {
  return {
    apiId: opts.apiId ?? null,
    uiId: opts.uiId ?? '0',
    commit: {
      commitSha: opts.commit?.commitSha ?? null,
      details: {
        reviewed: null,
        ...opts.commit?.details,
      },
    },
  };
}
