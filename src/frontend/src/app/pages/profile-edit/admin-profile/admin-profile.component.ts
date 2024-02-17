import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { AdminPersonalInfoComponent } from '../admin-personal-info';
import { AdminPersonalInfoFormComponent } from '../admin-personal-info-form';
import { InfoIconComponent } from '~core/icons';
import { AdminProfile } from '~core/state';
import {
  CardComponent,
  KeyColComponent,
  KeyValueGridComponent,
  TooltipDirective,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
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
      @import '@cg/styles/common';

      .admin-profile-card {
        margin-bottom: size(6);
      }
    `,
  ],
  template: `
    <app-card class="admin-profile-card">
      <h2 class="h4" cardTitle>Profile</h2>

      <app-key-value-grid>
        <app-key-col>ID</app-key-col>
        <app-value-col>{{ userProfile.id }}</app-value-col>

        <app-key-col>Role</app-key-col>
        <app-value-col>
          {{ userProfile.role }}

          <app-info-icon [appTooltip]="adminInfo"></app-info-icon>
        </app-value-col>
      </app-key-value-grid>
    </app-card>

    <app-card>
      <h2 class="h4" cardTitle>Personal Info</h2>

      @if (isFormEditable) {
        <app-admin-personal-info-form
          [userProfile]="userProfile"
          (formClose)="hideForm()"
        />
      } @else {
        <app-admin-personal-info
          [userProfile]="userProfile"
          (edit)="showForm()"
        />
      }
    </app-card>
  `,
})
export class AdminProfileComponent {
  @Input({ required: true })
  public userProfile!: AdminProfile;

  public readonly adminInfo: string =
    'Use DFX command to change this property.';

  public isFormEditable = false;

  public showForm(): void {
    this.isFormEditable = true;
  }

  public hideForm(): void {
    this.isFormEditable = false;
  }
}
