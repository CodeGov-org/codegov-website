import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import {
  CardComponent,
  DashCircleIconComponent,
  CheckCircleIconComponent,
} from '@cg/angular-ui';
import {
  Proposal,
  ProposalCommitReviewSummary,
  ReviewService,
} from '~core/state';
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
    CheckCircleIconComponent,
    DashCircleIconComponent,
    RouterLink,
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

      .summary__vote {
        margin-bottom: size(4);
      }

      .summary__vote-position {
        display: flex;
        flex-direction: row;
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

      .commit__highlights-content {
        @include my(2);
      }

      .commit__highlights-quote {
        font-style: italic;
      }

      .reject-icon {
        width: size(6);
        height: size(6);
        stroke: $error;
      }

      .adopt-icon {
        width: size(6);
        height: size(6);
        stroke: $success;
      }
    `,
  ],
  template: `
    @if (reviewList(); as reviewList) {
      <h2 class="h4">Review summary</h2>
      <cg-card class="summary">
        <div slot="cardContent">
          <h3 class="h5">
            CodeGov voted to
            <span
              [ngClass]="{
                'summary__vote--adopt': proposal().codeGovVote === 'ADOPT',
                'summary__vote--reject': proposal().codeGovVote === 'REJECT'
              }"
            >
              {{ proposal().codeGovVote }}
            </span>
            this proposal
          </h3>

          <div class="summary__vote">
            <div class="summary__vote-position">
              <cg-check-circle-icon class="adopt-icon"></cg-check-circle-icon>

              <p>
                {{ proposalStats()?.adopt }} reviewer(s) voted to
                <span class="summary__vote--adopt">adopt</span>
                this proposal
              </p>
            </div>
            <div class="summary__vote-position">
              <cg-dash-circle-icon class="reject-icon"></cg-dash-circle-icon>

              <p>
                {{ proposalStats()?.reject }} reviewer(s) voted to
                <span class="summary__vote--reject">reject</span>
                this proposal
              </p>
            </div>
          </div>

          <div class="summary__verification">
            <p>
              {{ commitList().length }} commits reviewed by
              {{ reviewList.length }} reviewers
            </p>
            <p>
              Build verified by {{ proposalStats()?.buildReproduced }} reviewers
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
                {{ review.reviewCommits.length }} out of
                {{ commitList().length }}
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
      }

      <h2 class="h4">Commits</h2>
      @for (commit of commitList(); track commit.commitId; let i = $index) {
        <cg-card class="commit">
          <div slot="cardContent">
            <app-key-value-grid [columnNumber]="1">
              <app-key-col [id]="'commit-id-' + i">ID</app-key-col>
              <app-value-col [attr.labelledby]="'commit-id-' + i">
                <a
                  class="commit__link"
                  [href]="
                    'https://github.com/dfinity/ic/commit/' + commit.commitId
                  "
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
                {{ commit.reviewedCount }} out of
                {{ reviewList.length }} reviewers
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
              <ul>
                @for (
                  highlight of commit.highlights;
                  track highlight.reviewerId
                ) {
                  <li class="commit__highlights-content">
                    Reviewer #{{ highlight.reviewerId }} said:
                    <span class="commit__highlights-quote">
                      "{{ highlight.text }}"
                    </span>
                  </li>
                }
              </ul>
            </div>
          </div>
        </cg-card>
      }
    }
  `,
})
export class ClosedProposalSummaryComponent implements OnInit {
  public readonly proposal = input.required<Proposal>();

  public readonly reviewList = toSignal(this.reviewService.proposalReviewList$);

  public proposalStats = computed(
    () =>
      this.reviewList()?.reduce(
        (accum, review) => ({
          adopt:
            review.reviewerVote === 'ADOPT' ? accum.adopt + 1 : accum.adopt,
          reject:
            review.reviewerVote === 'REJECT' ? accum.reject + 1 : accum.reject,
          buildReproduced: review.buildReproduced
            ? accum.buildReproduced + 1
            : accum.buildReproduced,
        }),
        { adopt: 0, reject: 0, buildReproduced: 0 },
      ) ?? null,
  );

  public commitList = computed(() => {
    const map: Map<string, ProposalCommitReviewSummary> = new Map();

    this.reviewList()?.forEach(review => {
      for (const commit of review.reviewCommits) {
        const existingCommit = map.get(commit.id) ?? {
          proposalId: this.proposal().id,
          commitId: commit.id,
          commitSha: commit.commitSha,
          totalReviewers: 0,
          reviewedCount: 0,
          matchesDescriptionCount: 0,
          highlights: [],
        };
        if (commit.highlights)
          existingCommit.highlights.push({
            reviewerId: review.reviewerId,
            text: commit.highlights,
          });
        existingCommit.totalReviewers++;
        existingCommit.reviewedCount = commit.reviewed
          ? existingCommit.reviewedCount++
          : existingCommit.reviewedCount;
        existingCommit.matchesDescriptionCount = commit.matchesDescription
          ? existingCommit.matchesDescriptionCount++
          : existingCommit.matchesDescriptionCount;

        map.set(commit.id, existingCommit);
      }
    });
    return Array.from(map.values());
  });

  constructor(private readonly reviewService: ReviewService) {}

  public ngOnInit(): void {
    this.reviewService.loadReviewListByProposalId(this.proposal().id);
  }
}
