import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { ReviewerUserProfile } from '~core/api';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-reviewer-personal-info',
  imports: [KeyValueGridComponent, KeyColComponent, ValueColComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-key-value-grid>
      <app-key-col id="reviewer-username">Username</app-key-col>
      <app-value-col aria-labelledby="reviewer-username">
        {{ userProfile().username }}
      </app-value-col>

      <app-key-col id="reviewer-bio">Bio</app-key-col>
      <app-value-col aria-labelledby="reviewer-bio">
        {{ userProfile().bio }}
      </app-value-col>

      <app-key-col id="reviewer-wallet-address">Wallet address</app-key-col>
      <app-value-col aria-labelledby="reviewer-wallet-address">
        <a
          class="truncate"
          [href]="
            'https://dashboard.internetcomputer.org/account/' +
            userProfile().walletAddress
          "
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ userProfile().walletAddress }}
        </a>
      </app-value-col>
    </app-key-value-grid>

    <div class="btn-group">
      <button type="button" class="btn" (click)="onEditForm()">Edit</button>
    </div>
  `,
})
export class ReviewerPersonalInfoComponent {
  public readonly userProfile = input.required<ReviewerUserProfile>();

  public readonly edit = output();

  public onEditForm(): void {
    this.edit.emit();
  }
}
