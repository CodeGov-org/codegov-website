import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CardComponent, BadgeComponent } from '@cg/angular-ui';
import { ProposalReviewStatus, ProposalState } from '~core/api';
import { ProposalService, ReviewSubmissionService } from '~core/state';
import { LoadingButtonComponent } from '~core/ui';
import { isNotNil, routeParamSignal, toSyncSignal } from '~core/utils';
import { ReviewCommitsFormComponent } from './review-commits-form';
import { ReviewDetailsFormComponent } from './review-details-form';

@Component({
  selector: 'app-proposal-review-edit',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    BadgeComponent,
    LoadingButtonComponent,
    ReviewCommitsFormComponent,
    ReviewDetailsFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      :host {
        @include common.page-content;
      }

      .page-heading {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }

      .section-heading {
        margin-top: common.size(8);
      }

      .publish-btn-group {
        margin-top: common.size(4);
        padding-right: common.size(4);
      }
    `,
  ],
  template: `
    @if (currentProposal(); as proposal) {
      <div class="page-heading">
        <h1 class="h1">
          Submit review for proposal {{ proposal.nsProposalId }}
        </h1>

        @if (review()?.status === ProposalReviewStatus().Published) {
          <cg-badge theme="success">Published</cg-badge>
        } @else {
          <cg-badge theme="error">Draft</cg-badge>
        }
      </div>
      <h2 class="h4">{{ proposal.title }}</h2>

      <h2 class="h3 section-heading">Commits</h2>
      <app-review-commits-form />

      <h2 class="h3 section-heading">Review details</h2>
      <cg-card class="review-card">
        <div slot="cardContent">
          <app-review-details-form />
        </div>
      </cg-card>

      <div class="btn-group publish-btn-group">
        @if (review()?.status === ProposalReviewStatus().Published) {
          <app-loading-button
            [isSaving]="isStatusChanging()"
            class="btn btn--outline btn--error"
            (click)="editReview()"
            theme="white"
          >
            Edit
          </app-loading-button>
        } @else {
          <app-loading-button
            [isSaving]="isStatusChanging()"
            class="btn btn--outline btn--success"
            (click)="publishReview()"
            theme="white"
          >
            Publish
          </app-loading-button>
        }
      </div>
    }
  `,
})
export class ProposalReviewEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly proposalService = inject(ProposalService);
  private readonly reviewSubmissionService = inject(ReviewSubmissionService);

  public readonly ProposalReviewStatus = signal(ProposalReviewStatus);

  public readonly currentProposalId = routeParamSignal('id');
  public readonly currentProposal = toSyncSignal(
    this.proposalService.currentProposal$,
  );
  public readonly review = toSyncSignal(this.reviewSubmissionService.review$);

  public readonly isStatusChanging = signal(false);

  constructor() {
    effect(() => {
      const proposalId = this.currentProposalId();

      if (isNotNil(proposalId)) {
        this.proposalService.setCurrentProposalId(proposalId);
        this.reviewSubmissionService.loadOrCreateReview(proposalId);
      }
    });

    effect(() => {
      const proposal = this.currentProposal();

      if (isNotNil(proposal)) {
        if (proposal.state === ProposalState.Completed) {
          this.router.navigate(['review', 'view', { id: proposal.id }]);
        }
      }
    });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposalList(ProposalState.InProgress);
  }

  public async publishReview(): Promise<void> {
    this.isStatusChanging.set(true);
    await this.reviewSubmissionService.publishReview();
    this.isStatusChanging.set(false);
  }

  public async editReview(): Promise<void> {
    this.isStatusChanging.set(true);
    await this.reviewSubmissionService.editReview();
    this.isStatusChanging.set(false);
  }
}
