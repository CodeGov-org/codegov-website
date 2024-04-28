import { CommonModule, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CardComponent, RadioInputComponent } from '@cg/angular-ui';
import { FormatDatePipe } from '~core/pipes';
import {
  ProfileService,
  ProposalLinkBaseUrl,
  ProposalService,
  ProposalState,
  ReviewService,
} from '~core/state';
import {
  KeyValueGridComponent,
  KeyColComponent,
  ValueColComponent,
  FormFieldComponent,
  InputDirective,
  LabelDirective,
} from '~core/ui';

enum ReviewPeriodStateFilter {
  InReview = 'InReview',
  Reviewed = 'Reviewed',
  All = 'All',
}

const reviewPeriodStateFilter = {
  [ReviewPeriodStateFilter.InReview]: 'In Review',
  [ReviewPeriodStateFilter.Reviewed]: 'Reviewed',
  [ReviewPeriodStateFilter.All]: 'All',
};

interface FilterForm {
  reviewPeriodState: FormControl<ReviewPeriodStateFilter>;
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
    FormatDatePipe,
    RouterLink,
    CardComponent,
    KeyValuePipe,
    RadioInputComponent,
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
    <form [formGroup]="filterForm()">
      <div class="filter">
        <div class="filter__label">Select code review status:</div>
        <app-form-field class="filter__value">
          <div class="radio-group">
            @for (property of listFilter() | keyvalue; track property.key) {
              <cg-radio-input
                appInput
                [value]="property.key"
                formControlName="reviewPeriodState"
                name="reviewPeriodState"
              >
                {{ property.value }}
              </cg-radio-input>
            }
          </div>
        </app-form-field>
      </div>
    </form>

    @if (proposalListWithReviewIds(); as proposalList) {
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
                  [href]="linkBaseUrl().Proposal + proposal.id"
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
                    [href]="proposalLink.link"
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
                  [href]="linkBaseUrl().Neuron + proposal.proposedBy"
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
              @if (
                proposal.state === proposalState().InProgress && isReviewer()
              ) {
                @if (proposal.reviewState === undefined) {
                  <a
                    class="btn btn--outline"
                    (click)="onCreateReview(proposal.id)"
                  >
                    Create review
                  </a>
                } @else if (proposal.reviewState === 'Draft') {
                  <a
                    class="btn btn--outline"
                    [routerLink]="['/review', proposal.id, 'edit']"
                  >
                    Edit review
                  </a>
                } @else if (proposal.reviewState === 'Completed') {
                  <a
                    class="btn btn--outline"
                    [routerLink]="['/review', proposal.reviewId, 'view']"
                  >
                    My review
                  </a>
                }
              }
              <a class="btn btn--outline" [routerLink]="[proposal.id]">
                View details
              </a>
            </div>
          </div>
        </cg-card>
      }
    }
  `,
})
export class ProposalListComponent {
  public readonly proposalList = toSignal(
    this.proposalService.currentProposalList$,
  );

  public readonly isReviewer = toSignal(this.profileService.isReviewer$);
  public readonly userProfile = toSignal(this.profileService.userProfile$);
  public readonly userReviewList = toSignal(this.reviewService.userReviewList$);

  public readonly proposalListWithReviewIds = computed(() => {
    return this.proposalList()?.map(proposal => {
      const review = this.userReviewList()?.find(
        review => review.proposalId === proposal.id,
      );
      return {
        ...proposal,
        reviewId: review?.id,
        reviewState: review?.state,
      };
    });
  });

  public readonly filterForm = signal(
    new FormGroup<FilterForm>({
      reviewPeriodState: new FormControl(ReviewPeriodStateFilter.InReview, {
        nonNullable: true,
      }),
    }),
  );

  public readonly proposalState = signal(ProposalState);
  public readonly listFilter = signal(reviewPeriodStateFilter);
  public readonly linkBaseUrl = signal(ProposalLinkBaseUrl);

  constructor(
    private readonly proposalService: ProposalService,
    private readonly profileService: ProfileService,
    private readonly reviewService: ReviewService,
    private readonly router: Router,
  ) {
    this.proposalService.loadProposalList(ProposalState.InProgress);
    if (this.userProfile()) {
      this.reviewService.loadReviewListByReviewerlId(this.userProfile()!.id);
    }

    this.filterForm()
      .valueChanges.pipe(takeUntilDestroyed())
      .subscribe(formValue => {
        this.onFilterFormUpdated(formValue.reviewPeriodState);
      });
  }

  private async onFilterFormUpdated(
    formValue: ReviewPeriodStateFilter | undefined,
  ): Promise<void> {
    let inputParam: ProposalState | undefined;

    switch (formValue) {
      case ReviewPeriodStateFilter.InReview:
        inputParam = ProposalState.InProgress;
        break;

      case ReviewPeriodStateFilter.Reviewed:
        inputParam = ProposalState.Completed;
        break;
    }

    await this.proposalService.loadProposalList(inputParam);
  }

  public async onCreateReview(proposalId: bigint): Promise<void> {
    if (this.userProfile()) {
      try {
        await this.reviewService.createReview(
          proposalId,
          this.userProfile()!.id,
        );
      } catch {
        throw new Error('Cannot create review');
      } finally {
        this.router.navigate(['/review', proposalId, 'edit']);
      }
    }
  }
}
