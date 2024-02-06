import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
} from '@angular/core';
import {
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { InfoIconComponent } from '~core/icons';
import {
  AdminProfile,
  AdminProfileUpdate,
  ProfileService,
  UserRole,
} from '~core/state';
import {
  FormFieldComponent,
  InputDirective,
  InputErrorComponent,
  LabelComponent,
} from '~core/ui';
import { ComponentChanges } from '~core/utils';

export interface AdminProfileForm {
  username: FormControl<string>;
  bio: FormControl<string>;
}

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    LabelComponent,
    CommonModule,
    InputDirective,
    InputErrorComponent,
    InfoIconComponent,
    RouterModule,
  ],
  template: `
    <div class="mb-4 flex flex-row items-center">
      <span class="w-1/3 font-bold">ID</span>
      <span>{{ userProfile.id }}</span>
    </div>

    <div class="mb-4 flex flex-row items-center">
      <span class="w-1/3 font-bold">Role</span>
      <span>{{ userProfile.role }}</span>
      <app-info-icon [infoText]="adminInfo"></app-info-icon>
    </div>

    <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
      <app-form-field>
        <app-label>Username</app-label>

        <input appInput id="username" type="text" formControlName="username" />

        <app-input-error key="required">
          Username cannot be empty
        </app-input-error>
        <app-input-error key="minlength">
          Username must have at least 3 characters
        </app-input-error>
      </app-form-field>

      <app-form-field>
        <app-label>Bio</app-label>

        <textarea
          appInput
          id="bio"
          type="text"
          formControlName="bio"
        ></textarea>

        <app-input-error key="required">Bio cannot be empty</app-input-error>
      </app-form-field>

      <div class="flex items-center">
        <a title="Cancel your edits" [routerLink]="'/'" class="ml-auto mr-4">
          Cancel
        </a>
        <button
          type="submit"
          [title]="
            profileForm.invalid ? 'Fix the validation errors' : undefined
          "
          [disabled]="profileForm.invalid"
          class="rounded bg-blue-500 px-4 py-1 text-lg text-white enabled:hover:bg-blue-600 disabled:bg-blue-300"
        >
          Save
        </button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfileComponent implements OnChanges {
  @Input({ required: true })
  public userProfile!: AdminProfile;

  public readonly adminInfo: string =
    'Use DFX command to change this property.';

  public readonly profileForm: FormGroup<AdminProfileForm>;

  constructor(private readonly profileService: ProfileService) {
    this.profileForm = new FormGroup<AdminProfileForm>({
      username: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
      bio: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  public ngOnChanges(changes: ComponentChanges<AdminProfileComponent>): void {
    if (changes.userProfile) {
      this.profileForm.patchValue({
        username: this.userProfile.username,
        bio: this.userProfile.bio,
      });
    }
  }

  public onSubmit(): void {
    const formValues = this.profileForm.value;

    const profileUpdate: AdminProfileUpdate = {
      role: UserRole.Admin,
      username: formValues.username,
      bio: formValues.bio,
    };

    this.profileService.saveProfile(profileUpdate);
  }
}
