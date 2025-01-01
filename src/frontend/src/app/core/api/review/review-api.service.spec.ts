import { TestBed } from '@angular/core/testing';

import { ImageSet } from '@cg/angular-ui';
import {
  CreateProposalReviewRequest as CreateProposalReviewApiRequest,
  CreateProposalReviewResponse as CreateProposalReviewApiResponse,
  UpdateProposalReviewRequest as UpdateProposalReviewApiRequest,
  UpdateProposalReviewResponse as UpdateProposalReviewApiResponse,
  ListProposalReviewsRequest as ListProposalReviewsApiRequest,
  ListProposalReviewsResponse as ListProposalReviewsApiResponse,
  GetProposalReviewRequest as GetProposalReviewApiRequest,
  GetProposalReviewResponse as GetProposalReviewApiResponse,
  GetMyProposalReviewRequest as GetMyProposalReviewApiRequest,
  GetMyProposalReviewResponse as GetMyProposalReviewApiResponse,
} from '@cg/backend';
import { BackendActorService } from '~core/services';
import {
  BackendActorServiceMock,
  backendActorServiceMockFactory,
} from '~core/services/backend-actor-service-mock';
import { ApiError } from '~core/utils';
import {
  CreateProposalReviewRequest,
  GetMyProposalReviewRequest,
  GetProposalReviewRequest,
  GetProposalReviewResponse,
  ListProposalReviewsRequest,
  ProposalReviewStatus,
  UpdateProposalReviewRequest,
} from './review-api.model';
import { ReviewApiService } from './review-api.service';

