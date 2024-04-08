import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';
import { Proposal } from '~core/state';
import { ProposalCommit } from '~core/state/review';
import { ReviewService } from '~core/state/review/review.service';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-closed-proposal-summary',
  standalone: true,
  imports: [
    CardComponent,
    CommonModule,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .summary,
      .review,
      .commit {
        margin-bottom: size(6);
      }

      .summary__vote--adopt {
        color: $success;
      }

      .summary__vote--reject {
        color: $error;
      }

      .summary__verification {
        margin-bottom: size(8);
      }

      .commit__highlights {
        display: flex;
        flex-direction: column;
      }

      .commit__highlights-label {
        color: $black;
        @include dark {
          color: $white;
        }
      }
    `,
  ],
  template: `
    @if (reviewList$ | async; as reviewList) {
      <h2 class="h4">Review summary</h2>
      <cg-card class="summary">
        <div slot="cardContent">
          <div class="summary__verification">
            <h3 class="h5">Verification</h3>
            <p>
              {{ commitList.length }} commits reviewed by
              {{ reviewList.length }} reviewers
            </p>
            <p>Build verified by {{ buildReproducedCount }} reviewers</p>
          </div>

          <div class="summary__vote">
            <h3 class="h5">
              CodeGov voted to
              <span
                [ngClass]="{
                  'summary__vote--adopt': proposal.codeGovVote === 'ADOPT',
                  'summary__vote--reject': proposal.codeGovVote === 'REJECT'
                }"
              >
                {{ proposal.codeGovVote }}
              </span>
              this proposal
            </h3>
            <p class="summary__vote--adopt">
              {{ votesAdopt }} reviewer(s) voted to adopt this proposal
            </p>
            <p class="summary__vote--reject">
              {{ votesReject }} reviewer(s) voted to reject this proposal
            </p>
          </div>
        </div>
      </cg-card>

      <h2 class="h4">Reviews</h2>
      @for (review of reviewList; track review.id; let i = $index) {
        <cg-card class="review">
          <div slot="cardContent">
            <app-key-value-grid [columnNumber]="1">
              <app-key-col [id]="'reviewer-id-' + i">Reviewer</app-key-col>
              <app-value-col [attr.labelledby]="'reviewer-id-' + i">
                Reviewer Name Link
              </app-value-col>

              <app-key-col [id]="'build-reproduced-id-' + i">
                Build reproduced
              </app-key-col>
              <app-value-col [attr.labelledby]="'build-reproduced-id-' + i">
                {{ review.buildReproduced ? 'Yes' : 'No' }}
              </app-value-col>

              <app-key-col [id]="'vote-id-' + i">Vote</app-key-col>
              <app-value-col
                [attr.labelledby]="'vote-id-' + i"
                [ngClass]="{
                  'summary__vote--adopt': review.reviewerVote === 'ADOPT',
                  'summary__vote--reject': review.reviewerVote === 'REJECT'
                }"
              >
                {{ review.reviewerVote }}
              </app-value-col>

              <app-key-col [id]="'reviewed-commits-id-' + i">
                Reviewed commits
              </app-key-col>
              <app-value-col [attr.labelledby]="'reviewed-commits-' + i">
                {{ review.reviewCommits.length }} out of {{ commitList.length }}
              </app-value-col>

              <app-key-col [id]="'review-link-id-' + i">
                Full review
              </app-key-col>
              <app-value-col [attr.labelledby]="'review-link-' + i">
                Review Link
              </app-value-col>
            </app-key-value-grid>
          </div>
        </cg-card>
      }

      <h2 class="h4">Commits</h2>
      @for (commit of commitList; track commit.commitId; let i = $index) {
        <cg-card class="commit">
          <div slot="cardContent">
            <app-key-value-grid [columnNumber]="1">
              <app-key-col [id]="'commit-id-' + i">ID</app-key-col>
              <app-value-col [attr.labelledby]="'commit-id-' + i">
                <a
                  class="commit__link"
                  href="https://github.com/dfinity/ic/commit/{{
                    commit.commitId
                  }}"
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  {{ commit.commitId }}
                </a>
              </app-value-col>

              <app-key-col [id]="'reviewed-by-id-' + i">
                Reviewed by
              </app-key-col>
              <app-value-col [attr.labelledby]="'reviewed-by-id-' + i">
                {{ commit.reviewedCount }} out of {{ reviewList.length }}
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

            <div class="commit__highlights">
              <div class="commit__highlights-label">Reviewer highlights</div>
              @for (
                highlight of commit.highlights;
                track highlight.reviewerId
              ) {
                <div class="commit__highlights-content">
                  Reviewer #{{ highlight.reviewerId }} said: "{{
                    highlight.text
                  }}"
                </div>
              }
            </div>
          </div>
        </cg-card>
      }
    }
  `,
})
export class ClosedProposalSummaryComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  public proposal!: Proposal;

  public readonly reviewList$ = this.reviewService.reviewList$;
  public reviewListSubscription: Subscription = Subscription.EMPTY;

  public commitList: ProposalCommit[] = [];
  public votesAdopt = 0;
  public votesReject = 0;
  public buildReproducedCount = 0;

  constructor(private readonly reviewService: ReviewService) {
    this.reviewService.loadReviewList();
  }

  public ngOnInit(): void {
    this.reviewListSubscription = this.reviewList$.subscribe(reviewList => {
      reviewList.forEach(review => {
        if (review.reviewerVote === 'ADOPT') {
          this.votesAdopt++;
        } else if (review.reviewerVote === 'REJECT') {
          this.votesReject++;
        }

        if (review.buildReproduced) {
          this.buildReproducedCount++;
        }

        for (const commit of review.reviewCommits) {
          const existingCommit = this.commitList.find(
            c => c.commitId === commit.commitId,
          );
          if (existingCommit) {
            existingCommit.highlights.push({
              reviewerId: review.reviewerId,
              text: commit.highlights,
            });
            existingCommit.totalReviewers += 1;
            existingCommit.reviewedCount += commit.reviewed;
            existingCommit.matchesDescriptionCount += commit.matchesDescription;
          } else {
            this.commitList.push({
              proposalId: this.proposal.id,
              commitId: commit.commitId,
              totalReviewers: 1,
              reviewedCount: commit.reviewed === 1 ? 1 : 0,
              matchesDescriptionCount: commit.matchesDescription === 1 ? 1 : 0,
              highlights: [
                { reviewerId: review.reviewerId, text: commit.highlights },
              ],
            });
          }
        }
      });
    });
  }

  public ngOnDestroy(): void {
    this.reviewListSubscription.unsubscribe();
  }
}
