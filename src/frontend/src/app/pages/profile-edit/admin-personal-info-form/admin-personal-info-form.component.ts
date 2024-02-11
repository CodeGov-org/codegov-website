import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AdminProfileComponent } from '../admin-profile';
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
  TooltipDirective,
} from '~core/ui';
import { ComponentChanges } from '~core/utils';

export interface AdminProfileForm {
  username: FormControl<string>;
  bio: FormControl<string>;
}

@Component({
  selector: 'app-admin-personal-info-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    LabelComponent,
    InputErrorComponent,
    InputDirective,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        <a
          title="Cancel your edits"
          class="ml-auto mr-4"
          (click)="cancelEdits()"
        >
          Cancel
        </a>
        <button
          type="submit"
          [appTooltip]="
            profileForm.invalid ? 'Fix the validation errors' : null
          "
          [disabled]="profileForm.invalid"
          class="btn"
        >
          Save
        </button>
      </div>
    </form>
  `,
})
export class AdminPersonalInfoFormComponent implements OnChanges {
  @Input({ required: true })
  public userProfile!: AdminProfile;

  @Output()
  public formClose = new EventEmitter<void>();

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
    this.formClose.emit();
  }

  public cancelEdits(): void {
    this.formClose.emit();
  }
}
