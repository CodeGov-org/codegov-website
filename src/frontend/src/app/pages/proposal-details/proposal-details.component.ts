import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  SecurityContext,
  computed,
  effect,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { marked } from 'marked';

import {
  CardComponent,
  LinkTextBtnComponent,
  TextBtnComponent,
} from '@cg/angular-ui';
import {
  GetProposalReviewResponse,
  BaseUrl,
  ProposalReviewStatus,
  ProposalState,
} from '~core/api';
import { FormatDatePipe } from '~core/pipes';
import { ProfileService, ReviewService } from '~core/state';
import { ProposalService } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { isNotNil, routeParamSignal, toSyncSignal } from '~core/utils';
import { ClosedProposalSummaryComponent } from './closed-proposal-summary';

@Component({
  selector: 'app-proposal-details',
  imports: [
    CommonModule,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    FormatDatePipe,
    ClosedProposalSummaryComponent,
    RouterLink,
    TextBtnComponent,
    LinkTextBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    :host {
      @include common.page-content;
    }

    .proposal {
      margin-bottom: common.size(6);
    }

    .proposal__title,
    .proposal__proposer {
      word-break: break-word;
    }

    .proposal__link {
      margin-right: common.size(4);
    }
  `,
  template: `
    @if (currentProposal(); as proposal) {
      <div class="page-heading">
        <h1 class="h3">{{ proposal.title }}</h1>
      </div>

      <cg-card class="proposal">
        <div slot="cardContent">
          <app-key-value-grid [columnNumber]="2">
            <app-key-col id="proposal-id">ID</app-key-col>
            <app-value-col aria-labelledby="proposal-id">
              <a
                [href]="LinkBaseUrl().Proposal + proposal.nsProposalId"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.nsProposalId }}
              </a>
            </app-value-col>

            <app-key-col id="proposal-links">Voting links</app-key-col>
            <app-value-col aria-labelledby="proposal-links">
              @for (
                proposalLink of proposal.proposalLinks;
                track proposalLink.type
              ) {
                <a
                  class="proposal__link"
                  [href]="proposalLink.link"
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  {{ proposalLink.type }}
                </a>
              }
            </app-value-col>

            <app-key-col id="proposal-topic">Topic</app-key-col>
            <app-value-col aria-labelledby="proposal-topic">
              {{ proposal.topic }}
            </app-value-col>

            <app-key-col id="proposal-type">Type</app-key-col>
            <app-value-col aria-labelledby="proposal-type">
              {{ proposal.type }}
            </app-value-col>

            <app-key-col id="proposal-created">Created</app-key-col>
            <app-value-col aria-labelledby="proposal-created">
              {{ proposal.proposedAt | formatDate }}
            </app-value-col>

            <app-key-col id="proposal-proposer">Proposer</app-key-col>
            <app-value-col
              aria-labelledby="proposal-proposer"
              class="proposal__proposer"
            >
              <a
                [href]="LinkBaseUrl().Neuron + proposal.proposedBy"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.proposedBy }}
              </a>
            </app-value-col>

            <app-key-col id="proposal-review-end">
              Review period end
            </app-key-col>
            <app-value-col aria-labelledby="proposal-review-end">
              {{ proposal.reviewPeriodEnd | formatDate }}
            </app-value-col>

            <app-key-col id="proposal-voting-end">
              Voting period end
            </app-key-col>
            <app-value-col aria-labelledby="proposal-voting-end">
              {{ proposal.votingPeriodEnd | formatDate }}
            </app-value-col>

            <app-key-col id="proposal-date-decided">Date decided</app-key-col>
            <app-value-col aria-labelledby="proposal-date-decided">
              {{
                proposal.decidedAt
                  ? (proposal.decidedAt | formatDate)
                  : 'Not yet decided'
              }}
            </app-value-col>
          </app-key-value-grid>

          <div class="btn-group">
            @if (
              proposal.state === ProposalState().InProgress &&
              (isReviewer() || isAdmin())
            ) {
              <cg-text-btn (click)="onToggleSummary()">
                {{
                  showSummary()
                    ? 'Show proposal description'
                    : 'Show preliminary summary'
                }}
              </cg-text-btn>
            }
            @if (
              isReviewer() && proposal.state === ProposalState().InProgress
            ) {
              @let review = userReview();

              @if (review === null) {
                <cg-link-text-btn
                  [routerLink]="['/review', proposal.id, 'edit']"
                >
                  Create review
                </cg-link-text-btn>
              } @else if (review.status === ProposalReviewStatus().Draft) {
                <cg-link-text-btn
                  [routerLink]="['/review', proposal.id, 'edit']"
                >
                  Edit review
                </cg-link-text-btn>
              } @else if (review.status === ProposalReviewStatus().Published) {
                <cg-link-text-btn
                  [routerLink]="['/review', proposal.id, 'view']"
                >
                  My review
                </cg-link-text-btn>
              }
            }
          </div>
        </div>
      </cg-card>

      @if (showSummary() || proposal.state === ProposalState().Completed) {
        <app-closed-proposal-summary />
      } @else {
        <h2 class="h4">Proposal summary</h2>

        <cg-card>
          <div
            slot="cardContent"
            [innerHTML]="proposalSummaryInMarkdown()"
          ></div>
        </cg-card>
      }
    }
  `,
})
export class ProposalDetailsComponent implements OnInit {
  public readonly ProposalReviewStatus = signal(ProposalReviewStatus);
  public readonly ProposalState = signal(ProposalState);
  public readonly LinkBaseUrl = signal(BaseUrl);

  public readonly currentProposal = toSyncSignal(
    this.proposalService.currentProposal$,
  );
  public readonly currentProposalReviews = toSyncSignal(
    this.reviewService.reviews$,
  );

  public readonly proposalSummaryInMarkdown = computed<string | null>(() =>
    this.sanitizer.sanitize(
      SecurityContext.HTML,
      marked.parse(this.currentProposal()?.summary ?? ''),
    ),
  );

  public readonly isAdmin = toSyncSignal(
    this.profileService.isCurrentUserAdmin$,
  );
  public readonly isReviewer = toSyncSignal(
    this.profileService.isCurrentUserReviewer$,
  );
  public readonly userProfile = toSyncSignal(this.profileService.currentUser$);

  public readonly currentProposalId = routeParamSignal('proposalId');

  public readonly userReviewList = toSyncSignal(
    this.reviewService.currentUserReviews$,
  );
  public readonly userReview = computed<GetProposalReviewResponse | null>(
    () =>
      this.userReviewList().find(
        review => review.proposalId === this.currentProposal()?.id,
      ) ?? null,
  );

  public readonly showSummary = signal(false);

  constructor(
    private readonly proposalService: ProposalService,
    private readonly sanitizer: DomSanitizer,
    private readonly profileService: ProfileService,
    private readonly reviewService: ReviewService,
  ) {
    effect(() => {
      const proposalId = this.currentProposalId();

      if (isNotNil(proposalId)) {
        this.proposalService.setCurrentProposalId(proposalId);
      }
    });

    effect(() => {
      const userProfile = this.userProfile();

      if (isNotNil(userProfile)) {
        this.reviewService.loadReviewsByReviewerId(userProfile.id);
      }
    });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposals(ProposalState.Any);
  }

  public onToggleSummary(): void {
    this.showSummary.set(!this.showSummary());
  }
}
