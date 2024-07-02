import { TestBed } from '@angular/core/testing';

import {
  CommitReviewApiServiceMock,
  CommitReviewApiServiceMockFactory,
} from '../../api/commit-review/commit-review-api.service.mock';
import {
  ReviewApiServiceMock,
  reviewApiServiceMockFactory,
} from '../../api/review/review-api.service.mock';
import {
  CommitReviewApiService,
  GetProposalReviewResponse,
  ProposalReviewStatus,
  ProposalReviewVote,
  ReviewApiService,
} from '~core/api';
import { ApiError } from '~core/utils';
import { ReviewSubmissionService } from './review-submission.service';

describe('ReviewSubmissionService', () => {
  let service: ReviewSubmissionService;

  let reviewApiServiceMock: ReviewApiServiceMock;
  let commitReviewApiServiceMock: CommitReviewApiServiceMock;

  // const id = '1';
  const proposalId = 'e4e6247e-fda4-4678-8590-2cf86b876c92';
  const userId = 'a36bc00d-3ead-4dd1-9115-6b68fce1783c';
  // const commitSha = '96f4ab3090ad72964319346967f4ce9634df200e';

  beforeEach(() => {
    reviewApiServiceMock = reviewApiServiceMockFactory();
    commitReviewApiServiceMock = CommitReviewApiServiceMockFactory();

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

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadOrCreateReview()', () => {
    it('should load or create a review', async () => {
      const reviewSpy = jasmine.createSpy();
      service.review$.subscribe(reviewSpy);

      const commitsSpy = jasmine.createSpy();
      service.commits$.subscribe(commitsSpy);

      const proposalReviewResponse = createProposalReviewResponse({
        proposalId,
        userId,
      });
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

      const proposalReviewResponse = createProposalReviewResponse({
        proposalId,
        userId,
      });
      reviewApiServiceMock.getOrCreateMyProposalReview.and.resolveTo(
        proposalReviewResponse,
      );

      await service.loadOrCreateReview(proposalId);
      service.addCommit();

      expect(commitsSpy).toHaveBeenCalledTimes(3);
      expect(commitsSpy).toHaveBeenCalledWith(null);
      expect(commitsSpy).toHaveBeenCalledWith([]);
      expect(commitsSpy).toHaveBeenCalledWith([
        {
          commitSha: null,
          details: {
            reviewed: null,
          },
        },
      ]);
    });

    //   it('should throw an error if the proposal review already has an empty commit', async () => {
    //     const proposalReviewResponse = createProposalReviewResponse({
    //       proposalId,
    //       userId,
    //     });
    //     backendActorServiceMock.get_my_proposal_review.and.resolveTo({
    //       ok: proposalReviewResponse,
    //     });
    //     service.setCurrentProposal(proposalId);
    //     await service.loadOrCreateReview();
    //     service.addCommit();
    //     expect(() => service.addCommit()).toThrowError(
    //       `An existing empty commit for proposal with Id ${proposalId} already exists`,
    //     );
    //   });
    //   it('should throw an error if the proposal review does not exist', async () => {
    //     service.setCurrentProposal(proposalId);
    //     expect(() => service.addCommit()).toThrowError(
    //       `Tried to add a commit for proposal with Id ${proposalId} but it does not exist`,
    //     );
    //   });
  });

  // describe('removeCommit()', () => {
  //   it('should delete a commit from the review', async () => {
  //     const commitsSpy = jasmine.createSpy();
  //     service.commits$.subscribe(commitsSpy);

  //     const proposalReviewResponse = createProposalReviewResponse({
  //       proposalId,
  //       userId,
  //     });
  //     backendActorServiceMock.get_my_proposal_review.and.resolveTo({
  //       ok: proposalReviewResponse,
  //     });

  //     service.setCurrentProposal(proposalId);
  //     await service.loadOrCreateReview();
  //     service.addCommit();
  //     service.removeCommit(null);

  //     expect(commitsSpy).toHaveBeenCalledTimes(4);
  //     expect(commitsSpy).toHaveBeenCalledWith(null);
  //     expect(commitsSpy).toHaveBeenCalledWith([]);
  //     expect(commitsSpy).toHaveBeenCalledWith([
  //       {
  //         commitSha: null,
  //         details: {
  //           reviewed: null,
  //         },
  //       },
  //     ]);
  //     expect(commitsSpy).toHaveBeenCalledWith([]);
  //   });

  //   it('should throw an error if the proposal review does not exist', async () => {
  //     service.setCurrentProposal(proposalId);
  //     expect(() => service.removeCommit(commitSha)).toThrowError(
  //       `Tried to remove a commit for proposal with Id ${proposalId} but it does not exist`,
  //     );
  //   });

  //   it('should throw an error if the commit does not exist', async () => {
  //     const proposalReviewResponse = createProposalReviewResponse({
  //       proposalId,
  //       userId,
  //     });
  //     backendActorServiceMock.get_my_proposal_review.and.resolveTo({
  //       ok: proposalReviewResponse,
  //     });

  //     service.setCurrentProposal(proposalId);
  //     await service.loadOrCreateReview();

  //     expect(() => service.removeCommit(commitSha)).toThrowError(
  //       `Tried to remove a commit with SHA ${commitSha} from proposal with Id ${proposalId} but it does not exist`,
  //     );
  //   });
  // });

  // describe('updateCommit()', () => {
  //   it('should update a commit in the review', async () => {
  //     const commitsSpy = jasmine.createSpy();
  //     service.commits$.subscribe(commitsSpy);

  //     const proposalReviewResponse = createProposalReviewResponse({
  //       proposalId,
  //       userId,
  //     });
  //     backendActorServiceMock.get_my_proposal_review.and.resolveTo({
  //       ok: proposalReviewResponse,
  //     });

  //     service.setCurrentProposal(proposalId);
  //     await service.loadOrCreateReview();
  //     service.addCommit();
  //     service.updateCommit(null, {
  //       id,
  //       commitSha,
  //       details: {
  //         reviewed: false,
  //       },
  //     });

  //     expect(commitsSpy).toHaveBeenCalledTimes(4);
  //     expect(commitsSpy).toHaveBeenCalledWith(null);
  //     expect(commitsSpy).toHaveBeenCalledWith([]);
  //     expect(commitsSpy).toHaveBeenCalledWith([
  //       {
  //         commitSha: null,
  //         details: {
  //           reviewed: null,
  //         },
  //       },
  //     ]);
  //     expect(commitsSpy).toHaveBeenCalledWith([
  //       {
  //         commitSha,
  //         details: {
  //           reviewed: false,
  //         },
  //       },
  //     ]);
  //   });

  //   it('should throw an error if the proposal review does not exist', async () => {
  //     service.setCurrentProposal(proposalId);
  //     expect(() =>
  //       service.updateCommit(commitSha, {
  //         id,
  //         commitSha,
  //         details: {
  //           reviewed: false,
  //         },
  //       }),
  //     ).toThrowError(
  //       `Tried to update a commit for proposal with Id ${proposalId} but it does not exist`,
  //     );
  //   });

  //   it('should throw an error if the commit does not exist', async () => {
  //     const proposalReviewResponse = createProposalReviewResponse({
  //       proposalId,
  //       userId,
  //     });
  //     backendActorServiceMock.get_my_proposal_review.and.resolveTo({
  //       ok: proposalReviewResponse,
  //     });

  //     service.setCurrentProposal(proposalId);
  //     await service.loadOrCreateReview();

  //     expect(() =>
  //       service.updateCommit(commitSha, {
  //         id,
  //         commitSha,
  //         details: {
  //           reviewed: false,
  //         },
  //       }),
  //     ).toThrowError(
  //       `Tried to update a commit with SHA ${commitSha} from proposal with Id ${proposalId} but it does not exist`,
  //     );
  //   });
  // });
});

interface CreateGetMyProposalReviewResponseOpts {
  proposalId: string;
  userId: string;
}

function createProposalReviewResponse({
  proposalId,
  userId,
}: CreateGetMyProposalReviewResponseOpts): GetProposalReviewResponse {
  return {
    id: proposalId,
    proposalId,
    userId,
    vote: ProposalReviewVote.NoVote,
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
