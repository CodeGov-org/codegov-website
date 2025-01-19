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
  readonly #reviewApiService = inject(ReviewApiService);

  readonly #reviews = new BehaviorSubject<GetProposalReviewResponse[]>([]);
  public readonly reviews$ = this.#reviews.asObservable();

  readonly #currentReview =
    new BehaviorSubject<GetProposalReviewResponse | null>(null);
  public readonly currentReview$ = this.#currentReview.asObservable();

  readonly #userReviews = new BehaviorSubject<GetProposalReviewResponse[]>([]);
  public readonly currentUserReviews$ = this.#userReviews.asObservable();

  readonly #currentUserReviewSummary =
    new BehaviorSubject<GetMyProposalReviewSummaryResponse | null>(null);
  public readonly currentUserReviewSummary$ =
    this.#currentUserReviewSummary.asObservable();

  public async loadReviewsByProposalId(proposalId: string): Promise<void> {
    const getResponse = await this.#reviewApiService.listProposalReviews({
      proposalId,
    });

    this.#reviews.next(getResponse);
  }

  public async loadReviewsByReviewerId(userId: string): Promise<void> {
    const getResponse = await this.#reviewApiService.listProposalReviews({
      userId,
    });

    this.#userReviews.next(getResponse);
  }

  public async loadReview(proposalReviewId: string): Promise<void> {
    const getResponse = await this.#reviewApiService.getProposalReview({
      proposalReviewId,
    });

    this.#currentReview.next(getResponse);
  }

  public async loadReviewSummary(proposalId: string): Promise<void> {
    const getResponse = await this.#reviewApiService.getMyProposalReviewSummary(
      {
        proposalId,
      },
    );

    this.#currentUserReviewSummary.next(getResponse);
  }
}
