import { Injectable, inject } from '@angular/core';

import { BackendActorService } from '../../services';
import { ApiError, handleErr } from '../../utils';
import {
  mapCreateProposalReviewImageRequest,
  mapCreateProposalReviewImageResponse,
  mapCreateProposalReviewRequest,
  mapDeleteProposalReviewImageRequest,
  mapGetMyProposalReviewRequest,
  mapGetMyProposalReviewSummaryRequest,
  mapGetMyProposalReviewSummaryResponse,
  mapGetProposalReviewRequest,
  mapGetProposalReviewResponse,
  mapListProposalReviewsRequest,
  mapUpdateProposalReviewRequest,
} from './review-api.mapper';
import {
  CreateProposalReviewImageRequest,
  CreateProposalReviewImageResponse,
  CreateProposalReviewRequest,
  DeleteProposalReviewImageRequest,
  GetMyProposalReviewRequest,
  GetMyProposalReviewSummaryRequest,
  GetMyProposalReviewSummaryResponse,
  GetProposalReviewRequest,
  GetProposalReviewResponse,
  ListProposalReviewsRequest,
  UpdateProposalReviewRequest,
} from './review-api.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewApiService {
  private readonly actorService = inject(BackendActorService);

  public async createProposalReview(
    req: CreateProposalReviewRequest,
  ): Promise<GetProposalReviewResponse> {
    const apiReq = mapCreateProposalReviewRequest(req);

    const res = await this.actorService.create_proposal_review(apiReq);
    const okRes = handleErr(res);

    return mapGetProposalReviewResponse(okRes);
  }

  public async updateProposalReview(
    req: UpdateProposalReviewRequest,
  ): Promise<null> {
    const apiReq = mapUpdateProposalReviewRequest(req);

    const res = await this.actorService.update_proposal_review(apiReq);
    const okRes = handleErr(res);

    return okRes;
  }

  public async listProposalReviews(
    req: ListProposalReviewsRequest,
  ): Promise<GetProposalReviewResponse[]> {
    const apiReq = mapListProposalReviewsRequest(req);

    const res = await this.actorService.list_proposal_reviews(apiReq);
    const okRes = handleErr(res);

    return okRes.proposal_reviews.map(mapGetProposalReviewResponse);
  }

  public async getProposalReview(
    req: GetProposalReviewRequest,
  ): Promise<GetProposalReviewResponse> {
    const apiReq = mapGetProposalReviewRequest(req);

    const res = await this.actorService.get_proposal_review(apiReq);
    const okRes = handleErr(res);

    return mapGetProposalReviewResponse(okRes);
  }

  public async getMyProposalReview(
    req: GetMyProposalReviewRequest,
  ): Promise<GetProposalReviewResponse> {
    const apiReq = mapGetMyProposalReviewRequest(req);

    const res = await this.actorService.get_my_proposal_review(apiReq);
    const okRes = handleErr(res);

    return mapGetProposalReviewResponse(okRes);
  }

  public async getMyProposalReviewSummary(
    req: GetMyProposalReviewSummaryRequest,
  ): Promise<GetMyProposalReviewSummaryResponse> {
    const apiReq = mapGetMyProposalReviewSummaryRequest(req);

    const res = await this.actorService.get_my_proposal_review_summary(apiReq);
    const okRes = handleErr(res);

    return mapGetMyProposalReviewSummaryResponse(okRes);
  }

  public async getOrCreateMyProposalReview(
    req: CreateProposalReviewRequest,
  ): Promise<GetProposalReviewResponse> {
    try {
      return await this.getMyProposalReview(req);
    } catch (error) {
      if (error instanceof ApiError && error.code === 404) {
        return await this.createProposalReview(req);
      }

      throw error;
    }
  }

  public async createProposalReviewImage(
    req: CreateProposalReviewImageRequest,
  ): Promise<CreateProposalReviewImageResponse> {
    const apiReq = mapCreateProposalReviewImageRequest(req);

    const res = await this.actorService.create_proposal_review_image(apiReq);
    const okRes = handleErr(res);

    return mapCreateProposalReviewImageResponse(okRes);
  }

  public async deleteProposalReviewImage(
    req: DeleteProposalReviewImageRequest,
  ): Promise<null> {
    const apiReq = mapDeleteProposalReviewImageRequest(req);

    const res = await this.actorService.delete_proposal_review_image(apiReq);
    const okRes = handleErr(res);

    return okRes;
  }
}
