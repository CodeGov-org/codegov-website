import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { AdminPersonalInfoComponent } from '../admin-personal-info';
import { AdminPersonalInfoFormComponent } from '../admin-personal-info-form';
import { InfoIconComponent } from '~core/icons';
import { AdminProfile } from '~core/state';
import { TooltipDirective } from '~core/ui';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    CommonModule,
    InfoIconComponent,
    TooltipDirective,
    AdminPersonalInfoFormComponent,
    AdminPersonalInfoComponent,
  ],
  template: `
    <div class="mb-4 flex flex-row items-center">
      <span class="w-1/3 font-bold">ID</span>
      <span>{{ userProfile.id }}</span>
    </div>

    <div class="mb-4 flex flex-row items-center">
      <span class="w-1/3 font-bold">Role</span>
      <span>{{ userProfile.role }}</span>
      <app-info-icon [appTooltip]="adminInfo"></app-info-icon>
    </div>

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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
