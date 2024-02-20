import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { ProposalState, ProposalTopic } from '~core/state';
import { ProposalService } from '~core/state/proposal/proposal.service';
import {
  CardComponent,
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';

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
    `,
  ],
  template: `
    <app-card class="proposal">
      @if (currentProposal$ | async; as proposal) {
        <h2 class="h4 proposal-title" cardTitle>
          {{ proposal.id }}: {{ proposal.title }}
        </h2>
      }
      @if (currentProposal$ | async; as proposal) {
        <app-key-value-grid [columnNumber]="2">
          <app-key-col>Topic</app-key-col>
          <app-value-col>{{ proposal.topic }}</app-value-col>

          <app-key-col>Created</app-key-col>
          <app-value-col>
            {{ proposal.proposedAt | date: 'medium' }}</app-value-col
          >

          <app-key-col>Type</app-key-col>
          <app-value-col>{{ proposal.type }}</app-value-col>

          <app-key-col>Proposer</app-key-col>
          <app-value-col>{{ proposal.proposedBy }}</app-value-col>

          <app-key-col>Review period end</app-key-col>
          <app-value-col>
            {{ proposal.reviewPeriodEnd | date: 'medium' }}</app-value-col
          >

          <app-key-col>Voting period end</app-key-col>
          <app-value-col>
            {{ proposal.votingPeriodEnd | date: 'medium' }}
          </app-value-col>

          <app-key-col>Canister</app-key-col>
          <app-value-col>{{ proposal.canister }}</app-value-col>

          <app-key-col>Links</app-key-col>
          <app-value-col class="proposal-links">
            @if (proposal.proposalLinks !== []) {
              @for (
                proposalLink of proposal.proposalLinks;
                track proposalLink.type
              ) {
                <a
                  class="proposal-links__link"
                  href="{{ proposalLink.link }}"
                  >{{ proposalLink.type }}</a
                >
              }
            }
          </app-value-col>
        </app-key-value-grid>
        <h2 class="h4 proposal-summary">Proposal summary</h2>
        <div>{{ proposal.summary }}</div>
      }
    </app-card>
  `,
})
export class OpenProposalDetailsComponent implements OnInit {
  public readonly proposalList$ = this.proposalService.openProposalList$;
  public readonly proposalTopic = ProposalTopic;
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
  ) {
    this.proposalIdFromRoute$
      .pipe(takeUntilDestroyed())
      .subscribe(proposalId => {
        this.proposalService.setCurrentProposalId(proposalId);
      });

    this.currentProposal$
      .pipe(takeUntilDestroyed(), filter(Boolean))
      .subscribe(proposal => {
        if (proposal.state === ProposalState.Completed) {
          this.router.navigate([
            'proposals/closed',
            { id: this.proposalIdFromRoute$ },
          ]);
        }
      });
  }

  public ngOnInit(): void {
    this.proposalService.loadOpenProposalList();
  }
}
