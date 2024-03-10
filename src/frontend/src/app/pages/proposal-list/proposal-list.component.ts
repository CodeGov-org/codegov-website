import { Dialog } from '@angular/cdk/dialog';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

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
  CardComponent,
  LoadingDialogComponent,
  getLoadingDialogConfig,
  LoadingDialogInput,
} from '~core/ui';
import { keysOf } from '~core/utils';

enum FilterOptions {
  InReview = 'In review',
  Reviewed = 'Reviewed',
  All = 'All',
}

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
    CardComponent,
    FormatDatePipe,
    RouterLink,
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
            @for (key of filterOptionsKeys; track key) {
              <input
                appInput
                [id]="key"
                [value]="key"
                type="radio"
                formControlName="filter"
                (change)="updateFilter()"
              />
              <label appLabel [for]="key">
                {{ filterOptions[key].valueOf() }}
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
              <app-key-col [id]="'open-proposal-id-' + i">ID</app-key-col>
              <app-value-col [attr.aria-labelledby]="'open-proposal-id-' + i">
                <a
                  href="{{ linkBaseUrl.Proposal }}{{ proposal.id }}"
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  {{ proposal.id }}
                </a>
              </app-value-col>

              <app-key-col [id]="'open-proposal-links-' + i">
                Voting links
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'open-proposal-links-' + i"
              >
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

              <app-key-col [id]="'open-proposal-topic-' + i">Topic</app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'open-proposal-topic-' + i"
              >
                {{ proposal.topic }}
              </app-value-col>

              <app-key-col [id]="'open-proposal-type-' + i">Type</app-key-col>
              <app-value-col [attr.aria-labelledby]="'open-proposal-type-' + i">
                {{ proposal.type }}
              </app-value-col>

              <app-key-col [id]="'open-proposal-created-' + i">
                Created
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'open-proposal-created-' + i"
              >
                {{ proposal.proposedAt | formatDate }}
              </app-value-col>

              <app-key-col [id]="'open-proposal-proposer-' + i">
                Proposer
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'open-proposal-proposer-' + i"
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

              <app-key-col [id]="'open-proposal-review-end-' + i">
                Review period end
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'open-proposal-review-end-' + i"
              >
                {{ proposal.reviewPeriodEnd | formatDate }}
              </app-value-col>

              <app-key-col [id]="'open-proposal-voting-end-' + i">
                Voting period end
              </app-key-col>
              <app-value-col
                [attr.aria-labelledby]="'open-proposal-voting-end-' + i"
              >
                {{ proposal.votingPeriodEnd | formatDate }}
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
export class ProposalListComponent implements OnInit {
  public proposalList$ = this.proposalService.currentProposalList$;

  private selectedFilterSubject = new BehaviorSubject<
    keyof typeof FilterOptions
  >('InReview');
  public selectedFilter$ = this.selectedFilterSubject.asObservable();

  public readonly filterForm: FormGroup;
  public readonly filterOptions = FilterOptions;
  public readonly filterOptionsKeys = keysOf(FilterOptions);

  public readonly proposalTopic = ProposalTopic;
  public readonly linkBaseUrl = ProposalLinkBaseUrl;

  private loadProposalsMessage: LoadingDialogInput = {
    message: 'Loading data...',
  };

  constructor(
    private readonly proposalService: ProposalService,
    public readonly formBuilder: FormBuilder,
    private readonly dialog: Dialog,
  ) {
    this.filterForm = this.formBuilder.group({
      filter: ['InReview'],
    });
  }

  public ngOnInit(): void {
    this.selectedFilter$.subscribe(value => {
      let inputParam: ReviewPeriodState | undefined;
      switch (value) {
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

  public updateFilter(): void {
    const filterControl = this.filterForm.get('filter');

    if (filterControl !== null) {
      const filterValue = filterControl.value;
      if (filterValue !== undefined) {
        this.selectedFilterSubject.next(
          Object.keys(FilterOptions).find(
            key => key === filterValue,
          ) as keyof typeof FilterOptions,
        );
      }
    }
  }

  public async updateList(
    inputParam: ReviewPeriodState | undefined,
  ): Promise<void> {
    const loadingDialog = this.dialog.open(
      LoadingDialogComponent,
      getLoadingDialogConfig(this.loadProposalsMessage),
    );

    try {
      await this.proposalService.loadProposalList(inputParam);
    } finally {
      loadingDialog.close();
    }
  }
}
