import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { AdminPersonalInfoEditComponent } from '../admin-personal-info-edit';
import { AdminPersonalInfoViewComponent } from '../admin-personal-info-view';
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
    AdminPersonalInfoEditComponent,
    AdminPersonalInfoViewComponent,
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

    @if (isEditable) {
      <app-admin-personal-info-edit
        [userProfile]="userProfile"
        (formSave)="stopEditing()"
      />
    } @else {
      <app-admin-personal-info-view
        [userProfile]="userProfile"
        (formEdit)="editForm()"
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

  public isEditable = false;

  public editForm(): void {
    this.isEditable = true;
  }

  public stopEditing(): void {
    this.isEditable = false;
  }
}
