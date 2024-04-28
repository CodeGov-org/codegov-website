import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  GetProposalReviewResponse,
  ListProposalReviewsResponse,
} from '@cg/backend';
import { BackendActorService } from '~core/services';
import { extractOkResponse, isErr } from '~core/utils';
import { mapReviewListResponse, mapReviewResponse } from './review.mapper';
import { ProposalReview } from './review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private proposalReviewListSubject = new BehaviorSubject<ProposalReview[]>([]);
  public readonly proposalReviewList$ =
    this.proposalReviewListSubject.asObservable();

  private currentReviewSubject = new BehaviorSubject<ProposalReview | null>(
    null,
  );
  public readonly currentReview$ = this.currentReviewSubject.asObservable();

  private userReviewListSubject = new BehaviorSubject<ProposalReview[]>([]);
  public readonly userReviewList$ = this.userReviewListSubject.asObservable();

  constructor(private readonly actorService: BackendActorService) {}

  public async loadReviewListByProposalId(proposalId: string): Promise<void> {
    const getResponse = await this.actorService.list_proposal_reviews({
      user_id: [],
      proposal_id: [proposalId],
    });

    this.proposalReviewListSubject.next(this.getReviewList(getResponse));
  }

  public async loadReviewListByReviewerlId(reviewerId: string): Promise<void> {
    const getResponse = await this.actorService.list_proposal_reviews({
      user_id: [reviewerId],
      proposal_id: [],
    });

    this.userReviewListSubject.next(this.getReviewList(getResponse));
  }

  public async loadReview(reviewId: string): Promise<void> {
    const getResponse = await this.actorService.get_proposal_review({
      proposal_review_id: reviewId,
    });

    this.currentReviewSubject.next(this.getReview(getResponse));
  }

  public async createReview(proposalId: string): Promise<void> {
    const createResponse = await this.actorService.create_proposal_review({
      review_duration_mins: [],
      summary: [],
      proposal_id: proposalId,
      build_reproduced: [],
      reproduced_build_image_id: [],
    });

    if (isErr(createResponse)) {
      throw new Error(
        `${createResponse.err.code}: ${createResponse.err.message}`,
      );
    }
  }

  private getReviewList(
    getResponse: ListProposalReviewsResponse,
  ): ProposalReview[] {
    return mapReviewListResponse(
      extractOkResponse(getResponse).proposal_reviews,
    );
  }

  private getReview(getResponse: GetProposalReviewResponse): ProposalReview {
    return mapReviewResponse(extractOkResponse(getResponse));
  }
}
