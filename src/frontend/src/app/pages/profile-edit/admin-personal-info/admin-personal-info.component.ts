import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
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
        {{ userProfile().username }}
      </app-value-col>

      <app-key-col id="admin-bio">Bio</app-key-col>
      <app-value-col aria-labelledby="admin-bio">
        {{ userProfile().bio }}
      </app-value-col>
    </app-key-value-grid>

    <div class="btn-group">
      <button type="button" class="btn" (click)="onEditForm()">Edit</button>
    </div>
  `,
})
export class AdminPersonalInfoComponent {
  public readonly userProfile = input.required<AdminProfile>();

  public readonly edit = output();

  public onEditForm(): void {
    this.edit.emit();
  }
}
