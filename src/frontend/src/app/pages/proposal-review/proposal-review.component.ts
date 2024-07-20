import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { CardComponent } from '@cg/angular-ui';
import { ProposalReviewStatus, ProposalReviewVote } from '~core/api';
import {
  ProfileService,
  ProposalService,
  ProposalState,
  ReviewService,
} from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { isNotNil, routeParam } from '~core/utils';

@Component({
  selector: 'app-proposal-review',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    KeyValueGridComponent,
    ValueColComponent,
    KeyColComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        @include page-content;
      }

      .review__details,
      .review__commit {
        margin-bottom: size(6);
      }

      .review__vote--adopt {
        font-weight: bold;
        color: $success;
      }

      .review__vote--reject {
        font-weight: bold;
        color: $error;
      }

      .review__image {
        height: size(10);
        padding-right: size(1);
      }
    `,
  ],
  template: `
    @if (currentReview(); as review) {
      @if (currentProposal(); as proposal) {
        <h1 class="h1">
          Review for proposal {{ review.proposalId }} by AnonReviewer
        </h1>

        <cg-card class="review__details">
          <div slot="cardContent">
            <app-key-value-grid [columnNumber]="1">
              <app-key-col id="proposal-title">Proposal title</app-key-col>
              <app-value-col aria-labelledby="proposal-title">
                <a [routerLink]="['/', proposal.ns_proposal_id]">
                  {{ proposal.title }}
                </a>
              </app-value-col>

              <app-key-col id="review-vote">Reviewer vote</app-key-col>
              <app-value-col
                aria-labelledby="review-vote"
                [ngClass]="{
                  'review__vote--adopt':
                    review.vote === ProposalReviewVote().Adopt,
                  'review__vote--reject':
                    review.vote === ProposalReviewVote().Reject,
                }"
              >
                {{ review.vote }}
              </app-value-col>

              <app-key-col id="review-time">Time spent</app-key-col>
              <app-value-col aria-labelledby="review-time">
                @if (review.reviewDurationMins) {
                  {{ review.reviewDurationMins / 60 | number: '1.0-0' }} hours
                  {{ review.reviewDurationMins % 60 }} minutes
                } @else {
                  N/A
                }
              </app-value-col>

              <app-key-col id="review-summary">Summary</app-key-col>
              <app-value-col aria-labelledby="review-summary">
                {{ review.summary }}
              </app-value-col>

              <app-key-col id="review-build">Build reproduced</app-key-col>
              <app-value-col aria-labelledby="review-build">
                {{ review.buildReproduced ? 'Yes' : 'No' }}
              </app-value-col>

              <app-key-col id="review-images">
                Build verification images
              </app-key-col>
              <app-value-col aria-labelledby="review-mages">
                @for (
                  image of review.reproducedBuildImageId;
                  track image.sm.url
                ) {
                  <a [href]="image.xxl.url" target="_blank">
                    <img [src]="image.sm.url" class="review__image" />
                  </a>
                }
              </app-value-col>
            </app-key-value-grid>

            <div class="btn-group">
              @if (
                isReviewOwner() &&
                proposal.state === ProposalState().InProgress &&
                review.status === ProposalReviewStatus().Published
              ) {
                <a
                  class="btn btn--outline"
                  [routerLink]="['/review', review.id, 'edit']"
                >
                  Reopen review
                </a>
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

                  <app-key-col [id]="'highlights-id-' + i">
                    Commit highlights
                  </app-key-col>
                  <app-value-col [attr.labelledby]="'highlights-id-' + i">
                    {{ commit.details.highlights }}
                  </app-value-col>
                }
              </app-key-value-grid>
            </div>
          </cg-card>
        }
      }
    }
  `,
})
export class ProposalReviewComponent {
  public readonly ProposalReviewStatus = signal(ProposalReviewStatus);
  public readonly ProposalReviewVote = signal(ProposalReviewVote);
  public readonly ProposalState = signal(ProposalState);

  public readonly userProfile = toSignal(this.profileService.userProfile$);
  public readonly isReviewOwner = computed(
    () => this.userProfile()?.id === this.currentReview()?.userId,
  );

  public readonly currentReview = toSignal(this.reviewService.currentReview$);
  public readonly currentProposalId = computed(
    () => this.currentReview()?.proposalId,
  );
  public readonly currentProposal = toSignal(
    this.proposalService.currentProposal$,
  );

  constructor(
    private readonly reviewService: ReviewService,
    private readonly proposalService: ProposalService,
    private readonly profileService: ProfileService,
  ) {
    routeParam('id').subscribe(reviewId => {
      this.reviewService.loadReview(reviewId);
    });

    if (isNotNil(this.currentProposalId())) {
      const proposalId = this.currentProposalId()!;
      this.proposalService.setCurrentProposalId(proposalId);
    }
    this.proposalService.loadProposalList();
  }
}
