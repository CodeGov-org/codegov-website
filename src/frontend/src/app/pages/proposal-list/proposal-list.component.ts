import { CommonModule, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';
import { ReviewPeriodState } from '@cg/backend';
import { FormatDatePipe } from '~core/pipes';
import {
  ProposalLinkBaseUrl,
  ProposalService,
  ProposalTopic,
} from '~core/state';
import {
  KeyValueGridComponent,
  KeyColComponent,
  ValueColComponent,
  FormFieldComponent,
  InputDirective,
  LabelDirective,
} from '~core/ui';

const LIST_FILTER = {
  InReview: 'In Review',
  Reviewed: 'Reviewed',
  All: 'All',
};

@Component({
  selector: 'app-proposal-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    FormFieldComponent,
    InputDirective,
    LabelDirective,
    FormatDatePipe,
    RouterLink,
    CardComponent,
    KeyValuePipe,
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

      .filter {
        display: flex;
        flex-direction: column;
        margin-bottom: size(4);

        @include sm {
          flex-direction: row;
        }
      }

      .filter__label {
        margin-bottom: size(2);
        margin-right: size(2);
        width: 100%;

        @include sm {
          width: 50%;
        }
      }
    `,
  ],
  template: `
    <h1 class="h3">Proposals</h1>
    <form [formGroup]="filterForm">
      <div class="filter">
        <div class="filter__label">Select code review status:</div>
        <app-form-field class="filter__value">
          <div class="radio-group">
            @for (property of listFilter | keyvalue; track property.key) {
              <input
                appInput
                [id]="property.key"
                [value]="property.key"
                type="radio"
                formControlName="filter"
              />
              <label appLabel [for]="property.key">
                {{ property.value }}
              </label>
            }
          </div>
        </app-form-field>
      </div>
    </form>

    @if (proposalList$ | async; as proposalList) {
      @for (proposal of proposalList; track proposal.id; let i = $index) {
        <cg-card class="proposal">
          <h2 class="h4 proposal__title" slot="cardTitle">
            {{ proposal.title }}
          </h2>

          <div slot="cardContent">
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

              <app-key-col [id]="'proposal-links-' + i">
                Voting links
              </app-key-col>
              <app-value-col [attr.aria-labelledby]="'proposal-links-' + i">
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

              <app-key-col [id]="'proposal-proposer-' + i">
                Proposer
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'proposal-proposer-' + i"
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

              <app-key-col [id]="'proposal-review-end-' + i">
                Review period end
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'proposal-review-end-' + i"
              >
                {{ proposal.reviewPeriodEnd | formatDate }}
              </app-value-col>

              <app-key-col [id]="'proposal-voting-end-' + i">
                Voting period end
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'proposal-voting-end-' + i"
              >
                {{ proposal.votingPeriodEnd | formatDate }}
              </app-value-col>

              <app-key-col [id]="'proposal-date-decided-' + i">
                Date decided
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'proposal-date-decided-' + i"
              >
                {{
                  proposal.decidedAt
                    ? (proposal.decidedAt | formatDate)
                    : 'Not yet decided'
                }}
              </app-value-col>

              <app-key-col [id]="'proposal-codegov-vote-' + i">
                CodeGov vote
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'proposal-codegov-vote-' + i"
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
              <a
                class="btn btn--outline"
                [routerLink]="['/review', proposal.id, 'edit']"
              >
                My review
              </a>
              <a class="btn btn--outline" [routerLink]="['/open', proposal.id]">
                View details
              </a>
            </div>
          </div>
        </cg-card>
      }
    }
  `,
})
export class ProposalListComponent implements OnInit, OnDestroy {
  public proposalList$ = this.proposalService.currentProposalList$;

  public readonly filterForm: FormGroup;
  public readonly listFilter = LIST_FILTER;

  public readonly proposalTopic = ProposalTopic;
  public readonly linkBaseUrl = ProposalLinkBaseUrl;

  private formSubscription?: Subscription;

  constructor(
    private readonly proposalService: ProposalService,
    public readonly formBuilder: FormBuilder,
  ) {
    this.filterForm = this.formBuilder.group({
      filter: ['InReview'],
    });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposalList({ in_progress: null });

    this.formSubscription = this.filterForm.controls[
      'filter'
    ].valueChanges.subscribe(() => {
      let inputParam: ReviewPeriodState | undefined;
      switch (this.filterForm.controls['filter'].value) {
        case 'InReview':
          inputParam = { in_progress: null };
          break;
        case 'Reviewed':
          inputParam = { completed: null };
          break;
        case 'All':
          inputParam = undefined;
          break;
      }
      this.updateList(inputParam);
    });
  }

  public ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }

  private async updateList(
    inputParam: ReviewPeriodState | undefined,
  ): Promise<void> {
    await this.proposalService.loadProposalList(inputParam);
  }
}
