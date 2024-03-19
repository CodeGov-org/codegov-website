import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { CardComponent } from '@cg/angular-ui';
import { Proposal } from '~core/state';

@Component({
  selector: 'app-closed-proposal-summary',
  standalone: true,
  imports: [CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [``],
  template: `
    <h2 class="h4">Review summary</h2>
    <cg-card class="summary">
      <div slot="cardContent">
        <h3 class="h5">Verification</h3>
        <p></p>
      </div>
    </cg-card>
  `,
})
export class ClosedProposalSummaryComponent {
  @Input({ required: true })
  public proposal!: Proposal;
}
