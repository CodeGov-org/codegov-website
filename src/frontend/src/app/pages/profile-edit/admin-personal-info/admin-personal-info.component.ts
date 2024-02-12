import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '../../../core/ui';
import { AdminProfile } from '~core/state';

@Component({
  selector: 'app-admin-personal-info',
  standalone: true,
  imports: [KeyValueGridComponent, KeyColComponent, ValueColComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-key-value-grid class="mb-4">
      <app-key-col>Username</app-key-col>
      <app-value-col>{{ userProfile.username }}</app-value-col>

      <app-key-col>Bio</app-key-col>
      <app-value-col>{{ userProfile.bio }}</app-value-col>
    </app-key-value-grid>

    <div class="flex items-center justify-end">
      <button type="button" class="btn" (click)="editForm()">Edit</button>
    </div>
  `,
})
export class AdminPersonalInfoComponent {
  @Input({ required: true })
  public userProfile!: AdminProfile;

  @Output()
  public edit = new EventEmitter<void>();

  public editForm(): void {
    this.edit.emit();
  }
}
