import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

import { AdminPersonalInfoComponent } from '../admin-personal-info';
import { AdminPersonalInfoFormComponent } from '../admin-personal-info-form';
import { CardComponent } from '@cg/angular-ui';
import { AdminGetMyUserProfileResponse } from '~core/api';
import { InfoIconComponent } from '~core/icons';
import {
  KeyColComponent,
  KeyValueGridComponent,
  TooltipDirective,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-admin-profile',
  imports: [
    CommonModule,
    InfoIconComponent,
    TooltipDirective,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    AdminPersonalInfoFormComponent,
    AdminPersonalInfoComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      .admin-profile-card {
        margin-bottom: common.size(3);

        @include common.sm {
          margin-bottom: common.size(4);
        }
      }
    `,
  ],
  template: `
    <cg-card class="admin-profile-card">
      <h2 class="h3" slot="cardTitle">Profile</h2>

      <app-key-value-grid slot="cardContent">
        <app-key-col id="admin-id">ID</app-key-col>
        <app-value-col aria-labelledby="admin-id">
          {{ userProfile().id }}
        </app-value-col>

        <app-key-col id="admin-role">Role</app-key-col>
        <app-value-col
          aria-labelledby="admin-role"
          aria-describedby="admin-role-description"
        >
          {{ userProfile().role }}

          <app-info-icon
            aria-hidden="true"
            [appTooltip]="adminInfo()"
          ></app-info-icon>
        </app-value-col>
        <div class="admin-role-description sr-only" role="tooltip">
          {{ adminInfo() }}
        </div>
      </app-key-value-grid>
    </cg-card>

    <cg-card>
      <h2 class="h3" slot="cardTitle">Personal Info</h2>

      <div slot="cardContent">
        @if (isFormEditable()) {
          <app-admin-personal-info-form
            [userProfile]="userProfile()"
            (formClose)="onHideForm()"
          />
        } @else {
          <app-admin-personal-info
            [userProfile]="userProfile()"
            (edit)="onShowForm()"
          />
        }
      </div>
    </cg-card>
  `,
})
export class AdminProfileComponent {
  public readonly userProfile = input.required<AdminGetMyUserProfileResponse>();

  public readonly adminInfo = signal(
    'Use DFX command to change this property.',
  );

  public isFormEditable = signal(false);

  public onShowForm(): void {
    this.isFormEditable.set(true);
  }

  public onHideForm(): void {
    this.isFormEditable.set(false);
  }
}
