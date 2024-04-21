import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';
import { ProposalService, ReviewService } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { isNotNil } from '~core/utils';

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
        color: $success;
      }

      .review__vote--reject {
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
      <h1 class="h1">
        Review for proposal {{ review.proposalId }} by AnonReviewer
      </h1>

      <cg-card class="review__details">
        <div slot="cardContent">
          <app-key-value-grid [columnNumber]="1">
            @if (currentProposal(); as proposal) {
              <app-key-col id="proposal-title">Proposal title</app-key-col>
              <app-value-col aria-labelledby="proposal-title">
                <a [routerLink]="['/', proposal.id]">
                  {{ proposal.title }}
                </a>
              </app-value-col>
            }

            <app-key-col id="review-vote">Reviewer vote</app-key-col>
            <app-value-col
              aria-labelledby="review-vote"
              [ngClass]="{
                'review__vote--adopt': review.reviewerVote === 'ADOPT',
                'review__vote--reject': review.reviewerVote === 'REJECT'
              }"
            >
              {{ review.reviewerVote }}
            </app-value-col>

            <app-key-col id="review-time">Time spent</app-key-col>
            <app-value-col aria-labelledby="review-time">
              {{ review.timeSpent / 60 | number: '1.0-0' }} hours
              {{ review.timeSpent % 60 }} minutes
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
              @for (image of review.buildImages; track image.sm.url) {
                <a [href]="image.xxl.url" target="_blank">
                  <img [src]="image.sm.url" class="review__image" />
                </a>
              }
            </app-value-col>
          </app-key-value-grid>
        </div>
      </cg-card>

      <h2 class="h4">Commits</h2>
      @for (
        commit of review.reviewCommits;
        track commit.commitId;
        let i = $index
      ) {
        <cg-card class="review__commit">
          <div slot="cardContent">
            <app-key-value-grid [columnNumber]="1">
              <app-key-col [id]="'commit-id-' + i">ID</app-key-col>
              <app-value-col [attr.labelledby]="'commit-id-' + i">
                <a
                  [href]="
                    'https://github.com/dfinity/ic/commit/' + commit.commitId
                  "
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  {{ commit.commitId }}
                </a>
              </app-value-col>

              <app-key-col [id]="'reviewed-' + i">Reviewed</app-key-col>
              <app-value-col [attr.labelledby]="'reviewed-' + i">
                {{ commit.reviewed === 1 ? 'Yes' : 'No' }}
              </app-value-col>

              @if (commit.reviewed === 1) {
                <app-key-col [id]="'matches-descr-id-' + i">
                  Matches description
                </app-key-col>
                <app-value-col [attr.labelledby]="'matches-descr-id-' + i">
                  {{ commit.matchesDescription === 1 ? 'Yes' : 'No' }}
                </app-value-col>

                <app-key-col [id]="'summary-id-' + i">
                  Commit summary
                </app-key-col>
                <app-value-col [attr.labelledby]="'summary-id-' + i">
                  {{ commit.summary }}
                </app-value-col>

                <app-key-col [id]="'highlights-id-' + i">
                  Commit highlights
                </app-key-col>
                <app-value-col [attr.labelledby]="'highlights-id-' + i">
                  {{ commit.highlights }}
                </app-value-col>
              }
            </app-key-value-grid>
          </div>
        </cg-card>
      }
    }
  `,
})
export class ProposalReviewComponent {
  public readonly reviewIdFromRoute$ = this.route.params.pipe(
    map(params => {
      try {
        return BigInt(params['id']);
      } catch (error) {
        return null;
      }
    }),
    filter(Boolean),
  );
  public readonly currentReview = toSignal(this.reviewService.currentReview$);
  public readonly currentProposalId = computed(
    () => this.currentReview()?.proposalId,
  );
  public readonly currentProposal = toSignal(
    this.proposalService.currentProposal$,
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly reviewService: ReviewService,
    private readonly proposalService: ProposalService,
  ) {
    this.reviewIdFromRoute$.pipe(takeUntilDestroyed()).subscribe(reviewId => {
      this.reviewService.loadReview(reviewId);
    });

    if (isNotNil(this.currentProposalId())) {
      const proposalId = this.currentProposalId()!;
      this.proposalService.setCurrentProposalId(proposalId);
    }

    this.proposalService.loadProposalList();
  }
}
