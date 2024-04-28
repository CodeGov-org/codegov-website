import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ProposalReview } from './review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private proposalReviewListSubject = new BehaviorSubject<ProposalReview[]>([]);
  public proposalReviewList$ = this.proposalReviewListSubject.asObservable();

  private currentReviewSubject = new BehaviorSubject<ProposalReview | null>(
    null,
  );
  public currentReview$ = this.currentReviewSubject.asObservable();

  private userReviewListSubject = new BehaviorSubject<ProposalReview[]>([]);
  public userReviewList$ = this.userReviewListSubject.asObservable();

  //TODO: loading by proposal ID using backend endpoint
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async loadReviewListByProposalId(_proposalId: bigint): Promise<void> {
    this.proposalReviewListSubject.next([
      {
        id: 1n,
        proposalId: 1n,
        reviewerId: 'c38a2bda-0631-469e-803b-bf06cdab3268',
        reviewerVote: 'ADOPT',
        state: 'Completed',
        lastSaved: new Date(),
        timeSpent: 6,
        summary: 'This is a review summary',
        buildReproduced: true,
        buildImages: [],
        reviewCommits: [
          {
            id: 1n,
            reviewId: 1n,
            commitId: '1',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
          {
            id: 2n,
            reviewId: 1n,
            commitId: '2',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
        ],
      },
      {
        id: 2n,
        proposalId: 1n,
        reviewerId: 'c38a2bda-0631-469e-803b-bf06cdadsfs8',
        reviewerVote: 'REJECT',
        state: 'Completed',
        lastSaved: new Date(),
        timeSpent: 6,
        summary: 'This is a review summary',
        buildReproduced: true,
        buildImages: [],
        reviewCommits: [
          {
            id: 3n,
            reviewId: 2n,
            commitId: '1',
            reviewed: 1,
            matchesDescription: 0,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
          {
            id: 4n,
            reviewId: 2n,
            commitId: '2',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
        ],
      },
      {
        id: 3n,
        proposalId: 1n,
        reviewerId: 'c38sdaasda-0631-469e-803b-bf06cdab3268',
        reviewerVote: 'ADOPT',
        state: 'Completed',
        lastSaved: new Date(),
        timeSpent: 6,
        summary: 'This is a review summaty',
        buildReproduced: true,
        buildImages: [],
        reviewCommits: [
          {
            id: 4n,
            reviewId: 3n,
            commitId: '1',
            reviewed: 1,
            matchesDescription: 0,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
          {
            id: 5n,
            reviewId: 3n,
            commitId: '2',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
          {
            id: 6n,
            reviewId: 3n,
            commitId: '3',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
        ],
      },
    ]);
  }

  public async loadReviewListByReviewerlId(reviewerId: string): Promise<void> {
    this.userReviewListSubject.next([
      {
        id: 1n,
        proposalId: 1n,
        reviewerId: reviewerId,
        reviewerVote: 'ADOPT',
        state: 'Completed',
        lastSaved: new Date(),
        timeSpent: 6,
        summary: 'This is a review summary',
        buildReproduced: true,
        buildImages: [],
        reviewCommits: [
          {
            id: 1n,
            reviewId: 1n,
            commitId: '1',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
          {
            id: 2n,
            reviewId: 1n,
            commitId: '2',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
        ],
      },
      {
        id: 2n,
        proposalId: 2n,
        reviewerId: reviewerId,
        reviewerVote: 'REJECT',
        state: 'Completed',
        lastSaved: new Date(),
        timeSpent: 6,
        summary: 'This is a review summary',
        buildReproduced: true,
        buildImages: [],
        reviewCommits: [
          {
            id: 3n,
            reviewId: 2n,
            commitId: '1',
            reviewed: 1,
            matchesDescription: 0,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
          {
            id: 4n,
            reviewId: 2n,
            commitId: '2',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
        ],
      },
      {
        id: 3n,
        proposalId: 3n,
        reviewerId: reviewerId,
        reviewerVote: 'ADOPT',
        state: 'Completed',
        lastSaved: new Date(),
        timeSpent: 6,
        summary: 'This is a review summaty',
        buildReproduced: true,
        buildImages: [],
        reviewCommits: [
          {
            id: 4n,
            reviewId: 3n,
            commitId: '1',
            reviewed: 1,
            matchesDescription: 0,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
          {
            id: 5n,
            reviewId: 3n,
            commitId: '2',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
          {
            id: 6n,
            reviewId: 3n,
            commitId: '3',
            reviewed: 1,
            matchesDescription: 1,
            summary: 'This is a commit summary',
            highlights: 'This is a commit highlight',
          },
        ],
      },
    ]);
  }

  public async loadReview(reviewId: bigint): Promise<void> {
    this.currentReviewSubject.next({
      id: reviewId,
      proposalId: 9n,
      reviewerId: 'c38a2bda-0631-469e-803b-bf06cdab3268',
      reviewerVote: 'ADOPT',
      state: 'Completed',
      lastSaved: new Date(),
      timeSpent: 260,
      summary: 'This is a review summary',
      buildReproduced: true,
      buildImages: [
        {
          sm: {
            url: '../assets/apple-touch-icon.png',
            size: 10,
            width: 10,
            height: 10,
          },
          md: {
            url: '../assets/apple-touch-icon.png',
            size: 100,
            width: 100,
            height: 100,
          },
          lg: {
            url: '../assets/apple-touch-icon.png',
            size: 100,
            width: 100,
            height: 100,
          },
          xl: {
            url: '../assets/apple-touch-icon.png',
            size: 100,
            width: 100,
            height: 100,
          },
          xxl: {
            url: '../assets/apple-touch-icon.png',
            size: 100,
            width: 100,
            height: 100,
          },
        },
        {
          sm: {
            url: '../assets/codegov-logo.png',
            size: 10,
            width: 10,
            height: 10,
          },
          md: {
            url: '../assets/codegov-logo.png',
            size: 100,
            width: 100,
            height: 100,
          },
          lg: {
            url: '../assets/codegov-logo.png',
            size: 100,
            width: 100,
            height: 100,
          },
          xl: {
            url: '../assets/codegov-logo.png',
            size: 100,
            width: 100,
            height: 100,
          },
          xxl: {
            url: '../assets/codegov-logo.png',
            size: 100,
            width: 100,
            height: 100,
          },
        },
      ],
      reviewCommits: [
        {
          id: 1n,
          reviewId: reviewId,
          commitId: '1',
          reviewed: 1,
          matchesDescription: 1,
          summary: 'This is a commit summary',
          highlights: 'This is a commit highlight',
        },
        {
          id: 2n,
          reviewId: reviewId,
          commitId: '2',
          reviewed: 1,
          matchesDescription: 0,
          summary: 'This is a commit summary',
          highlights: 'This is a commit highlight',
        },
      ],
    });
  }

  public async createReview(
    proposalId: bigint,
    reviewerId: string,
  ): Promise<void> {
    this.userReviewListSubject.next(
      this.userReviewListSubject.getValue().concat([
        {
          id: 1n,
          proposalId: proposalId,
          reviewerId: reviewerId,
          reviewerVote: 'ADOPT',
          state: 'Completed',
          lastSaved: new Date(),
          timeSpent: 260,
          summary: 'This is a review summary',
          buildReproduced: true,
          buildImages: [
            {
              sm: {
                url: '../assets/apple-touch-icon.png',
                size: 10,
                width: 10,
                height: 10,
              },
              md: {
                url: '../assets/apple-touch-icon.png',
                size: 100,
                width: 100,
                height: 100,
              },
              lg: {
                url: '../assets/apple-touch-icon.png',
                size: 100,
                width: 100,
                height: 100,
              },
              xl: {
                url: '../assets/apple-touch-icon.png',
                size: 100,
                width: 100,
                height: 100,
              },
              xxl: {
                url: '../assets/apple-touch-icon.png',
                size: 100,
                width: 100,
                height: 100,
              },
            },
            {
              sm: {
                url: '../assets/codegov-logo.png',
                size: 10,
                width: 10,
                height: 10,
              },
              md: {
                url: '../assets/codegov-logo.png',
                size: 100,
                width: 100,
                height: 100,
              },
              lg: {
                url: '../assets/codegov-logo.png',
                size: 100,
                width: 100,
                height: 100,
              },
              xl: {
                url: '../assets/codegov-logo.png',
                size: 100,
                width: 100,
                height: 100,
              },
              xxl: {
                url: '../assets/codegov-logo.png',
                size: 100,
                width: 100,
                height: 100,
              },
            },
          ],
          reviewCommits: [
            {
              id: 1n,
              reviewId: 1n,
              commitId: '1',
              reviewed: 1,
              matchesDescription: 1,
              summary: 'This is a commit summary',
              highlights: 'This is a commit highlight',
            },
            {
              id: 2n,
              reviewId: 1n,
              commitId: '2',
              reviewed: 1,
              matchesDescription: 0,
              summary: 'This is a commit summary',
              highlights: 'This is a commit highlight',
            },
          ],
        },
      ]),
    );
    this.proposalReviewListSubject.next(
      this.proposalReviewListSubject.getValue().concat([
        {
          id: 1n,
          proposalId: proposalId,
          reviewerId: reviewerId,
          reviewerVote: 'ADOPT',
          state: 'Completed',
          lastSaved: new Date(),
          timeSpent: 260,
          summary: 'This is a review summary',
          buildReproduced: true,
          buildImages: [
            {
              sm: {
                url: '../assets/apple-touch-icon.png',
                size: 10,
                width: 10,
                height: 10,
              },
              md: {
                url: '../assets/apple-touch-icon.png',
                size: 100,
                width: 100,
                height: 100,
              },
              lg: {
                url: '../assets/apple-touch-icon.png',
                size: 100,
                width: 100,
                height: 100,
              },
              xl: {
                url: '../assets/apple-touch-icon.png',
                size: 100,
                width: 100,
                height: 100,
              },
              xxl: {
                url: '../assets/apple-touch-icon.png',
                size: 100,
                width: 100,
                height: 100,
              },
            },
            {
              sm: {
                url: '../assets/codegov-logo.png',
                size: 10,
                width: 10,
                height: 10,
              },
              md: {
                url: '../assets/codegov-logo.png',
                size: 100,
                width: 100,
                height: 100,
              },
              lg: {
                url: '../assets/codegov-logo.png',
                size: 100,
                width: 100,
                height: 100,
              },
              xl: {
                url: '../assets/codegov-logo.png',
                size: 100,
                width: 100,
                height: 100,
              },
              xxl: {
                url: '../assets/codegov-logo.png',
                size: 100,
                width: 100,
                height: 100,
              },
            },
          ],
          reviewCommits: [
            {
              id: 1n,
              reviewId: 1n,
              commitId: '1',
              reviewed: 1,
              matchesDescription: 1,
              summary: 'This is a commit summary',
              highlights: 'This is a commit highlight',
            },
            {
              id: 2n,
              reviewId: 1n,
              commitId: '2',
              reviewed: 1,
              matchesDescription: 0,
              summary: 'This is a commit summary',
              highlights: 'This is a commit highlight',
            },
          ],
        },
      ]),
    );
  }
}
