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
import { Router, RouterLink } from '@angular/router';

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
    RouterLink,
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
    @if (currentReview(); as review) {
      @if (currentProposal(); as proposal) {
        @let ProposalReviewStatus = proposalReviewStatus();

        <div class="page-heading">
          <h1 class="h3">
            Submit review for proposal {{ proposal.nsProposalId }}
          </h1>

          @if (review.status === ProposalReviewStatus.Published) {
            <cg-badge theme="success">Published</cg-badge>
          } @else {
            <cg-badge theme="error">Draft</cg-badge>
          }
        </div>
        <h2 class="h6">{{ proposal.title }}</h2>

        <h2 class="h4 section-heading">Commits</h2>
        <app-review-commits-form />

        <h2 class="h4 section-heading">Review details</h2>
        <cg-card class="review-card">
          <div slot="cardContent">
            <app-review-details-form />
          </div>
        </cg-card>

        <div class="btn-group publish-btn-group">
          <a
            class="btn btn--outline"
            [routerLink]="['/review', review.id, 'view']"
          >
            View review
          </a>

          @if (review.status === ProposalReviewStatus.Published) {
            <app-loading-button
              [isSaving]="isStatusChanging()"
              btnClass="btn btn--outline btn--error"
              (click)="editReview()"
              theme="white"
            >
              Unpublish
            </app-loading-button>
          } @else {
            <app-loading-button
              [isSaving]="isStatusChanging()"
              btnClass="btn btn--outline btn--success"
              (click)="publishReview()"
              theme="white"
            >
              Publish
            </app-loading-button>
          }
        </div>
      }
    }
  `,
})
export class ProposalReviewEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly proposalService = inject(ProposalService);
  private readonly reviewSubmissionService = inject(ReviewSubmissionService);

  public readonly proposalReviewStatus = signal(ProposalReviewStatus);

  public readonly currentProposalId = routeParamSignal('proposalId');
  public readonly currentProposal = toSyncSignal(
    this.proposalService.currentProposal$,
  );
  public readonly currentReview = toSyncSignal(
    this.reviewSubmissionService.review$,
  );

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

      if (isNotNil(proposal) && proposal.state === ProposalState.Completed) {
        this.router.navigate(['review', 'view', { id: proposal.id }]);
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
