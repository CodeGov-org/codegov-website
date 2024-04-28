import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';
import { ProposalService, ProposalState } from '~core/state';
import { isNil } from '~core/utils';
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
      <h1 class="h1">Submit review for proposal {{ proposal.id }}</h1>

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
  public readonly currentProposal = toSignal(
    this.proposalService.currentProposal$,
  );

  private readonly proposalIdFromRoute$ = this.route.params.pipe(
    map(params => {
      try {
        return BigInt(params['id']);
      } catch (error) {
        return null;
      }
    }),
    filter(Boolean),
  );

  constructor(
    private readonly proposalService: ProposalService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.proposalIdFromRoute$
      .pipe(takeUntilDestroyed())
      .subscribe(proposalId => {
        this.proposalService.setCurrentProposalId(proposalId);
      });

    effect(() => {
      const proposal = this.currentProposal();
      if (isNil(proposal)) {
        return;
      }

      if (proposal.state === ProposalState.Completed) {
        this.router.navigate(['review', 'view', { id: proposal.id }]);
      }
    });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposalList(ProposalState.InProgress);
  }
}
