import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs';

import { ProposalService } from '~core/state';
import { CardComponent } from '~core/ui';

@Component({
  selector: 'app-view-proposal-review',
  standalone: true,
  imports: [CommonModule, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        @include page-content;
      }
    `,
  ],
  template: `
    @if (currentProposal$ | async; as proposal) {
      <h1 class="h1">Review for proposal {{ proposal.id }} by AnonReviewer</h1>

      <app-card>
        <h2 class="h3" cardTitle>{{ proposal.title }}</h2>
      </app-card>
    }
  `,
})
export class ViewProposalReviewComponent implements OnInit {
  public readonly currentProposal$ = this.proposalService.currentProposal$;

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
  ) {
    this.proposalIdFromRoute$
      .pipe(takeUntilDestroyed())
      .subscribe(proposalId => {
        this.proposalService.setCurrentProposalId(proposalId);
      });
  }

  public ngOnInit(): void {
    this.proposalService.loadOpenProposalList();
  }
}
