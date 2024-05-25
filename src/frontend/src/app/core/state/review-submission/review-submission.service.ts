// import { DestroyRef, Injectable, inject } from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import {
//   BehaviorSubject,
//   Subscription,
//   distinctUntilChanged,
//   from,
// } from 'rxjs';

// import {
//   ReviewApiService,
//   GetProposalReviewResponse,
//   CommitReviewApiService,
// } from '../../api';
// import { batchApiCall, filterNotNil, isNil, isNotNil } from '../../utils';

// let commitId = 0;

// @Injectable({
//   providedIn: 'root',
// })
// export class ReviewSubmissionService {
//   private readonly reviewApiService = inject(ReviewApiService);
//   private readonly commitReviewApiService = inject(CommitReviewApiService);
//   private readonly destroyRef = inject(DestroyRef);

//   private readonly reviewSubject =
//     new BehaviorSubject<GetProposalReviewResponse | null>(null);
//   public readonly review$ = this.reviewSubject
//     .asObservable()
//     .pipe(distinctUntilChanged());
//   private get review(): GetProposalReviewResponse {
//     const review = this.reviewSubject.value;
//     if (isNil(review)) {
//       throw new Error('Review is not loaded');
//     }

//     return review;
//   }

//   private readonly commitsSubject = new BehaviorSubject<
//     ReviewCommitSubmission[] | null
//   >(null);
//   public readonly commits$ = this.commitsSubject
//     .asObservable()
//     .pipe(distinctUntilChanged());

//   private readonly pendingReviewSubject =
//     new BehaviorSubject<GetProposalReviewResponse | null>(null);

//   private commits = new Map<string | null, ReviewCommitSubmission>();
//   private commitObservables = new Map<
//     string | null,
//     BehaviorSubject<ReviewCommitSubmission | null>
//   >();
//   private commitSubscriptions = new Map<string | null, Subscription>();
//   private commitCreatePromises = new Map<
//     string | null,
//     Promise<ReviewCommitSubmission>
//   >();

//   private proposalId: string | null = null;

//   constructor() {
//     this.pendingReviewSubject
//       .pipe(
//         takeUntilDestroyed(),
//         filterNotNil(),
//         batchApiCall(review =>
//           from(
//             this.reviewApiService.updateProposalReview({
//               ...review,
//               proposalId: this.proposalId!,
//             }),
//           ),
//         ),
//       )
//       .subscribe({});
//   }

//   public async loadOrCreateReview(proposalId: string): Promise<void> {
//     this.commits.clear();
//     this.commitObservables.clear();
//     this.commitSubscriptions.forEach(subscription => {
//       subscription.unsubscribe();
//     });
//     this.commitSubscriptions.clear();

//     this.reviewSubject.next(null);
//     this.proposalId = proposalId;

//     const res = await this.reviewApiService.getOrCreateMyProposalReview({
//       proposalId,
//     });

//     const review = mapReviewSubmissionResponse(res.ok);
//     const commits = mapReviewCommitListSubmissionResponse(res.ok);

//     commits.forEach(commit => {
//       this.commits.set(commit.commitSha, commit);

//       const [observable, subscription] = this.createCommitObservable();
//       this.commitObservables.set(commit.commitSha, observable);
//       this.commitSubscriptions.set(commit.commitSha, subscription);
//     });

//     this.reviewSubject.next(review);
//     this.commitsSubject.next(Array.from(this.commits.values()));
//   }

//   public updateReview(updatedReview: GetProposalReviewResponse): void {
//     if (isNil(this.proposalId)) {
//       throw new Error('Tried to update a review without selecting a proposal');
//     }

//     this.reviewSubject.next(updatedReview);
//     this.pendingReviewSubject.next(updatedReview);
//   }

//   public addCommit(): void {
//     if (isNil(this.proposalId)) {
//       throw new Error(
//         'Tried to add a commit to a review without selecting a proposal',
//       );
//     }

//     if (isNotNil(this.commits.get(null))) {
//       throw new Error(
//         `An existing empty commit for proposal with Id ${this.proposalId} already exists`,
//       );
//     }

//     this.commits.set(null, {
//       id: null,
//       listId: String(commitId++),
//       commitSha: null,
//       details: {
//         reviewed: null,
//       },
//     });
//     this.commitsSubject.next(Array.from(this.commits.values()));
//     console.log('Commits', Array.from(this.commits.values()));
//   }

//   public async removeCommit(commitSha: string | null): Promise<void> {
//     if (isNil(this.proposalId)) {
//       throw new Error(
//         'Tried to remove a commit from a review without selecting a proposal',
//       );
//     }

