import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { InfoIconComponent } from '~core/icons';
import { Profile, ProfileService, UserRole } from '~core/state';
import { FormFieldComponent, InputDirective, LabelComponent } from '~core/ui';
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
    LabelComponent,
    InputDirective,
    AnonymousProfileComponent,
    ReviewerProfileComponent,
    AdminProfileComponent,
  ],
  template: `
    <div
      class="rounded-md bg-slate-200 px-8 py-8 shadow-md dark:bg-slate-700 dark:text-slate-200"
    >
      <h1 class="mb-16 mt-4 text-center">Edit Profile</h1>
      <div class="mx-auto md:w-2/3">
        @if (userProfile$ | async; as userProfile) {
          @switch (userProfile.role) {
            @case (UserRole.Anonymous) {
              <app-anonymous-profile [userProfile]="userProfile" />
            }
            @case (UserRole.Reviewer) {
              <div class="mx-auto md:w-2/3">
                <app-reviewer-profile [userProfile]="userProfile" />
              </div>
            }
            @case (UserRole.Admin) {
              <div class="mx-auto md:w-2/3">
                <app-admin-profile [userProfile]="userProfile" />
              </div>
            }
          }
        }
      </div>
    </div>
  `,
})
export class ProfileEditComponent implements OnInit {
  public readonly userProfile$: Observable<Profile | null>;
  public readonly UserRole = UserRole;

  public readonly nonEditableInfo: string =
    'To change this property, contact a CodeGov admin.';
  public readonly adminInfo: string =
    'Use DFX command to change this property.';

  constructor(private readonly profileService: ProfileService) {
    this.userProfile$ = profileService.userProfile$;
  }

  public ngOnInit(): void {
    this.profileService.loadProfile();
  }
}
