import { CommonModule, DatePipe } from '@angular/common';
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

import {
  NEURON_LINK_BASE_URL,
  ProposalState,
  ProposalTopic,
} from '~core/state';
import { ProposalService } from '~core/state/proposal/proposal.service';
import {
  CardComponent,
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
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .proposal {
        margin-bottom: size(6);
      }

      .proposal-title {
        word-break: break-all;
      }

      :host {
        display: block;
        margin-left: auto;
        margin-right: auto;

        @include lg {
          width: 75%;
        }

        @include xl {
          width: 66.66667%;
        }
      }

      .proposal-links__link {
        margin-right: size(4);
      }

      .proposal-summary {
        margin-top: size(3);
        padding-top: size(3);
        border-top: 1px solid $slate-300;

        @include dark {
          border-color: $slate-700;
        }
      }

      .proposal-summary__content {
        background-color: $slate-200;

        @include dark {
          background-color: $slate-900;
        }
      }
    `,
  ],
  template: `
    <app-card class="proposal">
      @if (currentProposal$ | async; as proposal) {
        <h2 class="h4 proposal-title" cardTitle>
          {{ proposal.title }}
        </h2>
      }

      @if (currentProposal$ | async; as proposal) {
        <app-key-value-grid [columnNumber]="2">
          <app-key-col id="proposal-id">ID</app-key-col>
          <app-value-col aria-labelledby="proposal-id">
            {{ proposal.id }}</app-value-col
          >

          <app-key-col id="proposal-links">Links</app-key-col>
          <app-value-col
            class="proposal-links"
            aria-labelledby="proposal-links"
          >
            @if (proposal.proposalLinks !== []) {
              @for (
                proposalLink of proposal.proposalLinks;
                track proposalLink.type
              ) {
                <a
                  class="proposal-links__link"
                  href="{{ proposalLink.link }}"
                  target="_blank"
                  rel="nofollow noreferrer"
                  >{{ proposalLink.type }}</a
                >
              }
            }
          </app-value-col>

          <app-key-col id="proposal-topic">Topic</app-key-col>
          <app-value-col aria-labelledby="proposal-topic">
            {{ proposal.topic }}</app-value-col
          >

          <app-key-col id="proposal-type">Type</app-key-col>
          <app-value-col aria-labelledby="proposal-type">
            {{ proposal.type }}</app-value-col
          >

          <app-key-col id="proposal-created">Created</app-key-col>
          <app-value-col aria-labelledby="proposal-created">
            {{ proposal.proposedAt | date: 'medium' }}</app-value-col
          >

          <app-key-col id="proposal-proposer">Proposer</app-key-col>
          <app-value-col aria-labelledby="proposal-proposer">
            <a
              href="{{ neuronBaseLink }}{{ proposal.proposedBy }}"
              target="_blank"
              rel="nofollow noreferrer"
              >{{ proposal.proposedBy }}</a
            ></app-value-col
          >

          <app-key-col id="proposal-review-end">Review period end</app-key-col>
          <app-value-col aria-labelledby="proposal-review-end">
            {{ proposal.reviewPeriodEnd | date: 'medium' }}</app-value-col
          >

          <app-key-col id="proposal-voting-end">Voting period end</app-key-col>
          <app-value-col aria-labelledby="proposal-voting-end">
            {{ proposal.votingPeriodEnd | date: 'medium' }}
          </app-value-col>
        </app-key-value-grid>
        <h2 class="h4 proposal-summary">Proposal summary</h2>

        <app-card
          class="proposal-summary__content"
          [innerHTML]="convertMarkdownToHTML(proposal.summary)"
        >
        </app-card>
      }
    </app-card>
  `,
})
export class OpenProposalDetailsComponent implements OnInit {
  public readonly proposalList$ = this.proposalService.openProposalList$;
  public readonly proposalTopic = ProposalTopic;
  public readonly neuronBaseLink = NEURON_LINK_BASE_URL;
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

  public proposalSummary = '';

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
          this.router.navigate(['closed', { id: this.proposalIdFromRoute$ }]);
        }
        this.proposalSummary = proposal.summary;
      });
  }

  public ngOnInit(): void {
    this.proposalService.loadOpenProposalList();
  }

  public convertMarkdownToHTML(proposalSummary: string): string | null {
    return this.sanitizer.sanitize(
      SecurityContext.HTML,
      marked.parse(proposalSummary),
    );
  }
}
