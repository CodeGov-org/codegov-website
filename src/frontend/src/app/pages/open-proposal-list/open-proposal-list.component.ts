import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NEURON_LINK_BASE_URL, ProposalTopic } from '~core/state';
import { ProposalService } from '~core/state/proposal/proposal.service';
import {
  CardComponent,
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-open-proposal-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    DatePipe,
    RouterModule,
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

      .proposal-action {
        @include no-underline;
      }
    `,
  ],
  template: `
    @if (proposalList$ | async; as proposalList) {
      @for (proposal of proposalList; track proposal.id) {
        <app-card class="proposal">
          <h2 class="h4 proposal-title" cardTitle>
            {{ proposal.title }}
          </h2>

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

            <app-key-col id="proposal-review-end"
              >Review period end</app-key-col
            >
            <app-value-col aria-labelledby="proposal-review-end">
              {{ proposal.reviewPeriodEnd | date: 'medium' }}</app-value-col
            >

            <app-key-col id="proposal-voting-end"
              >Voting period end</app-key-col
            >
            <app-value-col aria-labelledby="proposal-voting-end">
              {{ proposal.votingPeriodEnd | date: 'medium' }}
            </app-value-col>
          </app-key-value-grid>
          <div class="btn-group">
            <a
              class="btn btn--outline proposal-action"
              [routerLink]="['/open', proposal.id]"
              >View details</a
            >
          </div>
        </app-card>
      }
    }
  `,
})
export class OpenProposalListComponent implements OnInit {
  public readonly proposalList$ = this.proposalService.openProposalList$;
  public readonly proposalTopic = ProposalTopic;
  public readonly neuronBaseLink = NEURON_LINK_BASE_URL;

  constructor(private readonly proposalService: ProposalService) {}

  public ngOnInit(): void {
    this.proposalService.loadOpenProposalList();
  }
}