describe('ReviewApiService', () => {
  let service: ReviewApiService;
  let backendActorServiceMock: BackendActorServiceMock;

  beforeEach(() => {
    backendActorServiceMock = backendActorServiceMockFactory();

    TestBed.configureTestingModule({
      providers: [
        { provide: BackendActorService, useValue: backendActorServiceMock },
      ],
    });

    service = TestBed.inject(ReviewApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createProposalReview()', () => {
    const commonRequest: CreateProposalReviewRequest = {
      proposalId: 'proposalId',
      summary: null,
      reviewDurationMins: null,
      buildReproduced: null,
    };
    const commonApiRequest: CreateProposalReviewApiRequest = {
      proposal_id: 'proposalId',
      summary: [],
      review_duration_mins: [],
      build_reproduced: [],
      vote: [],
    };
    const commonApiResponse: CreateProposalReviewApiResponse = {
      ok: {
        id: 'id',
        proposal_review: {
          proposal_id: 'proposalId',
          user_id: 'userId',
          created_at: new Date(2024, 1, 1, 0, 0, 0, 0).toISOString(),
          last_updated_at: [],
          status: {
            draft: null,
          },
          summary: [],
          review_duration_mins: [],
          build_reproduced: [],
          images_paths: [],
          proposal_review_commits: [],
          vote: { unspecified: null },
        },
      },
    };
    const commonResponse: GetProposalReviewResponse = {
      id: 'id',
      proposalId: 'proposalId',
      userId: 'userId',
      vote: null,
      createdAt: new Date(2024, 1, 1, 0, 0, 0, 0),
      lastUpdatedAt: null,
      status: ProposalReviewStatus.Draft,
      summary: null,
      reviewDurationMins: null,
      buildReproduced: null,
      // [TODO] - remove when API is implemented
      reproducedBuildImageId: jasmine.any(Array) as unknown as ImageSet[],
      commits: [],
    };

    it('should create a proposal review', async () => {
      backendActorServiceMock.create_proposal_review.and.resolveTo(
        commonApiResponse,
      );

      const result = await service.createProposalReview(commonRequest);

      expect(result).toEqual(commonResponse);
      expect(
        backendActorServiceMock.create_proposal_review,
      ).toHaveBeenCalledWith(commonApiRequest);
    });

    it('should throw for an err response', async () => {
      const apiResponse: CreateProposalReviewApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };

      backendActorServiceMock.create_proposal_review.and.resolveTo(apiResponse);

      await expectAsync(
        service.createProposalReview(commonRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
    });
  });

  describe('updateProposalReview()', () => {
    const commonRequest: UpdateProposalReviewRequest = {
      proposalId: 'proposalId',
      summary: null,
      reviewDurationMins: null,
      buildReproduced: null,
    };
    const commonApiRequest: UpdateProposalReviewApiRequest = {
      proposal_id: 'proposalId',
      status: [],
      summary: [],
      review_duration_mins: [],
      build_reproduced: [],
      vote: [],
    };
    const commonApiResponse: UpdateProposalReviewApiResponse = {
      ok: null,
    };

    it('should update a proposal review', async () => {
      backendActorServiceMock.update_proposal_review.and.resolveTo(
        commonApiResponse,
      );

      const result = await service.updateProposalReview(commonRequest);

      expect(result).toEqual(null);
      expect(
        backendActorServiceMock.update_proposal_review,
      ).toHaveBeenCalledWith(commonApiRequest);
    });

    it('should throw for an err response', async () => {
      const apiResponse: CreateProposalReviewApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };

      backendActorServiceMock.update_proposal_review.and.resolveTo(apiResponse);

      await expectAsync(
        service.updateProposalReview(commonRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
    });
  });

  describe('listProposalReviews()', () => {
    const commonRequest: ListProposalReviewsRequest = {
      proposalId: 'proposalId',
    };
    const commonApiRequest: ListProposalReviewsApiRequest = {
      proposal_id: ['proposalId'],
      user_id: [],
    };
    const commonApiResponse: ListProposalReviewsApiResponse = {
      ok: {
        proposal_reviews: [
          {
            id: 'id1',
            proposal_review: {
              proposal_id: 'proposalId',
              user_id: 'userId1',
              created_at: new Date(2024, 1, 1, 0, 0, 0, 0).toISOString(),
              last_updated_at: [],
              status: {
                draft: null,
              },
              summary: [],
              review_duration_mins: [],
              build_reproduced: [],
              images_paths: [],
              proposal_review_commits: [],
              vote: { unspecified: null },
            },
          },
          {
            id: 'id2',
            proposal_review: {
              proposal_id: 'proposalId',
              user_id: 'userId2',
              created_at: new Date(2024, 1, 2, 0, 0, 0, 0).toISOString(),
              last_updated_at: [],
              status: {
                draft: null,
              },
              summary: [],
              review_duration_mins: [],
              build_reproduced: [],
              images_paths: [],
              proposal_review_commits: [],
              vote: { unspecified: null },
            },
          },
        ],
      },
    };
    const commonResponse: GetProposalReviewResponse[] = [
      {
        id: 'id1',
        proposalId: 'proposalId',
        userId: 'userId1',
        vote: null,
        createdAt: new Date(2024, 1, 1, 0, 0, 0, 0),
        lastUpdatedAt: null,
        status: ProposalReviewStatus.Draft,
        summary: null,
        reviewDurationMins: null,
        buildReproduced: null,
        // [TODO] - remove when API is implemented
        reproducedBuildImageId: jasmine.any(Array) as unknown as ImageSet[],
        commits: [],
      },
      {
        id: 'id2',
        proposalId: 'proposalId',
        userId: 'userId2',
        vote: null,
        createdAt: new Date(2024, 1, 2, 0, 0, 0, 0),
        lastUpdatedAt: null,
        status: ProposalReviewStatus.Draft,
        summary: null,
        reviewDurationMins: null,
        buildReproduced: null,
        // [TODO] - remove when API is implemented
        reproducedBuildImageId: jasmine.any(Array) as unknown as ImageSet[],
        commits: [],
      },
    ];

    it('should list proposal reviews', async () => {
      backendActorServiceMock.list_proposal_reviews.and.resolveTo(
        commonApiResponse,
      );
      const result = await service.listProposalReviews(commonRequest);

      expect(result).toEqual(commonResponse);
      expect(
        backendActorServiceMock.list_proposal_reviews,
      ).toHaveBeenCalledWith(commonApiRequest);
    });

    it('should throw for an err response', async () => {
      const apiResponse: ListProposalReviewsApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.list_proposal_reviews.and.resolveTo(apiResponse);
      await expectAsync(
        service.listProposalReviews(commonRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
    });
  });

  describe('getProposalReview()', () => {
    const commonRequest: GetProposalReviewRequest = {
      proposalReviewId: 'proposalReviewId',
    };
    const commonApiRequest: GetProposalReviewApiRequest = {
      proposal_review_id: 'proposalReviewId',
    };
    const commonApiResponse: GetProposalReviewApiResponse = {
      ok: {
        id: 'id',
        proposal_review: {
          proposal_id: 'proposalId',
          user_id: 'userId',
          created_at: new Date(2024, 1, 1, 0, 0, 0, 0).toISOString(),
          last_updated_at: [],
          status: {
            draft: null,
          },
          summary: [],
          review_duration_mins: [],
          build_reproduced: [],
          images_paths: [],
          proposal_review_commits: [],
          vote: { unspecified: null },
        },
      },
    };
    const commonResponse: GetProposalReviewResponse = {
      id: 'id',
      proposalId: 'proposalId',
      userId: 'userId',
      vote: null,
      createdAt: new Date(2024, 1, 1, 0, 0, 0, 0),
      lastUpdatedAt: null,
      status: ProposalReviewStatus.Draft,
      summary: null,
      reviewDurationMins: null,
      buildReproduced: null,
      // [TODO] - remove when API is implemented
      reproducedBuildImageId: jasmine.any(Array) as unknown as ImageSet[],
      commits: [],
    };

    it('should get a proposal review', async () => {
      backendActorServiceMock.get_proposal_review.and.resolveTo(
        commonApiResponse,
      );

      const result = await service.getProposalReview(commonRequest);

      expect(result).toEqual(commonResponse);
      expect(backendActorServiceMock.get_proposal_review).toHaveBeenCalledWith(
        commonApiRequest,
      );
    });

    it('should throw for an err response', async () => {
      const apiResponse: GetProposalReviewApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.get_proposal_review.and.resolveTo(apiResponse);

      await expectAsync(
        service.getProposalReview(commonRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
    });
  });

  describe('getMyProposalReview()', () => {
    const commonRequest: GetMyProposalReviewRequest = {
      proposalId: 'proposalId',
    };
    const commonApiRequest: GetMyProposalReviewApiRequest = {
      proposal_id: 'proposalId',
    };
    const commonApiResponse: GetMyProposalReviewApiResponse = {
      ok: {
        id: 'id',
        proposal_review: {
          proposal_id: 'proposalId',
          user_id: 'userId',
          created_at: new Date(2024, 1, 1, 0, 0, 0, 0).toISOString(),
          last_updated_at: [],
          status: {
            draft: null,
          },
          summary: [],
          review_duration_mins: [],
          build_reproduced: [],
          images_paths: [],
          proposal_review_commits: [],
          vote: { unspecified: null },
        },
      },
    };
    const commonResponse: GetProposalReviewResponse = {
      id: 'id',
      proposalId: 'proposalId',
      userId: 'userId',
      vote: null,
      createdAt: new Date(2024, 1, 1, 0, 0, 0, 0),
      lastUpdatedAt: null,
      status: ProposalReviewStatus.Draft,
      summary: null,
      reviewDurationMins: null,
      buildReproduced: null,
      // [TODO] - remove when API is implemented
      reproducedBuildImageId: jasmine.any(Array) as unknown as ImageSet[],
      commits: [],
    };

    it('should get my proposal review', async () => {
      backendActorServiceMock.get_my_proposal_review.and.resolveTo(
        commonApiResponse,
      );
      const result = await service.getMyProposalReview(commonRequest);
      expect(result).toEqual(commonResponse);
      expect(
        backendActorServiceMock.get_my_proposal_review,
      ).toHaveBeenCalledWith(commonApiRequest);
    });

    it('should throw for an err response', async () => {
      const apiResponse: GetMyProposalReviewApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.get_my_proposal_review.and.resolveTo(apiResponse);
      await expectAsync(
        service.getMyProposalReview(commonRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
    });
  });

  describe('getOrCreateMyProposalReview()', () => {
    const commonCreateRequest: CreateProposalReviewRequest = {
      proposalId: 'proposalId',
      summary: null,
      reviewDurationMins: null,
      buildReproduced: null,
    };
    const commonApiCreateRequest: CreateProposalReviewApiRequest = {
      proposal_id: 'proposalId',
      summary: [],
      review_duration_mins: [],
      build_reproduced: [],
      vote: [],
    };
    const commonGetApiRequest: GetMyProposalReviewApiRequest = {
      proposal_id: 'proposalId',
    };
    const commonApiResponse: CreateProposalReviewApiResponse = {
      ok: {
        id: 'id',
        proposal_review: {
          proposal_id: 'proposalId',
          user_id: 'userId',
          created_at: new Date(2024, 1, 1, 0, 0, 0, 0).toISOString(),
          last_updated_at: [],
          status: {
            draft: null,
          },
          summary: [],
          review_duration_mins: [],
          build_reproduced: [],
          images_paths: [],
          proposal_review_commits: [],
          vote: { unspecified: null },
        },
      },
    };
    const commonResponse: GetProposalReviewResponse = {
      id: 'id',
      proposalId: 'proposalId',
      userId: 'userId',
      vote: null,
      createdAt: new Date(2024, 1, 1, 0, 0, 0, 0),
      lastUpdatedAt: null,
      status: ProposalReviewStatus.Draft,
      summary: null,
      reviewDurationMins: null,
      buildReproduced: null,
      // [TODO] - remove when API is implemented
      reproducedBuildImageId: jasmine.any(Array) as unknown as ImageSet[],
      commits: [],
    };

    it('should not create a proposal review if it already exists', async () => {
      backendActorServiceMock.get_my_proposal_review.and.resolveTo(
        commonApiResponse,
      );
      const result =
        await service.getOrCreateMyProposalReview(commonCreateRequest);

      expect(result).toEqual(commonResponse);
      expect(
        backendActorServiceMock.get_my_proposal_review,
      ).toHaveBeenCalledWith(commonGetApiRequest);
      expect(
        backendActorServiceMock.create_proposal_review,
      ).not.toHaveBeenCalled();
    });

    it('should create a proposal review if it does not exist', async () => {
      backendActorServiceMock.get_my_proposal_review.and.resolveTo({
        err: {
          code: 404,
          message: 'Not found',
        },
      });
      backendActorServiceMock.create_proposal_review.and.resolveTo(
        commonApiResponse,
      );
      const result =
        await service.getOrCreateMyProposalReview(commonCreateRequest);

      expect(result).toEqual(commonResponse);
      expect(
        backendActorServiceMock.get_my_proposal_review,
      ).toHaveBeenCalledWith(commonGetApiRequest);
      expect(
        backendActorServiceMock.create_proposal_review,
      ).toHaveBeenCalledWith(commonApiCreateRequest);
    });

    it('should throw for an err response on get', async () => {
      const apiResponse: CreateProposalReviewApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.get_my_proposal_review.and.resolveTo(apiResponse);
      await expectAsync(
        service.getOrCreateMyProposalReview(commonCreateRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
    });

    it('should throw for an err response on create', async () => {
      backendActorServiceMock.get_my_proposal_review.and.resolveTo({
        err: {
          code: 404,
          message: 'Not found',
        },
      });
      const apiResponse: CreateProposalReviewApiResponse = {
        err: {
          code: 500,
          message: 'Internal server error',
        },
      };
      backendActorServiceMock.create_proposal_review.and.resolveTo(apiResponse);

      await expectAsync(
        service.getOrCreateMyProposalReview(commonCreateRequest),
      ).toBeRejectedWith(new ApiError(apiResponse.err));
    });
  });
});
