import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  Proposal,
  ProposalLinkType,
  ProposalState,
  ProposalTopic,
} from '~core/state';
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

      .proposal-links {
        align-items: baseline;
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
      <h2 class="h4 proposal-title" cardTitle>
        {{ proposal.id }}: {{ proposal.title }}
      </h2>
      <app-key-value-grid [columnNumber]="2">
        <app-key-col>Type</app-key-col>
        <app-value-col>{{ proposal.type }}</app-value-col>

        <app-key-col>Created</app-key-col>
        <app-value-col>{{
          proposal.proposedAt | date: 'medium'
        }}</app-value-col>

        <app-key-col>Proposer</app-key-col>
        <app-value-col>{{ proposal.proposedBy }}</app-value-col>

        <app-key-col>Review period end</app-key-col>
        <app-value-col>{{
          proposal.reviewPeriodEnd | date: 'medium'
        }}</app-value-col>

        <app-key-col>Voting period end</app-key-col>
        <app-value-col>{{
          proposal.votingPeriodEnd | date: 'medium'
        }}</app-value-col>

        @if (proposal.topic === proposalTopic.RVM) {
          <app-key-col>Canister</app-key-col>
          <app-value-col>{{ proposal.canister }}</app-value-col>
        }

        <app-key-col>Links</app-key-col>
        <app-value-col class="proposal-links">
          @if (proposal.proposalLinks !== []) {
            @for (
              proposalLink of proposal.proposalLinks;
              track proposalLink.type
            ) {
              <a class="proposal-links__link" href="{{ proposalLink.link }}">{{
                proposalLink.type
              }}</a>
            }
          }
        </app-value-col>
      </app-key-value-grid>

      <h2 class="h4 proposal-summary">Proposal summary</h2>
      <div>{{ proposal.summary }}</div>
    </app-card>
  `,
})
export class OpenProposalDetailsComponent {
  public proposal: Proposal = {
    id: 127768,
    title:
      'Upgrade NNS Canister: rwlgt-iiaaa-aaaaa-aaaaa-cai to wasm with hash: 57050d34ce370dacd7d323bf1c3aea448ce7e9636fe658b822f8902fe0732188',
    topic: ProposalTopic.SCM,
    type: 'NNS Canister Upgrade',
    state: ProposalState.InProgress,
    reviewPeriodEnd: new Date(2024, 1, 17, 1, 1, 25),
    votingPeriodEnd: new Date(2024, 1, 19, 1, 1, 25),
    proposedAt: new Date(2024, 1, 15, 1, 1, 25),
    proposedBy: 16664007084337444895n,
    summary: 'This is an SCM summary',
    proposalLinks: [
      {
        type: ProposalLinkType.NNSDApp,
        link: 'https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=127768',
      },
      {
        type: ProposalLinkType.DfinityDashboard,
        link: 'https://dashboard.internetcomputer.org/proposal/127768',
      },
    ],
  };
  public readonly proposalTopic = ProposalTopic;
}
