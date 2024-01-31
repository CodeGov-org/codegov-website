import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { Profile, ProfileService, UserRole } from '~core/state';
import {
  FormFieldComponent,
  InfoIconComponent,
  InputDirective,
  LabelComponent,
} from '~core/ui';
import { AdminProfileFormComponent } from './admin-profile-form.component';
import { AnonymousProfileFormComponent } from './anonymous-profile-form.component';
import { ReviewerProfileFormComponent } from './reviewer-profile-form.component';

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
    AnonymousProfileFormComponent,
    ReviewerProfileFormComponent,
    AdminProfileFormComponent,
  ],
  template: `
    <div
      class="rounded-md bg-slate-200 px-8 py-8 shadow-md dark:bg-slate-700 dark:text-slate-200"
    >
      <h1 class="mb-16 mt-4 text-center">Edit Profile</h1>
      <div class="mx-auto md:w-2/3">
        @if (userProfile$ | async; as userProfile) {
          <div>
            <div class="mb-4 flex flex-row items-center">
              <span class="w-1/3 font-bold">Id</span>
              <span>{{ userProfile.id }}</span>
            </div>
            <div class="mb-4 flex flex-row items-center">
              <span class="w-1/3 font-bold">Role</span>
              <span>{{ userProfile.role }}</span>
              @if (userProfile.role !== UserRole.Admin) {
                <app-info-icon [infoText]="nonEditableInfo"></app-info-icon>
              }
            </div>

            @if (userProfile.role === UserRole.Reviewer) {
              <div class="mb-4 flex flex-row items-center">
                <span class="w-1/3 font-bold">Proposal Types</span>
                <span>{{ userProfile.proposalTypes.join(', ') }}</span>
                <app-info-icon [infoText]="nonEditableInfo"></app-info-icon>
              </div>

              <div class="mb-4 flex flex-row items-center">
                <span class="h-6 w-1/3 font-bold">Neuron ID</span>
                <span>{{ userProfile.neuronId }}</span>
                <app-info-icon [infoText]="nonEditableInfo"></app-info-icon>
              </div>
            }
          </div>

          @switch (userProfile.role) {
            @case (UserRole.Anonymous) {
              <app-anonymous-profile-form [userProfile]="userProfile" />
            }
            @case (UserRole.Reviewer) {
              <app-reviewer-profile-form [userProfile]="userProfile" />
            }
            @case (UserRole.Admin) {
              <app-admin-profile-form [userProfile]="userProfile" />
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

  constructor(private readonly profileService: ProfileService) {
    this.userProfile$ = profileService.userProfile$;
  }

  public ngOnInit(): void {
    this.profileService.loadProfile();
  }
}
