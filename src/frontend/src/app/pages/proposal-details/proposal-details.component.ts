import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  SecurityContext,
  computed,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { marked } from 'marked';
import { filter, map } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';
import { FormatDatePipe } from '~core/pipes';
import {
  ProfileService,
  ProposalLinkBaseUrl,
  ProposalState,
  ReviewService,
} from '~core/state';
import { ProposalService } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { ClosedProposalSummaryComponent } from './closed-proposal-summary';

@Component({
  selector: 'app-proposal-details',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    FormatDatePipe,
    ClosedProposalSummaryComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        @include page-content;
      }

      .proposal {
        margin-bottom: size(6);
      }

      .proposal__title,
      .proposal__proposer {
        word-break: break-word;
      }

      .proposal__link {
        margin-right: size(4);
      }

      .proposal__vote {
        font-weight: bold;
      }

      .proposal__vote--adopt {
        color: $success;
      }

      .proposal__vote--reject {
        color: $error;
      }
    `,
  ],
  template: `
    @if (currentProposal(); as proposal) {
      <h1 class="h3 proposal-title">{{ proposal.title }}</h1>

      <cg-card class="proposal">
        <div slot="cardContent">
          <app-key-value-grid [columnNumber]="2">
            <app-key-col id="proposal-id">ID</app-key-col>
            <app-value-col aria-labelledby="proposal-id">
              <a
                [href]="linkBaseUrl().Proposal + proposal.ns_proposal_id"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.ns_proposal_id }}
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
                [href]="linkBaseUrl().Neuron + proposal.proposedBy"
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

            <app-key-col id="proposal-codegov-vote">CodeGov vote</app-key-col>
            <app-value-col
              aria-labelledby="proposal-codegov-vote"
              class="proposal__vote"
              [ngClass]="{
                'proposal__vote--adopt': proposal.codeGovVote === 'ADOPT',
                'proposal__vote--reject': proposal.codeGovVote === 'REJECT'
              }"
            >
              {{ proposal.codeGovVote }}
            </app-value-col>
          </app-key-value-grid>

          <div class="btn-group">
            @if (proposal.state === proposalState().InProgress) {
              <button type="button" class="btn" (click)="onToggleSummary()">
                {{
                  showSummary()
                    ? 'Show proposal description'
                    : 'Show preliminary summary'
                }}
              </button>
            }
            @if (
              isReviewer() && proposal.state === proposalState().InProgress
            ) {
              @if (userReview() === undefined) {
                <a class="btn btn--outline" (click)="onCreateReview()">
                  Create review
                </a>
              } @else if (userReview()!.state === 'Draft') {
                <a
                  class="btn btn--outline"
                  [routerLink]="['/review', proposal.id, 'edit']"
                >
                  Edit review
                </a>
              } @else if (userReview()!.state === 'Completed') {
                <a
                  class="btn btn--outline"
                  [routerLink]="['/review', userReview()!.id, 'view']"
                >
                  My review
                </a>
              }
            }
          </div>
        </div>
      </cg-card>

      @if (showSummary() || proposal.state === proposalState().Completed) {
        <app-closed-proposal-summary [proposal]="proposal" />
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
export class ProposalDetailsComponent {
  public readonly proposalState = signal(ProposalState);
  public readonly linkBaseUrl = signal(ProposalLinkBaseUrl);

  public readonly currentProposal = toSignal(
    this.proposalService.currentProposal$,
  );
  public readonly currentProposalReviews = toSignal(
    this.reviewService.proposalReviewList$,
  );

  public readonly proposalSummaryInMarkdown = computed(() =>
    this.sanitizer.sanitize(
      SecurityContext.HTML,
      marked.parse(this.currentProposal()?.summary ?? ''),
    ),
  );

  public readonly isReviewer = toSignal(this.profileService.isReviewer$);
  public readonly userProfile = toSignal(this.profileService.userProfile$);

  public readonly userReviewList = toSignal(this.reviewService.userReviewList$);
  public readonly userReview = computed(() =>
    this.userReviewList()?.find(
      review => review.proposalId === this.currentProposal()?.id,
    ),
  );

  public readonly showSummary = signal(false);

  private readonly proposalIdFromRoute$ = this.route.params.pipe(
    map(params => {
      try {
        return params['id'];
      } catch (error) {
        return null;
      }
    }),
    filter(Boolean),
  );

  constructor(
    private readonly proposalService: ProposalService,
    private readonly route: ActivatedRoute,
    private readonly sanitizer: DomSanitizer,
    private readonly profileService: ProfileService,
    private readonly reviewService: ReviewService,
    private readonly router: Router,
  ) {
    this.proposalIdFromRoute$
      .pipe(takeUntilDestroyed())
      .subscribe(proposalId => {
        this.proposalService.setCurrentProposalId(proposalId);
      });

    this.proposalService.loadProposalList();
  }

  public async onCreateReview(): Promise<void> {
    if (this.userProfile() && this.currentProposal()) {
      try {
        await this.reviewService.createReview(this.currentProposal()!.id);
      } catch {
        throw new Error('Cannot create review');
      } finally {
        this.router.navigate(['/review', this.currentProposal()!.id, 'edit']);
      }
    }
  }

  public onToggleSummary(): void {
    this.showSummary.set(!this.showSummary().valueOf());
  }
}
