import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  BadgeComponent,
  CardComponent,
  CopyToClipboardComponent,
  LinkTextBtnComponent,
} from '@cg/angular-ui';
import { ProposalReviewStatus, ProposalState } from '~core/api';
import { ProfileService, ProposalService, ReviewService } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { isNil, isNotNil, routeParamSignal, toSyncSignal } from '~core/utils';

@Component({
  selector: 'app-proposal-review',
  imports: [
    CommonModule,
    RouterLink,
    CardComponent,
    BadgeComponent,
    CopyToClipboardComponent,
    KeyValueGridComponent,
    ValueColComponent,
    KeyColComponent,
    LinkTextBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    :host {
      @include common.page-content;
    }

    .review__details,
    .review__commit {
      margin-bottom: common.size(6);
    }

    .answer--positive {
      color: common.$success;
    }

    .answer--negative {
      color: common.$error;
    }
  `,
  template: `
    @let review = this.currentReview();
    @let proposal = this.currentProposal();
    @let reviewer = this.currentReviewer();
    @let ProposalReviewStatus = this.ProposalReviewStatus();
    @let ProposalState = this.ProposalState();
    @let isReviewOwner = this.isReviewOwner();
    @let currentReviewSummary = this.currentReviewSummary();

    @if (review && proposal && reviewer) {
      <div class="page-heading">
        <h1 class="h3">
          Review for proposal {{ proposal.nsProposalId }} by
          {{ reviewer.username }}
        </h1>

        @if (review.status === ProposalReviewStatus.Published) {
          <cg-badge theme="success">Published</cg-badge>
        } @else {
          <cg-badge theme="error">Draft</cg-badge>
        }
      </div>

      <cg-card class="review__details">
        <div slot="cardContent">
          <app-key-value-grid [columnNumber]="1">
            <app-key-col id="proposal-title">Proposal title</app-key-col>
            <app-value-col aria-labelledby="proposal-title">
              <a [routerLink]="['/', proposal.id]">
                {{ proposal.title }}
              </a>
            </app-value-col>

            <app-key-col id="review-summary">Summary</app-key-col>
            <app-value-col aria-labelledby="review-summary">
              {{ review.summary }}
            </app-value-col>

            <app-key-col id="review-vote">Reviewer vote</app-key-col>
            <app-value-col aria-labelledby="review-vote">
              @switch (review.vote) {
                @case (true) {
                  <span class="answer--positive">Adopt</span>
                }
                @case (false) {
                  <span class="answer--negative">Reject</span>
                }
                @default {
                  No vote
                }
              }
            </app-value-col>

            <app-key-col id="review-build">Build reproduction</app-key-col>
            <app-value-col aria-labelledby="review-build">
              @switch (review.buildReproduced) {
                @case (true) {
                  <span class="answer--positive">Successful</span>
                }
                @case (false) {
                  <span class="answer--negative">Unsuccessful</span>
                }
                @default {
                  Not applicable
                }
              }
            </app-value-col>

            <app-key-col id="review-images">
              Build verification image
            </app-key-col>
            <app-value-col aria-labelledby="review-mages">
              @for (image of review.images; track image.path) {
                <a [href]="image.path" target="_blank">
                  <img [src]="image.path" />
                </a>
              } @empty {
                No build verification image was provided for this review.
              }
            </app-value-col>
          </app-key-value-grid>

          <div class="btn-group">
            @if (isReviewOwner && proposal.state === ProposalState.InProgress) {
              <cg-link-text-btn [routerLink]="['/review', proposal.id, 'edit']">
                Edit review
              </cg-link-text-btn>
            }
          </div>
        </div>
      </cg-card>

      <h2 class="h4">Commits</h2>
      @for (commit of review.commits; track commit.id; let i = $index) {
        <cg-card class="review__commit">
          <div slot="cardContent">
            <app-key-value-grid [columnNumber]="1">
              <app-key-col [id]="'commit-id-' + i">ID</app-key-col>
              <app-value-col [attr.labelledby]="'commit-id-' + i">
                <a
                  [href]="
                    'https://github.com/dfinity/ic/commit/' + commit.commitSha
                  "
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  {{ commit.commitSha }}
                </a>
              </app-value-col>

              <app-key-col [id]="'reviewed-' + i">Reviewed</app-key-col>
              <app-value-col [attr.labelledby]="'reviewed-' + i">
                {{ commit.details.reviewed ? 'Yes' : 'No' }}
              </app-value-col>

              @if (commit.details.reviewed) {
                <app-key-col [id]="'matches-descr-id-' + i">
                  Matches description
                </app-key-col>
                <app-value-col [attr.labelledby]="'matches-descr-id-' + i">
                  {{ commit.details.matchesDescription ? 'Yes' : 'No' }}
                </app-value-col>

                <app-key-col [id]="'summary-id-' + i">
                  Commit summary
                </app-key-col>
                <app-value-col [attr.labelledby]="'summary-id-' + i">
                  {{ commit.details.comment }}
                </app-value-col>
              }
            </app-key-value-grid>
          </div>
        </cg-card>
      }

      @if (isReviewOwner && currentReviewSummary) {
        <h2 class="h4">Proposal summary markdown</h2>

        <cg-copy-to-clipboard
          type="textarea"
          [value]="currentReviewSummary.summaryMarkdown"
        />
      }
    }
  `,
})
export class ProposalReviewComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly proposalService = inject(ProposalService);
  private readonly profileService = inject(ProfileService);

  public readonly ProposalReviewStatus = signal(ProposalReviewStatus);
  public readonly ProposalState = signal(ProposalState);

  public readonly currentReviewId = routeParamSignal('reviewId');

  public readonly currentReview = toSyncSignal(
    this.reviewService.currentReview$,
  );
  public readonly currentReviewSummary = toSyncSignal(
    this.reviewService.currentUserReviewSummary$,
  );
  private readonly currentUser$ = toSyncSignal(
    this.profileService.currentUser$,
  );
  public readonly currentProposal = toSyncSignal(
    this.proposalService.currentProposal$,
  );
  private readonly reviewers = toSyncSignal(this.profileService.reviewers$);

  public readonly currentReviewer = computed(() => {
    const reviewerId = this.reviewOwnerId();
    const reviewers = this.reviewers();
    if (isNil(reviewerId) || isNil(reviewers)) {
      return null;
    }

    return reviewers[reviewerId] ?? null;
  });

  public readonly isReviewOwner = computed(() => {
    const reviewOwnerId = this.reviewOwnerId();
    const currentUserId = this.currentUserId();

    if (isNil(reviewOwnerId) || isNil(currentUserId)) {
      return false;
    }

    return reviewOwnerId === currentUserId;
  });

  private readonly reviewOwnerId = computed(() => {
    const review = this.currentReview();
    if (isNil(review)) {
      return null;
    }

    return review.userId;
  });

  private readonly currentUserId = computed(() => {
    const user = this.currentUser$();
    if (isNil(user)) {
      return null;
    }

    return user.id;
  });

  private readonly currentProposalId = computed(() => {
    const currentReview = this.currentReview();
    if (isNil(currentReview)) {
      return null;
    }

    return currentReview.proposalId;
  });

  constructor() {
    effect(() => {
      const reviewId = this.currentReviewId();

      if (isNotNil(reviewId)) {
        this.reviewService.loadReview(reviewId);
      }
    });

    effect(() => {
      const isReviewOwner = this.isReviewOwner();
      const currentProposalId = this.currentProposalId();

      if (isReviewOwner && isNotNil(currentProposalId)) {
        this.reviewService.loadReviewSummary(currentProposalId);
      }
    });

    effect(() => {
      const proposalId = this.currentProposalId();

      if (isNotNil(proposalId)) {
        this.proposalService.setCurrentProposalId(proposalId);
      }
    });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposalList(ProposalState.Any);
    this.profileService.loadReviewerProfiles();
  }
}
