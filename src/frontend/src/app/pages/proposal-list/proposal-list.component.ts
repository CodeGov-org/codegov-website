import { CommonModule, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  CardComponent,
  LinkTextBtnComponent,
  RadioInputComponent,
} from '@cg/angular-ui';
import { ProposalLinkBaseUrl, ProposalReviewStatus } from '~core/api';
import { ProposalState } from '~core/api';
import { FormatDatePipe } from '~core/pipes';
import { ProfileService, ProposalService, ReviewService } from '~core/state';
import {
  KeyValueGridComponent,
  KeyColComponent,
  ValueColComponent,
  FormFieldComponent,
  InputDirective,
} from '~core/ui';
import { isNotNil } from '~core/utils';

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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    FormFieldComponent,
    InputDirective,
    FormatDatePipe,
    RouterLink,
    CardComponent,
    KeyValuePipe,
    RadioInputComponent,
    LinkTextBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    :host {
      @include common.page-content;
    }

    .proposal {
      margin-bottom: common.size(6);
    }

    .proposal__title,
    .proposal__proposer {
      word-break: break-word;
    }

    .proposal__link {
      margin-right: common.size(4);
    }

    .proposal__vote {
      font-weight: bold;
    }

    .proposal__vote--adopt {
      color: common.$success;
    }

    .proposal__vote--reject {
      color: common.$error;
    }

    .filter {
      display: flex;
      flex-direction: column;
      margin-bottom: common.size(4);

      @include common.sm {
        flex-direction: row;
      }
    }

    .filter__label {
      margin-bottom: common.size(2);
      margin-right: common.size(2);
      width: 100%;

      @include common.sm {
        width: 50%;
      }
    }
  `,
  template: `
    <div class="page-heading">
      <h1 class="h3">Proposals</h1>
    </div>

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

    @for (
      proposal of proposalListWithReviewIds();
      track proposal.id;
      let i = $index
    ) {
      <cg-card class="proposal">
        <h2 class="h4 proposal__title" slot="cardTitle">
          {{ proposal.title }}
        </h2>

        <div slot="cardContent">
          <app-key-value-grid [columnNumber]="2">
            <app-key-col [id]="'proposal-id-' + i">ID</app-key-col>
            <app-value-col [attr.aria-labelledby]="'proposal-id-' + i">
              <a
                [href]="linkBaseUrl().Proposal + proposal.nsProposalId"
                target="_blank"
                rel="nofollow noreferrer"
              >
                {{ proposal.nsProposalId }}
              </a>
            </app-value-col>

            <app-key-col [id]="'proposal-links-' + i">Voting links</app-key-col>
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

            <app-key-col [id]="'proposal-proposer-' + i">Proposer</app-key-col>
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
            <app-value-col [attr.aria-labelledby]="'proposal-review-end-' + i">
              {{ proposal.reviewPeriodEnd | formatDate }}
            </app-value-col>

            <app-key-col [id]="'proposal-voting-end-' + i">
              Voting period end
            </app-key-col>
            <app-value-col [attr.aria-labelledby]="'proposal-voting-end-' + i">
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
          </app-key-value-grid>

          <div class="btn-group">
            @if (
              proposal.state === proposalState().InProgress && isReviewer()
            ) {
              @if (proposal.reviewState === undefined) {
                <cg-link-text-btn
                  [routerLink]="['/review', proposal.id, 'edit']"
                >
                  Create review
                </cg-link-text-btn>
              } @else if (
                proposal.reviewState === ProposalReviewStatus().Draft
              ) {
                <cg-link-text-btn
                  [routerLink]="['/review', proposal.id, 'edit']"
                >
                  Edit review
                </cg-link-text-btn>
              } @else if (
                proposal.reviewState === ProposalReviewStatus().Published
              ) {
                <cg-link-text-btn
                  [routerLink]="['/review', proposal.reviewId ?? '', 'view']"
                >
                  My review
                </cg-link-text-btn>
              }
            }

            <cg-link-text-btn [routerLink]="[proposal.id]">
              View details
            </cg-link-text-btn>
          </div>
        </div>
      </cg-card>
    }
  `,
})
export class ProposalListComponent {
  public readonly ProposalReviewStatus = signal(ProposalReviewStatus);

  public readonly proposalList = toSignal(
    this.proposalService.currentProposalList$,
  );

  public readonly isReviewer = toSignal(
    this.profileService.isCurrentUserReviewer$,
  );
  public readonly userProfile = toSignal(this.profileService.currentUser$);
  public readonly userReviewList = toSignal(
    this.reviewService.currentUserReviews$,
  );

  public readonly proposalListWithReviewIds = computed(() => {
    return this.proposalList()?.map(proposal => {
      const review = this.userReviewList()?.find(
        review => review.proposalId === proposal.id,
      );
      return {
        ...proposal,
        reviewId: review?.id,
        reviewState: review?.status,
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
  ) {
    this.proposalService.loadProposalList(ProposalState.InProgress);

    effect(() => {
      const userProfile = this.userProfile();

      if (isNotNil(userProfile)) {
        this.reviewService.loadReviewsByReviewerId(userProfile.id);
      }
    });

    this.filterForm()
      .valueChanges.pipe(takeUntilDestroyed())
      .subscribe(formValue => {
        this.onFilterFormUpdated(formValue.reviewPeriodState);
      });
  }

  private async onFilterFormUpdated(
    formValue: ReviewPeriodStateFilter | undefined,
  ): Promise<void> {
    let inputParam: ProposalState = ProposalState.Any;

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
}
