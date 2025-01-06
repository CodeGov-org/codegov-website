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
  ProposalReviewStatus,
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
          from(this.reviewApiService.updateProposalReview(review)),
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
    this.emitUpdatedComits();
  }

  public updateReview(updatedReview: UpdateProposalReviewRequest): void {
    if (isNil(this.proposalId)) {
      throw new Error('Tried to update a review without selecting a proposal');
    }

    this.pendingReviewSubject.next(updatedReview);
  }

  public async publishReview(): Promise<void> {
    await this.updateStatus(ProposalReviewStatus.Published);
  }

  public async editReview(): Promise<void> {
    await this.updateStatus(ProposalReviewStatus.Draft);
  }

  private async updateStatus(status: ProposalReviewStatus): Promise<void> {
    if (isNil(this.proposalId)) {
      throw new Error(
        'Tried to update review status without selecting a proposal',
      );
    }

    const currentReview = this.reviewSubject.value;
    if (isNil(currentReview)) {
      throw new Error('Tried to update review status before review was loaded');
    }

    await this.reviewApiService.updateProposalReview({
      proposalId: this.proposalId,
      status,
    });

    this.reviewSubject.next({
      ...currentReview,
      ...(this.pendingReviewSubject.value || {}),
      status,
    });
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

    // only add the commit locally first, once we have the minimum
    // required information to create it, we will make the
    // API call to create it in `updateCommit` method
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
    this.emitUpdatedComits();
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

    // do the optimistic update first
    this.commits.delete(commitSha);
    this.emitUpdatedComits();

    // before deleting the commit, we make sure to wait for any
    // pending creation calls to complete,
    // otherwise we won't have the API ID to delete it
    const createdCommitId = await this.pendingCommitCreation(commit);

    await this.deleteCommit({
      ...commit,
      apiId: createdCommitId ?? commit.apiId,
    });
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

    // do the optimistic update first
    if (oldCommitSha !== newCommitSha) {
      this.commits.delete(oldCommitSha);
    }
    let updatedCommit: UiProposalReviewCommit = {
      apiId: oldLocalCommit.apiId,
      uiId: oldLocalCommit.uiId,
      commit: {
        commitSha: newCommitSha,
        details: newCommit,
      },
    };
    this.commits.set(newCommitSha, updatedCommit);
    this.emitUpdatedComits();

    // if commit creation is pending, we wait for it to complete
    const createdCommitId = await this.pendingCommitCreation(updatedCommit);
    if (isNotNil(createdCommitId)) {
      const createdCommit = this.updateCommitWithId(
        newCommitSha,
        createdCommitId,
      );
      if (isNotNil(createdCommit)) {
        updatedCommit = createdCommit;
        this.commits.set(newCommitSha, createdCommit);
      }
    }

    // if the commit is not created yet or the commit sha has changed,
    // and we have all the required information to create it,
    // we proceed with the creation
    if (
      (isNil(updatedCommit?.apiId) || oldCommitSha !== newCommitSha) &&
      isNotNil(newCommitSha) &&
      isNotNil(newCommit.reviewed)
    ) {
      const createdCommitId = await this.createCommit(
        newCommitSha,
        newCommit.reviewed,
      );

      const createdCommit = this.updateCommitWithId(
        newCommitSha,
        createdCommitId,
      );
      if (isNotNil(createdCommit)) {
        updatedCommit = createdCommit;
        this.commits.set(newCommitSha, createdCommit);
      }
    }

    // if the commit was not previously created, we don't need to make
    // any further updates
    if (isNil(oldLocalCommit.apiId)) {
      return;
    }

    // if the commit was previously created, and the commit sha has changed,
    // we need to delete the old commit on the API
    if (oldCommitSha !== newCommitSha) {
      await this.deleteCommit(oldLocalCommit);
    }

    this.commitObservables.get(newCommitSha)?.next(updatedCommit);
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
                  proposalReviewCommitId: commit.apiId,
                  details: commit.commit.details,
                }),
              )
            : of(null),
        ),
      )
      .subscribe({});

    return [commitSubject, subscription];
  }

  private emitUpdatedComits(): void {
    this.commitsSubject.next(Array.from(this.commits.values()));
  }

  private async deleteCommit(
    pendingCommit: UiProposalReviewCommit,
  ): Promise<void> {
    this.commitSubscriptions.get(pendingCommit.commit.commitSha)?.unsubscribe();
    this.commitSubscriptions.delete(pendingCommit.commit.commitSha);
    this.commitObservables.delete(pendingCommit.commit.commitSha);

    // if there's no API ID,
    // it means the commit was never created on the API side
    if (isNotNil(pendingCommit.apiId)) {
      await this.commitReviewApiService.deleteProposalReviewCommit({
        proposalReviewCommitId: pendingCommit.apiId,
      });
    }
  }

  private async createCommit(
    commitSha: string,
    reviewed: boolean,
  ): Promise<string> {
    const review = this.reviewSubject.value;
    if (isNil(review)) {
      throw new Error(
        'Tried to create a commit for a review before it is loaded',
      );
    }

    const crateCommitPromise =
      this.commitReviewApiService.createProposalCommitReview({
        commitSha,
        reviewed,
        proposalReviewId: review.id,
      });
    this.commitCreatePromises.set(commitSha, crateCommitPromise);

    const createdCommit = await crateCommitPromise;

    this.commitCreatePromises.delete(commitSha);

    const [observable, subscription] = this.createCommitObservable();
    this.commitObservables.set(commitSha, observable);
    this.commitSubscriptions.set(commitSha, subscription);

    return createdCommit.id;
  }

  private async pendingCommitCreation(
    pendingCommit: UiProposalReviewCommit,
  ): Promise<string | null> {
    const existingPromise = this.commitCreatePromises.get(
      pendingCommit.commit.commitSha,
    );

    if (isNil(existingPromise)) {
      return null;
    }

    const createdCommit = await existingPromise;
    return createdCommit.id;
  }

  private updateCommitWithId(
    commitSha: string | null,
    apiId: string,
  ): UiProposalReviewCommit | null {
    // in case there was some optimistic updates,
    // we need to make sure we get the latest commit
    const currentCommit = this.commits.get(commitSha);

    // if the commit is now null, it means it was optimisitcally deleted,
    // so we don't need to update it. it will be deleted by the
    // `remoteCommit` method that waits for creation to complete before
    // deleting.
    if (isNotNil(currentCommit)) {
      return {
        ...currentCommit,
        apiId,
      };
    }

    return null;
  }
}
