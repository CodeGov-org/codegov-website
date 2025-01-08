import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  CardComponent,
  DashCircleIconComponent,
  CheckCircleIconComponent,
} from '@cg/angular-ui';
import { ProfileService, ReviewService } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { isNil, isNotNil, routeParamSignal, toSyncSignal } from '~core/utils';

@Component({
  selector: 'app-closed-proposal-summary',
  imports: [
    CardComponent,
    CommonModule,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    CheckCircleIconComponent,
    DashCircleIconComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    .summary,
    .review,
    .commit {
      margin-bottom: common.size(6);
    }

    .answer--positive {
      color: common.$success;
    }

    .answer--negative {
      color: common.$error;
    }

    .summary__vote {
      margin-bottom: common.size(4);
    }

    .summary__vote-position {
      display: flex;
      flex-direction: row;
    }

    .reject-icon {
      width: common.size(6);
      height: common.size(6);
      stroke: common.$error;
      margin-right: common.size(2);
    }

    .adopt-icon {
      width: common.size(6);
      height: common.size(6);
      stroke: common.$success;
      margin-right: common.size(2);
    }
  `,
  template: `
    @let reviews = this.reviews();
    @let reviewers = this.reviewers();
    @let commits = this.commits();
    @let proposalStats = this.proposalStats();

    @if (proposalStats) {
      <h2 class="h4">Review summary</h2>
      <cg-card class="summary">
        <div slot="cardContent">
          @if (reviews.length !== 0) {
            <div class="summary__vote">
              <div class="summary__vote-position">
                <cg-check-circle-icon class="adopt-icon"></cg-check-circle-icon>

                <p>
                  {{ proposalStats.adopt }} reviewer(s) voted to
                  <span class="answer--positive">adopt</span>
                  this proposal
                </p>
              </div>
              <div class="summary__vote-position">
                <cg-dash-circle-icon class="reject-icon"></cg-dash-circle-icon>

                <p>
                  {{ proposalStats.reject }} reviewer(s) voted to
                  <span class="answer--negative">reject</span>
                  this proposal
                </p>
              </div>
            </div>

            <div class="summary__verification">
              <p>
                {{ commits.length }} commit(s) reviewed by
                {{ reviews.length }} reviewers
              </p>
              <p>
                Build verified by
                {{ proposalStats.buildReproduced }} reviewer(s)
              </p>
            </div>
          } @else {
            No reviews were submitted for this proposal
          }
        </div>
      </cg-card>

      <h2 class="h4">Reviews</h2>
      @for (review of reviews; track review.id; let i = $index) {
        <cg-card class="review">
          <div slot="cardContent">
            <app-key-value-grid [columnNumber]="1">
              <app-key-col [id]="'reviewer-id-' + i">Reviewer</app-key-col>
              <app-value-col [attr.labelledby]="'reviewer-id-' + i">
                {{ reviewers[review.userId].username }}
              </app-value-col>

              <app-key-col [id]="'vote-id-' + i">Reviewer vote</app-key-col>
              <app-value-col [attr.labelledby]="'vote-id-' + i">
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

              <app-key-col [id]="'build-reproduced-id-' + i">
                Build reproduction
              </app-key-col>
              <app-value-col [attr.labelledby]="'build-reproduced-id-' + i">
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

              <app-key-col [id]="'reviewed-commits-id-' + i">
                Reviewed commits
              </app-key-col>
              <app-value-col [attr.labelledby]="'reviewed-commits-' + i">
                {{ review.commits.length }} out of
                {{ commits.length }}
              </app-value-col>

              <app-key-col [id]="'review-link-id-' + i">
                Full review
              </app-key-col>
              <app-value-col [attr.labelledby]="'review-link-' + i">
                <a [routerLink]="['/review', review.id, 'view']">
                  See full review
                </a>
              </app-value-col>
            </app-key-value-grid>
          </div>
        </cg-card>
      } @empty {
        <cg-card class="review">
          <div slot="cardContent">
            <p>No reviews submitted</p>
          </div>
        </cg-card>
      }

      <h2 class="h4">Commits</h2>
      @for (commit of commits; track commit.commitId; let i = $index) {
        <cg-card class="commit">
          <div slot="cardContent">
            <app-key-value-grid [columnNumber]="1">
              <app-key-col [id]="'commit-id-' + i">ID</app-key-col>
              <app-value-col [attr.labelledby]="'commit-id-' + i">
                <a
                  class="commit__link"
                  [href]="
                    'https://github.com/dfinity/ic/commit/' + commit.commitSha
                  "
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  {{ commit.commitSha }}
                </a>
              </app-value-col>

              <app-key-col [id]="'reviewed-by-id-' + i">
                Reviewed by
              </app-key-col>
              <app-value-col [attr.labelledby]="'reviewed-by-id-' + i">
                {{ commit.reviewedCount }} out of {{ reviews.length }} reviewers
              </app-value-col>

              <app-key-col [id]="'matches-descr-id-' + i">
                Matches description
              </app-key-col>
              <app-value-col [attr.labelledby]="'matches-descr-id-' + i">
                Yes ({{ commit.matchesDescriptionCount }}) No ({{
                  commit.reviewedCount - commit.matchesDescriptionCount
                }})
              </app-value-col>
            </app-key-value-grid>
          </div>
        </cg-card>
      } @empty {
        <cg-card class="commit">
          <div slot="cardContent">
            <p>No commits reviewed</p>
          </div>
        </cg-card>
      }
    }
  `,
})
export class ClosedProposalSummaryComponent implements OnInit {
  private readonly reviewService = inject(ReviewService);
  private readonly profileService = inject(ProfileService);

  public readonly currentProposalId = routeParamSignal('proposalId');

  public readonly reviewers = toSyncSignal(this.profileService.reviewers$);
  public readonly reviews = toSyncSignal(this.reviewService.reviews$);

  public proposalStats = computed<ProposalStats | null>(() => {
    const reviews = this.reviews();
    if (isNil(reviews)) {
      return null;
    }

    return reviews.reduce(
      (accum, review) => ({
        adopt: review.vote ? accum.adopt + 1 : accum.adopt,
        reject: review.vote === false ? accum.reject + 1 : accum.reject,
        buildReproduced: review.buildReproduced
          ? accum.buildReproduced + 1
          : accum.buildReproduced,
      }),
      { adopt: 0, reject: 0, buildReproduced: 0 },
    );
  });

  public commits = computed(() => {
    const proposalId = this.currentProposalId();
    const reviews = this.reviews();
    if (isNil(proposalId) || isNil(reviews)) {
      return [];
    }

    const map: Map<string, ProposalCommitReviewSummary> = new Map();

    reviews.forEach(review => {
      for (const commit of review.commits) {
        const existingCommit =
          map.get(commit.id) ??
          ({
            proposalId,
            commitId: commit.id,
            commitSha: commit.commitSha,
            totalReviewers: 0,
            reviewedCount: 0,
            matchesDescriptionCount: 0,
          } satisfies ProposalCommitReviewSummary);

        existingCommit.totalReviewers++;

        if (commit.details.reviewed) {
          existingCommit.reviewedCount++;

          if (commit.details.matchesDescription) {
            existingCommit.matchesDescriptionCount++;
          }
        }

        map.set(commit.id, existingCommit);
      }
    });

    return Array.from(map.values());
  });

  constructor() {
    effect(() => {
      const proposalId = this.currentProposalId();

      if (isNotNil(proposalId)) {
        this.reviewService.loadReviewsByProposalId(proposalId);
      }
    });
  }

  public ngOnInit(): void {
    this.profileService.loadReviewerProfiles();
  }
}

interface ProposalStats {
  adopt: number;
  reject: number;
  buildReproduced: number;
}

interface ProposalCommitReviewSummary {
  proposalId: string;
  commitId: string;
  commitSha: string | null;
  totalReviewers: number;
  reviewedCount: number;
  matchesDescriptionCount: number;
}
