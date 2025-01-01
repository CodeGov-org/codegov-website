import { TestBed } from '@angular/core/testing';

import {
  CreateProposalReviewCommitRequest as CreateProposalReviewCommitApiRequest,
  CreateProposalReviewCommitResponse as CreateProposalReviewCommitApiResponse,
  UpdateProposalReviewCommitRequest as UpdateProposalReviewCommitApiRequest,
  UpdateProposalReviewCommitResponse as UpdateProposalReviewCommitApiResponse,
  DeleteProposalReviewCommitRequest as DeleteProposalReviewCommitApiRequest,
  DeleteProposalReviewCommitResponse as DeleteProposalReviewCommitApiResponse,
} from '@cg/backend';
import { BackendActorService } from '~core/services';
import {
  BackendActorServiceMock,
  backendActorServiceMockFactory,
} from '~core/services/backend-actor-service-mock';
import { ApiError } from '~core/utils';
import {
  CreateProposalReviewCommitRequest,
  DeleteProposalReviewCommitRequest,
  GetProposalReviewCommitResponse,
  UpdateProposalReviewCommitRequest,
} from './commit-review-api.model';
import { CommitReviewApiService } from './commit-review-api.service';

describe('CommitReviewApiService', () => {
  let service: CommitReviewApiService;
  let backendActorServiceMock: BackendActorServiceMock;

  beforeEach(() => {
    backendActorServiceMock = backendActorServiceMockFactory();

    TestBed.configureTestingModule({
      providers: [
        { provide: BackendActorService, useValue: backendActorServiceMock },
      ],
    });

    service = TestBed.inject(CommitReviewApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createProposalCommitReview()', () => {
    const commonRequest: CreateProposalReviewCommitRequest = {
      commitSha: 'commitSha',
      proposalReviewId: 'proposalReviewId',
      reviewed: true,
    };
    const commonApiRequest: CreateProposalReviewCommitApiRequest = {
      commit_sha: 'commitSha',
      proposal_review_id: 'proposalReviewId',
      state: {
        reviewed: {
          comment: [],
          highlights: [],
          matches_description: [],
        },
      },
    };
    const commonApiResponse: CreateProposalReviewCommitApiResponse = {
      ok: {
        id: 'id',
        proposal_review_commit: {
          proposal_review_id: 'proposalReviewId',
          user_id: 'userId',
          commit_sha: 'commitSha',
          created_at: new Date(2024, 1, 1, 0, 0, 0, 0).toISOString(),
          last_updated_at: [],
          state: {
            reviewed: {
              comment: [],
              highlights: [],
              matches_description: [],
            },
          },
        },
      },
    };
    const commonResponse: GetProposalReviewCommitResponse = {
      id: 'id',
      userId: 'userId',
      commitSha: 'commitSha',
      proposalReviewId: 'proposalReviewId',
      createdAt: new Date(2024, 1, 1, 0, 0, 0, 0),
      lastUpdatedAt: null,
      details: {
        reviewed: true,
        comment: null,
        highlights: [],
        matchesDescription: null,
      },
    };

    it('should create a proposal commit review', async () => {
      backendActorServiceMock.create_proposal_review_commit.and.resolveTo(
        commonApiResponse,
      );

      const result = await service.createProposalCommitReview(commonRequest);

      expect(result).toEqual(commonResponse);
      expect(
        backendActorServiceMock.create_proposal_review_commit,
      ).toHaveBeenCalledWith(commonApiRequest);
    });

    it('should create a not-reviewed proposal commit review', async () => {
      const request: CreateProposalReviewCommitRequest = {
        ...commonRequest,
        reviewed: false,
      };
      const apiRequest: CreateProposalReviewCommitApiRequest = {
        ...commonApiRequest,
        state: {
          not_reviewed: null,
        },
      };
      const apiResponse: CreateProposalReviewCommitApiResponse = {
        ...commonApiResponse,
        ok: {
          ...commonApiResponse.ok,
          proposal_review_commit: {
            ...commonApiResponse.ok.proposal_review_commit,
            state: {
              not_reviewed: null,
            },
          },
        },
      };
      const response: GetProposalReviewCommitResponse = {
        ...commonResponse,
        details: {
          reviewed: false,
        },
      };

      backendActorServiceMock.create_proposal_review_commit.and.resolveTo(
        apiResponse,
      );

      const result = await service.createProposalCommitReview(request);

      expect(result).toEqual(response);
      expect(
        backendActorServiceMock.create_proposal_review_commit,
      ).toHaveBeenCalledWith(apiRequest);
    });

    it('should throw for an err response', async () => {
      const apiResponse: CreateProposalReviewCommitApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };

      backendActorServiceMock.create_proposal_review_commit.and.resolveTo(
        apiResponse,
      );

      await expectAsync(
        service.createProposalCommitReview(commonRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
      expect(
        backendActorServiceMock.create_proposal_review_commit,
      ).toHaveBeenCalledWith(commonApiRequest);
    });
  });

  describe('updateProposalReviewCommit()', () => {
    const commonRequest: UpdateProposalReviewCommitRequest = {
      proposalReviewCommitId: 'id',
      details: {
        reviewed: true,
        comment: null,
        highlights: [],
        matchesDescription: null,
      },
    };
    const commonApiRequest: UpdateProposalReviewCommitApiRequest = {
      id: 'id',
      state: {
        reviewed: {
          comment: [],
          highlights: [],
          matches_description: [],
        },
      },
    };
    const commonApiResponse: UpdateProposalReviewCommitApiResponse = {
      ok: null,
    };

    it('should update a proposal commit review', async () => {
      backendActorServiceMock.update_proposal_review_commit.and.resolveTo(
        commonApiResponse,
      );

      const result = await service.updateProposalReviewCommit(commonRequest);

      expect(result).toBeNull();
      expect(
        backendActorServiceMock.update_proposal_review_commit,
      ).toHaveBeenCalledWith(commonApiRequest);
    });

    it('should update a non-reviewed proposal commit review', async () => {
      const request: UpdateProposalReviewCommitRequest = {
        ...commonRequest,
        details: {
          reviewed: false,
        },
      };
      const apiRequest: UpdateProposalReviewCommitApiRequest = {
        ...commonApiRequest,
        state: {
          not_reviewed: null,
        },
      };

      backendActorServiceMock.update_proposal_review_commit.and.resolveTo(
        commonApiResponse,
      );

      const result = await service.updateProposalReviewCommit(request);

      expect(result).toBeNull();
      expect(
        backendActorServiceMock.update_proposal_review_commit,
      ).toHaveBeenCalledWith(apiRequest);
    });

    it('should throw for an err response', async () => {
      const apiResponse: UpdateProposalReviewCommitApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };

      backendActorServiceMock.update_proposal_review_commit.and.resolveTo(
        apiResponse,
      );

      await expectAsync(
        service.updateProposalReviewCommit(commonRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
      expect(
        backendActorServiceMock.update_proposal_review_commit,
      ).toHaveBeenCalledWith(commonApiRequest);
    });
  });

  describe('deleteProposalReviewCommit()', () => {
    const commonRequest: DeleteProposalReviewCommitRequest = {
      proposalReviewCommitId: 'id',
    };
    const commonApiRequest: DeleteProposalReviewCommitApiRequest = {
      id: 'id',
    };
    const commonApiResponse: DeleteProposalReviewCommitApiResponse = {
      ok: null,
    };

    it('should delete a proposal commit review', async () => {
      backendActorServiceMock.delete_proposal_review_commit.and.resolveTo(
        commonApiResponse,
      );

      const result = await service.deleteProposalReviewCommit(commonRequest);

      expect(result).toBeNull();
      expect(
        backendActorServiceMock.delete_proposal_review_commit,
      ).toHaveBeenCalledWith(commonApiRequest);
    });

    it('should throw for an err response', async () => {
      const apiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };

      backendActorServiceMock.delete_proposal_review_commit.and.resolveTo(
        apiResponse,
      );

      await expectAsync(
        service.deleteProposalReviewCommit(commonRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
      expect(
        backendActorServiceMock.delete_proposal_review_commit,
      ).toHaveBeenCalledWith(commonApiRequest);
    });
  });
});
