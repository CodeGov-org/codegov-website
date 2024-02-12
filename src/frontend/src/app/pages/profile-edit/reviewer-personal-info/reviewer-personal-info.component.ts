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
  template: `
    <app-key-value-grid class="mb-4">
      <app-key-col>Username</app-key-col>
      <app-value-col>{{ userProfile.username }}</app-value-col>

      <app-key-col>Bio</app-key-col>
      <app-value-col>{{ userProfile.bio }}</app-value-col>

      <app-key-col>Wallet address</app-key-col>
      <app-value-col class="break-all">
        {{ userProfile.walletAddress }}
      </app-value-col>
    </app-key-value-grid>

    <div class="flex items-center justify-end">
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
