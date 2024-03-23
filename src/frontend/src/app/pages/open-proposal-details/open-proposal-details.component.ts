import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  SecurityContext,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { marked } from 'marked';
import { filter, map } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';
import { FormatDatePipe } from '~core/pipes';
import { ProposalLinkBaseUrl, ProposalState, ProposalTopic } from '~core/state';
import { ProposalService } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { isNotNil } from '~core/utils';

@Component({
  selector: 'app-open-proposal-details',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    FormatDatePipe,
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
    `,
  ],
  template: `
    @if (currentProposal$ | async; as proposal) {
      <h1 class="h3 proposal-title">{{ proposal.title }}</h1>

      <cg-card class="proposal">
        <div slot="cardContent">
          <app-key-value-grid [columnNumber]="2">
            <app-key-col id="open-proposal-id">ID</app-key-col>
            <app-value-col aria-labelledby="open-proposal-id">
              <a
                href="{{ linkBaseUrl.Proposal }}{{ proposal.id }}"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.id }}
              </a>
            </app-value-col>

            <app-key-col id="open-proposal-links">Voting links</app-key-col>
            <app-value-col aria-labelledby="open-proposal-links">
              @if (proposal.proposalLinks.length > 0) {
                @for (
                  proposalLink of proposal.proposalLinks;
                  track proposalLink.type
                ) {
                  <a
                    class="proposal__link"
                    href="{{ proposalLink.link }}"
                    target="_blank"
                    rel="nofollow noreferrer"
                  >
                    {{ proposalLink.type }}
                  </a>
                }
              }
            </app-value-col>

            <app-key-col id="open-proposal-topic">Topic</app-key-col>
            <app-value-col aria-labelledby="open-proposal-topic">
              {{ proposal.topic }}
            </app-value-col>

            <app-key-col id="open-proposal-type">Type</app-key-col>
            <app-value-col aria-labelledby="open-proposal-type">
              {{ proposal.type }}
            </app-value-col>

            <app-key-col id="open-proposal-created">Created</app-key-col>
            <app-value-col aria-labelledby="open-proposal-created">
              {{ proposal.proposedAt | formatDate }}
            </app-value-col>

            <app-key-col id="open-proposal-proposer">Proposer</app-key-col>
            <app-value-col
              aria-labelledby="open-proposal-proposer"
              class="proposal__proposer"
            >
              <a
                href="{{ linkBaseUrl.Neuron }}{{ proposal.proposedBy }}"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.proposedBy }}
              </a>
            </app-value-col>

            <app-key-col id="open-proposal-review-end">
              Review period end
            </app-key-col>
            <app-value-col aria-labelledby="open-proposal-review-end">
              {{ proposal.reviewPeriodEnd | formatDate }}
            </app-value-col>

            <app-key-col id="open-proposal-voting-end">
              Voting period end
            </app-key-col>
            <app-value-col aria-labelledby="open-proposal-voting-end">
              {{ proposal.votingPeriodEnd | formatDate }}
            </app-value-col>
          </app-key-value-grid>
        </div>
      </cg-card>

      <h2 class="h4">Proposal summary</h2>
      <cg-card>
        <div
          slot="cardContent"
          [innerHTML]="convertMarkdownToHTML(proposal.summary)"
        ></div>
      </cg-card>
    }
  `,
})
export class OpenProposalDetailsComponent implements OnInit {
  public readonly proposalTopic = ProposalTopic;
  public readonly linkBaseUrl = ProposalLinkBaseUrl;
  public readonly currentProposal$ = this.proposalService.currentProposal$;

  private readonly proposalIdFromRoute$ = this.route.params.pipe(
    map(params => {
      try {
        return BigInt(params['id']);
      } catch (error) {
        return null;
      }
    }),
    filter(Boolean),
  );

  constructor(
    private readonly proposalService: ProposalService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.proposalIdFromRoute$
      .pipe(takeUntilDestroyed())
      .subscribe(proposalId => {
        this.proposalService.setCurrentProposalId(proposalId);
      });

    this.currentProposal$
      .pipe(takeUntilDestroyed(), filter(isNotNil))
      .subscribe(proposal => {
        if (proposal.state === ProposalState.Completed) {
          this.router.navigate(['closed', { id: proposal.id }]);
        }
      });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposalList(ProposalState.InProgress);
  }

  public convertMarkdownToHTML(proposalSummary: string): string | null {
    return this.sanitizer.sanitize(
      SecurityContext.HTML,
      marked.parse(proposalSummary),
    );
  }
}