//     const commit = this.commits.get(commitSha);
//     if (isNil(commit)) {
//       throw new Error(
//         `Tried to remove a commit with SHA ${commitSha} from proposal with Id ${this.proposalId} but it does not exist`,
//       );
//     }

//     this.commits.delete(commitSha);
//     this.commitsSubject.next(Array.from(this.commits.values()));

//     if (isNotNil(commit.id)) {
//       await this.reviewApiService.deleteProposalCommitReview({
//         id: commit.id,
//       });
//     }
//   }

//   public async updateCommit(
//     commitSha: string | null,
//     updatedCommit: ReviewCommitSubmission,
//   ): Promise<void> {
//     console.log('Update commit', commitSha, updatedCommit);

//     if (isNil(this.proposalId)) {
//       throw new Error(
//         'Tried to update a commit for a review without selecting a proposal',
//       );
//     }

//     const commit = this.commits.get(commitSha);
//     if (isNil(commit)) {
//       throw new Error(
//         `Tried to update a commit with SHA ${commitSha} from proposal with Id ${this.proposalId} but it does not exist`,
//       );
//     }

//     if (commitSha !== updatedCommit.commitSha) {
//       this.commits.delete(commitSha);
//     }
//     this.commits.set(updatedCommit.commitSha, updatedCommit);
//     this.commitsSubject.next(Array.from(this.commits.values()));

//     const existingPromise = this.commitCreatePromises.get(commitSha);
//     if (isNotNil(existingPromise)) {
//       console.log('Creation in progress, waiting...');
//       const previousCommit = await existingPromise;
//       updatedCommit = {
//         ...previousCommit,
//         ...updatedCommit,
//         details: {
//           ...previousCommit.details,
//           ...updatedCommit.details,
//         },
//         id: previousCommit.id,
//       };

//       this.commits.set(updatedCommit.commitSha, updatedCommit);
//       console.log('merged update', updatedCommit);
//     }

//     if (
//       isNil(updatedCommit.id) &&
//       isNotNil(updatedCommit.commitSha) &&
//       isNotNil(updatedCommit.details.reviewed)
//     ) {
//       console.log('Creating commit');
//       const promise = this.reviewApiService.createProposalCommitReview({
//         commitSha: updatedCommit.commitSha,
//         proposalReviewId: this.review.id,
//         reviewed: updatedCommit.details.reviewed,
//       });
//       this.commitCreatePromises.set(commitSha, promise);
//       updatedCommit = await promise;
//       this.commitCreatePromises.delete(commitSha);
//       this.commits.set(updatedCommit.commitSha, updatedCommit);

//       const [observable, subscription] = this.createCommitObservable();
//       this.commitObservables.set(commitSha, observable);
//       this.commitSubscriptions.set(commitSha, subscription);
//     }

//     if (isNil(updatedCommit.id)) {
//       return;
//     }

//     if (commitSha !== updatedCommit.commitSha) {
//       this.handleCommitShaChange(commitSha, updatedCommit.commitSha);
//     }

//     this.commitObservables.get(updatedCommit.commitSha)?.next(updatedCommit);
//   }

//   private handleCommitShaChange(
//     previousCommitSha: string | null,
//     newCommitSha: string | null,
//   ): void {
//     const prevObservable = this.commitObservables.get(previousCommitSha);
//     const prevSubscription = this.commitSubscriptions.get(previousCommitSha);

//     if (isNil(prevObservable) || isNil(prevSubscription)) {
//       throw new Error(`Missing observable or subscription`);
//     }

//     this.commitObservables.delete(previousCommitSha);
//     this.commitSubscriptions.delete(previousCommitSha);

//     this.commitObservables.set(newCommitSha, prevObservable);
//     this.commitSubscriptions.set(newCommitSha, prevSubscription);
//   }

//   private createCommitObservable(): [
//     BehaviorSubject<ReviewCommitSubmission | null>,
//     Subscription,
//   ] {
//     const commitSubject = new BehaviorSubject<ReviewCommitSubmission | null>(
//       null,
//     );

//     const subscription = commitSubject
//       .asObservable()
//       .pipe(
//         takeUntilDestroyed(this.destroyRef),
//         filterNotNil(),
//         batchApiCall(commit => {
//           console.log('Updating commit in the API nal');

//           return from(
//             this.commitReviewApiService.updateProposalReviewCommit(commit),
//           );
//         }),
//       )
//       .subscribe({});

//     return [commitSubject, subscription];
//   }
// }
