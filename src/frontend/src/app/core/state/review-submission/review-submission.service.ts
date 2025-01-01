import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  Subscription,
  distinctUntilChanged,
  from,
  of,
} from 'rxjs';

import {
  ReviewApiService,
  GetProposalReviewResponse,
  CommitReviewApiService,
  GetProposalReviewCommitResponse,
  UpdateProposalReviewRequest,
  ReviewCommitDetails,
} from '../../api';
import { batchApiCall, filterNotNil, isNil, isNotNil } from '../../utils';

export interface UiProposalReviewCommit {
  apiId: string | null;
  uiId: string;
  commit: {
    commitSha: string | null;
    details: ReviewCommitDetails;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ReviewSubmissionService {
  private readonly reviewApiService = inject(ReviewApiService);
  private readonly commitReviewApiService = inject(CommitReviewApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly reviewSubject =
    new BehaviorSubject<GetProposalReviewResponse | null>(null);
  public readonly review$ = this.reviewSubject
    .asObservable()
    .pipe(distinctUntilChanged());
  private get review(): GetProposalReviewResponse {
    const review = this.reviewSubject.value;
    if (isNil(review)) {
      throw new Error('Review is not loaded');
    }

    return review;
  }

  private readonly commitsSubject = new BehaviorSubject<
    UiProposalReviewCommit[] | null
  >(null);
  public readonly commits$ = this.commitsSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  private readonly pendingReviewSubject =
    new BehaviorSubject<UpdateProposalReviewRequest | null>(null);

  private commits = new Map<string | null, UiProposalReviewCommit>();
  private commitObservables = new Map<
    string | null,
    BehaviorSubject<UiProposalReviewCommit | null>
  >();
  private commitSubscriptions = new Map<string | null, Subscription>();
  private commitCreatePromises = new Map<
    string | null,
    Promise<GetProposalReviewCommitResponse>
  >();

  private listId = 0;
  private proposalId: string | null = null;

  constructor() {
    this.pendingReviewSubject
      .pipe(
        takeUntilDestroyed(),
        filterNotNil(),
        batchApiCall(review =>
          from(
            this.reviewApiService.updateProposalReview({
              proposalId: this.proposalId!,
              summary: review.summary,
              reviewDurationMins: review.reviewDurationMins,
              buildReproduced: review.buildReproduced,
              vote: review.vote,
            }),
          ),
        ),
      )
      .subscribe({});
  }

  public async loadOrCreateReview(proposalId: string): Promise<void> {
    this.commits.clear();
    this.commitObservables.clear();
    this.commitSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.commitSubscriptions.clear();

    this.reviewSubject.next(null);
    this.proposalId = proposalId;

    const res = await this.reviewApiService.getOrCreateMyProposalReview({
      proposalId,
    });

    res.commits.forEach(commit => {
      this.commits.set(commit.commitSha, {
        apiId: commit.id,
        uiId: String(this.listId++),
        commit: {
          commitSha: commit.commitSha,
          details: commit.details,
        },
      });

      const [observable, subscription] = this.createCommitObservable();
      this.commitObservables.set(commit.commitSha, observable);
      this.commitSubscriptions.set(commit.commitSha, subscription);
    });

    this.reviewSubject.next(res);
    this.commitsSubject.next(Array.from(this.commits.values()));
  }

  public updateReview(updatedReview: UpdateProposalReviewRequest): void {
    if (isNil(this.proposalId)) {
      throw new Error('Tried to update a review without selecting a proposal');
    }

    this.pendingReviewSubject.next(updatedReview);
  }

  public addCommit(): void {
    if (isNil(this.proposalId)) {
      throw new Error(
        'Tried to add a commit to a review without selecting a proposal',
      );
    }

    if (isNotNil(this.commits.get(null))) {
      throw new Error(
        `An existing empty commit for proposal with Id ${this.proposalId} already exists`,
      );
    }

    this.commits.set(null, {
      apiId: null,
      uiId: String(this.listId++),
      commit: {
        commitSha: null,
        details: {
          reviewed: null,
        },
      },
    });
    this.commitsSubject.next(Array.from(this.commits.values()));
  }

  public async removeCommit(commitSha: string | null): Promise<void> {
    if (isNil(this.proposalId)) {
      throw new Error(
        'Tried to remove a commit from a review without selecting a proposal',
      );
    }

    const commit = this.commits.get(commitSha);
    if (isNil(commit)) {
      throw new Error(
        `Tried to remove a commit with SHA ${commitSha} from proposal with Id ${this.proposalId} but it does not exist`,
      );
    }

    this.commits.delete(commitSha);
    this.commitsSubject.next(Array.from(this.commits.values()));

    if (isNotNil(commit.apiId)) {
      commit;
      await this.commitReviewApiService.deleteProposalReviewCommit({
        proposalReviewCommitId: commit.apiId,
      });
    }
  }

  public async updateCommit(
    oldCommitSha: string | null,
    newCommitSha: string | null,
    newCommit: ReviewCommitDetails,
  ): Promise<void> {
    if (isNil(this.proposalId)) {
      throw new Error(
        'Tried to update a commit for a review without selecting a proposal',
      );
    }

    const oldLocalCommit = this.commits.get(oldCommitSha);
    if (isNil(oldLocalCommit)) {
      throw new Error(
        `Tried to update a commit with SHA ${oldCommitSha} from proposal with Id ${this.proposalId} but it does not exist`,
      );
    }

    if (oldCommitSha !== newCommitSha) {
      this.commits.delete(oldCommitSha);
    }
    const updatedCommit: UiProposalReviewCommit = {
      apiId: oldLocalCommit.apiId,
      uiId: oldLocalCommit.uiId,
      commit: {
        commitSha: newCommitSha,
        details: newCommit,
      },
    };
    this.commits.set(newCommitSha, updatedCommit);
    this.commitsSubject.next(Array.from(this.commits.values()));

    const existingPromise = this.commitCreatePromises.get(oldCommitSha);
    if (isNotNil(existingPromise)) {
      const oldRemoteCommit = await existingPromise;

      this.commits.set(newCommitSha, {
        apiId: oldRemoteCommit.id,
        uiId: oldLocalCommit.uiId,
        commit: {
          commitSha: newCommitSha,
          details: newCommit,
        },
      });
    }

    if (
      isNil(oldLocalCommit.apiId) &&
      isNotNil(newCommitSha) &&
      isNotNil(newCommit.reviewed)
    ) {
      const promise = this.commitReviewApiService.createProposalCommitReview({
        commitSha: newCommitSha,
        proposalReviewId: this.review.id,
        reviewed: newCommit.reviewed,
      });
      this.commitCreatePromises.set(oldCommitSha, promise);

      const createdCommit = await promise;
      updatedCommit.apiId = createdCommit.id;

      this.commitCreatePromises.delete(oldCommitSha);
      this.commits.set(newCommitSha, updatedCommit);

      const [observable, subscription] = this.createCommitObservable();
      this.commitObservables.set(oldCommitSha, observable);
      this.commitSubscriptions.set(oldCommitSha, subscription);
    }

    if (isNil(oldLocalCommit.apiId)) {
      return;
    }

    if (oldCommitSha !== newCommitSha) {
      this.handleCommitShaChange(oldCommitSha, newCommitSha);
    }

    this.commitObservables.get(newCommitSha)?.next(updatedCommit);
  }

  private handleCommitShaChange(
    previousCommitSha: string | null,
    newCommitSha: string | null,
  ): void {
    const prevObservable = this.commitObservables.get(previousCommitSha);
    const prevSubscription = this.commitSubscriptions.get(previousCommitSha);

    if (isNil(prevObservable) || isNil(prevSubscription)) {
      throw new Error(
        `Missing observable or subscription for commit ${previousCommitSha}`,
      );
    }

    this.commitObservables.delete(previousCommitSha);
    this.commitSubscriptions.delete(previousCommitSha);

    this.commitObservables.set(newCommitSha, prevObservable);
    this.commitSubscriptions.set(newCommitSha, prevSubscription);
  }

  private createCommitObservable(): [
    BehaviorSubject<UiProposalReviewCommit | null>,
    Subscription,
  ] {
    const commitSubject = new BehaviorSubject<UiProposalReviewCommit | null>(
      null,
    );

    const subscription = commitSubject
      .asObservable()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filterNotNil(),
        batchApiCall(commit =>
          isNotNil(commit.apiId)
            ? from(
                this.commitReviewApiService.updateProposalReviewCommit({
                  proposalReviewCommitId: commit.apiId!,
                  details: commit.commit.details,
                }),
              )
            : of(null),
        ),
      )
      .subscribe({});

    return [commitSubject, subscription];
  }
}
