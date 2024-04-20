import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ProposalReview } from './review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  public reviewListSubject = new BehaviorSubject<ProposalReview[]>([]);
  public reviewList$ = this.reviewListSubject.asObservable();

  private currentReviewSubject = new BehaviorSubject<Review | null>(null);
  public currentReview$ = this.currentReviewSubject.asObservable();

  //TODO: loading by proposal ID using backend endpoint
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async loadReviewList(_proposalId: bigint): Promise<void> {
    this.reviewListSubject.next([
      {
        id: 1n,
        proposalId: 1n,
        reviewerId: 1n,
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
        reviewerId: 2n,
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
        reviewerId: 3n,
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
      proposalId: 8n,
      reviewerId: 1n,
      reviewerVote: 'ADOPT',
      state: 'Completed',
      lastSaved: new Date(),
      timeSpent: 6,
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
}
