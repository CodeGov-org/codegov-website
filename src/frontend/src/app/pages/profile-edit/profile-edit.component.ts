import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { UserRole } from '~core/api';
import { ProfileService } from '~core/state';
import { AdminProfileComponent } from './admin-profile';
import { AnonymousProfileComponent } from './anonymous-profile';
import { ReviewerProfileComponent } from './reviewer-profile';

@Component({
  selector: 'app-profile-edit',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    AnonymousProfileComponent,
    ReviewerProfileComponent,
    AdminProfileComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      :host {
        @include common.page-content;
      }

      .profile-edit__title {
        @include common.py(2);
      }
    `,
  ],
  template: `
    <h1 class="profile-edit__title">Edit profile</h1>

    @if (userProfile(); as userProfile) {
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
  public readonly userProfile = toSignal(this.profileService.userProfile$);
  public readonly UserRole = UserRole;

  constructor(private readonly profileService: ProfileService) {}

  public ngOnInit(): void {
    this.profileService.loadProfile();
  }
}
