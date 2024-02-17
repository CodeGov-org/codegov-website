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

      .reviewer-personal-info {
        margin-bottom: size(4);
      }
    `,
  ],
  template: `
    <app-key-value-grid class="reviewer-personal-info">
      <app-key-col>Username</app-key-col>
      <app-value-col>{{ userProfile.username }}</app-value-col>

      <app-key-col>Bio</app-key-col>
      <app-value-col>{{ userProfile.bio }}</app-value-col>

      <app-key-col>Wallet address</app-key-col>
      <app-value-col class="break-all">
        {{ userProfile.walletAddress }}
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
