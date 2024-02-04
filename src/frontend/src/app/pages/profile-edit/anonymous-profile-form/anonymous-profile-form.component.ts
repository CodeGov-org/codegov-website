import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  Validators,
  FormGroup,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';

import {
  AnonymousProfile,
  AnonymousProfileUpdate,
  ProfileService,
  UserRole,
} from '~core/state';
import {
  FormFieldComponent,
  InputDirective,
  InputErrorComponent,
  LabelComponent,
} from '~core/ui';

export interface AnonymousProfileForm {
  username: FormControl<string>;
}

@Component({
  selector: 'app-anonymous-profile-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    LabelComponent,
    CommonModule,
    InputDirective,
    InputErrorComponent,
  ],
  template: `
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

      <div class="flex items-center">
        <a title="Cancel your edits" routerLink="/" class="ml-auto mr-4">
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
export class AnonymousProfileFormComponent {
  @Input({ required: true })
  public set userProfile(userProfile: AnonymousProfile) {
    this.profileForm.patchValue({
      username: userProfile.username,
    });
  }
  public readonly profileForm: FormGroup<AnonymousProfileForm>;

  public readonly nonEditableInfo: string =
    'To change this property, contact a CodeGov admin.';

  constructor(private readonly profileService: ProfileService) {
    this.profileForm = new FormGroup<AnonymousProfileForm>({
      username: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
    });
  }

  public onSubmit(): void {
    const formValues = this.profileForm.value;

    const profileUpdate: AnonymousProfileUpdate = {
      role: UserRole.Anonymous,
      username: formValues.username,
    };

    this.profileService.saveProfile(profileUpdate);
  }
}
