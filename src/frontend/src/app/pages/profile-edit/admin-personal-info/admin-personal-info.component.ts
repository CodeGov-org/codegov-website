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
    <app-key-value-grid>
      <app-key-col id="admin-username">Username</app-key-col>
      <app-value-col aria-labelledby="admin-username">
        {{ userProfile.username }}
      </app-value-col>

      <app-key-col id="admin-bio">Bio</app-key-col>
      <app-value-col aria-labelledby="admin-bio">
        {{ userProfile.bio }}
      </app-value-col>
    </app-key-value-grid>

    <div class="btn-group">
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
