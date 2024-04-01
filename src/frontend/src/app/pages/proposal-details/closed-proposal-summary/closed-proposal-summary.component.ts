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

@Component({
  selector: 'app-closed-proposal-summary',
  standalone: true,
  imports: [CardComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .summary__vote--adopt {
        color: $success;
      }

      .summary__vote--reject {
        color: $error;
      }

      .summary__verification {
        margin-bottom: size(8);
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
      @for (review of reviewList; track review.id) {
        <cg-card></cg-card>
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
