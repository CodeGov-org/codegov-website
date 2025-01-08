import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { TextBtnComponent } from '@cg/angular-ui';
import { AdminUserProfile } from '~core/api';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-admin-personal-info',
  imports: [
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    TextBtnComponent,
  ],
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
      <cg-text-btn (click)="onEditForm()">Edit</cg-text-btn>
    </div>
  `,
})
export class AdminPersonalInfoComponent {
  public readonly userProfile = input.required<AdminUserProfile>();

  public readonly edit = output();

  public onEditForm(): void {
    this.edit.emit();
  }
}
