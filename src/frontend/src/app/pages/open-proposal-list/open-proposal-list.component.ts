import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FormatDatePipe } from '~core/pipes';
import { ProposalLinkBaseUrl, ProposalTopic } from '~core/state';
import { ProposalService } from '~core/state';
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
    RouterModule,
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

      .proposal-title,
      .proposal-proposer {
        word-break: break-word;
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
      <h1 class="h3">Proposals pending review</h1>
      @for (proposal of proposalList; track proposal.id; let i = $index) {
        <app-card class="proposal">
          <h2 class="h4 proposal-title" cardTitle>
            {{ proposal.title }}
          </h2>

          <app-key-value-grid [columnNumber]="2">
            <app-key-col [id]="'proposal-id-' + i">ID</app-key-col>
            <app-value-col [attr.aria-labelledby]="'proposal-id-' + i">
              <a
                href="{{ linkBaseUrl.Proposal }}{{ proposal.id }}"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.id }}
              </a>
            </app-value-col>

            <app-key-col [id]="'proposal-links-' + i">Voting links</app-key-col>
            <app-value-col
              class="proposal-links"
              [attr.aria-labelledby]="'proposal-links-' + i"
            >
              @if (proposal.proposalLinks.length > 0) {
                @for (
                  proposalLink of proposal.proposalLinks;
                  track proposalLink.type
                ) {
                  <a
                    class="proposal-links__link"
                    href="{{ proposalLink.link }}"
                    target="_blank"
                    rel="nofollow noreferrer"
                  >
                    {{ proposalLink.type }}
                  </a>
                }
              }
            </app-value-col>

            <app-key-col [id]="'proposal-topic-' + i">Topic</app-key-col>
            <app-value-col [attr.aria-labelledby]="'proposal-topic-' + i">
              {{ proposal.topic }}
            </app-value-col>

            <app-key-col [id]="'proposal-type-' + i">Type</app-key-col>
            <app-value-col [attr.aria-labelledby]="'proposal-type-' + i">
              {{ proposal.type }}
            </app-value-col>

            <app-key-col [id]="'proposal-created-' + i">Created</app-key-col>
            <app-value-col [attr.aria-labelledby]="'proposal-created-' + i">
              {{ proposal.proposedAt | formatDate }}
            </app-value-col>

            <app-key-col [id]="'proposal-proposer-' + i">Proposer</app-key-col>
            <app-value-col
              [attr.aria-labelledby]="'proposal-proposer-' + i"
              class="proposal-proposer"
            >
              <a
                href="{{ linkBaseUrl.Neuron }}{{ proposal.proposedBy }}"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.proposedBy }}
              </a>
            </app-value-col>

            <app-key-col [id]="'proposal-review-end-' + i">
              Review period end
            </app-key-col>
            <app-value-col [attr.aria-labelledby]="'proposal-review-end-' + i">
              {{ proposal.reviewPeriodEnd | formatDate }}
            </app-value-col>

            <app-key-col [id]="'proposal-voting-end-' + i">
              Voting period end
            </app-key-col>
            <app-value-col [attr.aria-labelledby]="'proposal-voting-end-' + i">
              {{ proposal.votingPeriodEnd | formatDate }}
            </app-value-col>
          </app-key-value-grid>
          <div class="btn-group">
            <a
              class="btn btn--outline proposal-action"
              [routerLink]="['/open', proposal.id]"
            >
              View details
            </a>
          </div>
        </app-card>
      }
    }
  `,
})
export class OpenProposalListComponent implements OnInit {
  public readonly proposalList$ = this.proposalService.openProposalList$;
  public readonly proposalTopic = ProposalTopic;
  public readonly linkBaseUrl = ProposalLinkBaseUrl;

  constructor(private readonly proposalService: ProposalService) {}

  public ngOnInit(): void {
    this.proposalService.loadOpenProposalList();
  }
}
