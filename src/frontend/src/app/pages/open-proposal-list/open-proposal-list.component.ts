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

// const FAKE_LIST = [
//   {
//     id: 127768,
//     title:
//       'Upgrade NNS Canister: rwlgt-iiaaa-aaaaa-aaaaa-cai to wasm with hash: 57050d34ce370dacd7d323bf1c3aea448ce7e9636fe658b822f8902fe0732188',
//     topic: ProposalTopic.SCM,
//     type: 'NNS Canister Upgrade',
//     state: ProposalState.InProgress,
//     reviewPeriodEnd: new Date(2024, 1, 17, 1, 1, 25),
//     votingPeriodEnd: new Date(2024, 1, 19, 1, 1, 25),
//     proposedAt: new Date(2024, 1, 15, 1, 1, 25),
//     proposedBy: 16664007084337444895n,
//     summary: 'This is an SCM summary',
//     proposalLinks: [
//       {
//         type: ProposalLinkType.NNSDApp,
//         link: 'https://nns.ic0.app/proposal/?u=qoctq-giaaa-aaaaa-aaaea-cai&proposal=127768',
//       },
//     ],
//   },
//   {
//     id: 127707,
//     title: 'Elect new IC/Replica revision (commit 3e25df8f)',
//     topic: ProposalTopic.RVM,
//     type: 'Update Elected Replica Versions',
//     state: ProposalState.InProgress,
//     reviewPeriodEnd: new Date(2024, 1, 16, 1, 1, 25),
//     votingPeriodEnd: new Date(2024, 1, 20, 1, 1, 25),
//     proposedAt: new Date(2024, 1, 14, 1, 1, 25),
//     proposedBy: 77,
//     summary: 'This is an RVM summary',
//     proposalLinks: [
//       {
//         type: ProposalLinkType.DfinityDashboard,
//         link: 'https://dashboard.internetcomputer.org/proposal/126875',
//       },
//     ],
//   },
// ];

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

  //public proposalList: Proposal[] = FAKE_LIST;

  constructor(private readonly proposalService: ProposalService) {}

  public ngOnInit(): void {
    this.proposalService.loadOpenProposalList();
  }
}
