import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProposalTopic } from '~core/state';
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
    `,
  ],
  template: `
    @if (proposalList$ | async; as proposalList) {
      @for (proposal of proposalList; track proposal.id) {
        <app-card class="proposal">
          <h2 class="h4 proposal-title" cardTitle>
            {{ proposal.id }}: {{ proposal.title }}
          </h2>
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
          <div class="btn-group">
            <a [routerLink]="['/proposals/open', proposal.id]">View details</a>
          </div>
        </app-card>
      }
    }
  `,
})
export class OpenProposalListComponent implements OnInit {
  public readonly proposalList$ = this.proposalService.openProposalList$;
  public readonly proposalTopic = ProposalTopic;

  constructor(private readonly proposalService: ProposalService) {}

  public ngOnInit(): void {
    this.proposalService.loadOpenProposalList();
  }
}
