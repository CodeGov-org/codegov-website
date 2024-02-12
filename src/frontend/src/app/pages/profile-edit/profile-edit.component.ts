import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { InfoIconComponent } from '~core/icons';
import { ProfileService, UserRole } from '~core/state';
import { FormFieldComponent, InputDirective } from '~core/ui';
import { AdminProfileComponent } from './admin-profile';
import { AnonymousProfileComponent } from './anonymous-profile';
import { ReviewerProfileComponent } from './reviewer-profile';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    InfoIconComponent,
    FormFieldComponent,
    InputDirective,
    AnonymousProfileComponent,
    ReviewerProfileComponent,
    AdminProfileComponent,
  ],
  template: `
    <div class="mx-auto lg:w-3/4 xl:w-2/3">
      <h1 class="mb-4 mt-4">Edit profile</h1>

      @if (userProfile$ | async; as userProfile) {
        @switch (userProfile.role) {
          @case (UserRole.Anonymous) {
            <app-anonymous-profile [userProfile]="userProfile" />
          }
          @case (UserRole.Reviewer) {
            <app-reviewer-profile [userProfile]="userProfile" />
          }
          @case (UserRole.Admin) {
            <app-admin-profile [userProfile]="userProfile" />
          }
        }
      }
    </div>
  `,
})
export class ProfileEditComponent implements OnInit {
  public readonly userProfile$ = this.profileService.userProfile$;
  public readonly UserRole = UserRole;

  public readonly nonEditableInfo: string =
    'To change this property, contact a CodeGov admin.';
  public readonly adminInfo: string =
    'Use DFX command to change this property.';

  constructor(private readonly profileService: ProfileService) {}

  public ngOnInit(): void {
    this.profileService.loadProfile();
  }
}
