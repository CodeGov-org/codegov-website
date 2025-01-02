import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';

import { CardComponent, BadgeComponent } from '@cg/angular-ui';
import { ProposalReviewStatus, ProposalState } from '~core/api';
import {
  ProposalService,
  ReviewService,
  ReviewSubmissionService,
} from '~core/state';
import { filterNotNil, routeParam, toSyncSignal } from '~core/utils';
import { ReviewCommitsFormComponent } from './review-commits-form';
import { ReviewDetailsFormComponent } from './review-details-form';

@Component({
  selector: 'app-proposal-review-edit',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    BadgeComponent,
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
    }
  `,
})
export class ProposalReviewEditComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly proposalService = inject(ProposalService);
  private readonly reviewService = inject(ReviewService);
  private readonly reviewSubmissionService = inject(ReviewSubmissionService);

  public readonly ProposalReviewStatus = signal(ProposalReviewStatus);
  public readonly currentProposal = toSyncSignal(
    this.proposalService.currentProposal$,
  );
  public readonly review = toSyncSignal(this.reviewService.currentReview$);

  constructor() {
    routeParam('id').subscribe(proposalId => {
      this.proposalService.setCurrentProposalId(proposalId);
      this.reviewSubmissionService.loadOrCreateReview(proposalId);
    });

    this.proposalService.currentProposal$
      .pipe(filterNotNil(), first())
      .subscribe(proposal => {
        if (proposal.state === ProposalState.Completed) {
          this.router.navigate(['review', 'view', { id: proposal.id }]);
        }
      });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposalList(ProposalState.InProgress);
  }
}
