import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { GetProposalReviewResponse, ReviewApiService } from '~core/api';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private readonly reviewApiService = inject(ReviewApiService);

  private readonly proposalReviewListSubject = new BehaviorSubject<
    GetProposalReviewResponse[]
  >([]);
  public readonly proposalReviewList$ =
    this.proposalReviewListSubject.asObservable();

  private readonly currentReviewSubject =
    new BehaviorSubject<GetProposalReviewResponse | null>(null);
  public readonly currentReview$ = this.currentReviewSubject.asObservable();

  private readonly userReviewListSubject = new BehaviorSubject<
    GetProposalReviewResponse[]
  >([]);
  public readonly userReviewList$ = this.userReviewListSubject.asObservable();

  public async loadReviewListByProposalId(proposalId: string): Promise<void> {
    const getResponse = await this.reviewApiService.listProposalReviews({
      proposalId,
    });

    this.proposalReviewListSubject.next(getResponse);
  }

  public async loadReviewListByReviewerId(userId: string): Promise<void> {
    const getResponse = await this.reviewApiService.listProposalReviews({
      userId,
    });

    this.userReviewListSubject.next(getResponse);
  }

  public async loadReview(proposalReviewId: string): Promise<void> {
    const getResponse = await this.reviewApiService.getProposalReview({
      proposalReviewId,
    });

    this.currentReviewSubject.next(getResponse);
  }
}
