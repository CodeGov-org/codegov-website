import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';
import { GetProposalReviewCommitResponse, ProposalState } from '~core/api';
import { ProposalService, ReviewService } from '~core/state';
import { filterNotNil, routeParam, toSyncSignal } from '~core/utils';
import { ReviewCommitsFormComponent } from './review-commits-form';
import { ReviewDetailsFormComponent } from './review-details-form';

@Component({
  selector: 'app-proposal-review-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ReviewCommitsFormComponent,
    ReviewDetailsFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        @include page-content;
      }

      .proposal-overview-card {
        margin-bottom: size(4);
      }

      .review-card {
        margin-top: size(6);
      }
    `,
  ],
  template: `
    @if (currentProposal(); as proposal) {
      <h1 class="h1">Submit review for proposal {{ proposal.nsProposalId }}</h1>

      <cg-card class="proposal-overview-card">
        <h2 class="h3" slot="cardTitle">{{ proposal.title }}</h2>
      </cg-card>

      <h2 class="h3">Commits</h2>
      <app-review-commits-form />

      <cg-card class="review-card">
        <h2 class="h3" slot="cardTitle">Review details</h2>

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

  public readonly currentProposal = toSyncSignal(
    this.proposalService.currentProposal$,
  );
  public readonly review = toSyncSignal(this.reviewService.currentReview$);
  public readonly reviewCommits = computed<GetProposalReviewCommitResponse[]>(
    () => this.review()?.commits ?? [],
  );

  constructor() {
    routeParam('id').subscribe(proposalId => {
      this.proposalService.setCurrentProposalId(proposalId);
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
