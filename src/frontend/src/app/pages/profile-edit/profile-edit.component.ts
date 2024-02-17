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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        display: block;
        margin-left: auto;
        margin-right: auto;

        @include lg {
          width: 75%;
        }

        @include xl {
          width: 66.66667%;
        }
      }

      .profile-edit__title {
        @include py(4);
      }
    `,
  ],
  template: `
    <h1 class="profile-edit__title">Edit profile</h1>

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
