import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FormatDatePipe } from '~core/pipes';
import {
  ProposalLinkBaseUrl,
  ProposalService,
  ProposalTopic,
} from '~core/state';
import {
  CardComponent,
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-closed-proposal-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    FormatDatePipe,
    RouterModule,
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
    @if (proposalList$ | async; as proposalList) {
      <h1 class="h3">Reviewed proposals</h1>
      @for (proposal of proposalList; track proposal.id; let i = $index) {
        <app-card class="proposal">
          <h2 class="h4 proposal__title" cardTitle>
            {{ proposal.title }}
          </h2>

          <app-key-value-grid [columnNumber]="2">
            <app-key-col [id]="'closed-proposal-id-' + i">ID</app-key-col>
            <app-value-col [attr.aria-labelledby]="'closed-proposal-id-' + i">
              <a
                href="{{ linkBaseUrl.Proposal }}{{ proposal.id }}"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.id }}
              </a>
            </app-value-col>

            <app-key-col [id]="'closed-proposal-links-' + i">
              Voting links</app-key-col
            >
            <app-value-col
              [attr.aria-labelledby]="'closed-proposal-links-' + i"
            >
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
            </app-value-col>

            <app-key-col [id]="'closed-proposal-topic-' + i">Topic</app-key-col>
            <app-value-col
              [attr.aria-labelledby]="'closed-proposal-topic-' + i"
            >
              {{ proposal.topic }}
            </app-value-col>

            <app-key-col [id]="'closed-proposal-type-' + i">Type</app-key-col>
            <app-value-col [attr.aria-labelledby]="'closed-proposal-type-' + i">
              {{ proposal.type }}
            </app-value-col>

            <app-key-col [id]="'closed-proposal-created-' + i">
              Created</app-key-col
            >
            <app-value-col
              [attr.aria-labelledby]="'closed-proposal-created-' + i"
            >
              {{ proposal.proposedAt | formatDate }}
            </app-value-col>

            <app-key-col [id]="'closed-proposal-proposer-' + i">
              Proposer</app-key-col
            >
            <app-value-col
              [attr.aria-labelledby]="'closed-proposal-proposer-' + i"
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

            <app-key-col [id]="'closed-proposal-date-decided-' + i">
              Date decided
            </app-key-col>
            <app-value-col
              [attr.aria-labelledby]="'closed-proposal-date-decided-' + i"
            >
              {{
                proposal.decidedAt
                  ? (proposal.decidedAt | formatDate)
                  : 'Not yet decided'
              }}
            </app-value-col>

            <app-key-col [id]="'closed-proposal-codegov-vote-' + i">
              CodeGov vote
            </app-key-col>
            <app-value-col
              [attr.aria-labelledby]="'closed-proposal-codegov-vote-' + i"
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
            <a class="btn btn--outline" [routerLink]="['/closed', proposal.id]">
              View details
            </a>
          </div>
        </app-card>
      }
    }
  `,
})
export class ClosedProposalListComponent implements OnInit {
  public readonly proposalList$ = this.proposalService.closedProposalList$;
  public readonly proposalTopic = ProposalTopic;
  public readonly linkBaseUrl = ProposalLinkBaseUrl;

  constructor(private readonly proposalService: ProposalService) {}

  public ngOnInit(): void {
    this.proposalService.loadClosedProposalList();
  }
}
