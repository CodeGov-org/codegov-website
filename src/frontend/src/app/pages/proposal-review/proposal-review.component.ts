import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { of } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';

@Component({
  selector: 'app-proposal-review',
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
    @if (currentReview$ | async; as proposal) {
      <h1 class="h1">Review for proposal {{ proposal.id }} by AnonReviewer</h1>

      <cg-card>
        <h2 class="h3" slot="cardTitle">{{ proposal.title }}</h2>
      </cg-card>
    }
  `,
})
export class ProposalReviewComponent {
  public currentReview$ = of({ id: 1, title: 'Proposal Title' });
}
