import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  GetMyProposalReviewSummaryResponse,
  GetProposalReviewResponse,
  ReviewApiService,
} from '~core/api';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly reviewApiService = inject(ReviewApiService);

  private readonly proposalReviewListSubject = new BehaviorSubject<
    GetProposalReviewResponse[]
  >([]);
  public readonly reviews$ = this.proposalReviewListSubject.asObservable();

  private readonly currentReviewSubject =
    new BehaviorSubject<GetProposalReviewResponse | null>(null);
  public readonly currentReview$ = this.currentReviewSubject.asObservable();

  private readonly userReviewsSubject = new BehaviorSubject<
    GetProposalReviewResponse[]
  >([]);
  public readonly currentUserReviews$ = this.userReviewsSubject.asObservable();

  private readonly currentUserReviewSummarySubject =
    new BehaviorSubject<GetMyProposalReviewSummaryResponse | null>(null);
  public readonly currentUserReviewSummary$ =
    this.currentUserReviewSummarySubject.asObservable();

  public async loadReviewsByProposalId(proposalId: string): Promise<void> {
    const getResponse = await this.reviewApiService.listProposalReviews({
      proposalId,
    });

    this.proposalReviewListSubject.next(getResponse);
  }

  public async loadReviewsByReviewerId(userId: string): Promise<void> {
    const getResponse = await this.reviewApiService.listProposalReviews({
      userId,
    });

    this.userReviewsSubject.next(getResponse);
  }

  public async loadReview(proposalReviewId: string): Promise<void> {
    const getResponse = await this.reviewApiService.getProposalReview({
      proposalReviewId,
    });

    this.currentReviewSubject.next(getResponse);
  }

  public async loadReviewSummary(proposalId: string): Promise<void> {
    const getResponse = await this.reviewApiService.getMyProposalReviewSummary({
      proposalId,
    });

    this.currentUserReviewSummarySubject.next(getResponse);
  }
}
