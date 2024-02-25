import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { ReviewerProfile } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-reviewer-personal-info',
  standalone: true,
  imports: [KeyValueGridComponent, KeyColComponent, ValueColComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .wallet-address {
        word-break: break-all;
      }
    `,
  ],
  template: `
    <app-key-value-grid>
      <app-key-col id="reviewer-username">Username</app-key-col>
      <app-value-col aria-labelledby="reviewer-username">
        {{ userProfile.username }}
      </app-value-col>

      <app-key-col id="reviewer-bio">Bio</app-key-col>
      <app-value-col aria-labelledby="reviewer-bio">
        {{ userProfile.bio }}
      </app-value-col>

      <app-key-col id="reviewer-wallet-address">Wallet address</app-key-col>
      <app-value-col
        class="wallet-address"
        aria-labelledby="reviewer-wallet-address"
      >
        <a
          [href]="
            'https://dashboard.internetcomputer.org/account/' +
            userProfile.walletAddress
          "
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ userProfile.walletAddress }}
        </a>
      </app-value-col>
    </app-key-value-grid>

    <div class="btn-group">
      <button type="button" class="btn" (click)="editForm()">Edit</button>
    </div>
  `,
})
export class ReviewerPersonalInfoComponent {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  @Output()
  public edit = new EventEmitter<void>();

  public editForm(): void {
    this.edit.emit();
  }
}
