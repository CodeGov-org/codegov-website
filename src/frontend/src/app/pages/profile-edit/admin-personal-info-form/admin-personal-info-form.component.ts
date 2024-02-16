import { CommonModule } from '@angular/common';
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
import { LoadingIconComponent } from '~core/icons';
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
  KeyColComponent,
  KeyValueGridComponent,
  LabelDirective,
  TooltipDirective,
  ValueColComponent,
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
    InputErrorComponent,
    InputDirective,
    TooltipDirective,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    LabelDirective,
    LoadingIconComponent,
    CommonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
      <app-key-value-grid>
        <app-key-col>
          <label appLabel for="username">Username</label>
        </app-key-col>
        <app-value-col>
          <app-form-field>
            <input
              appInput
              id="username"
              type="text"
              formControlName="username"
            />

            <app-input-error key="required">
              Username cannot be empty
            </app-input-error>
            <app-input-error key="minlength">
              Username must have at least 3 characters
            </app-input-error>
          </app-form-field>
        </app-value-col>

        <app-key-col>
          <label appLabel for="bio">Bio</label>
        </app-key-col>
        <app-value-col>
          <app-form-field>
            <textarea
              appInput
              id="bio"
              type="text"
              formControlName="bio"
            ></textarea>

            <app-input-error key="required">
              Bio cannot be empty
            </app-input-error>
          </app-form-field>
        </app-value-col>
      </app-key-value-grid>

      <div class="flex items-center justify-end">
        @if (profileForm.invalid) {
          <div class="text-error pr-5 text-sm md:pr-10">
            Uh-oh! There are some errors in your form. Please fix them and try
            again.
          </div>
        }
        <button class="btn btn-outline mr-4" (click)="cancelEdits()">
          Cancel
        </button>

        <button
          type="submit"
          [disabled]="profileForm.invalid || isSaving"
          class="btn relative"
        >
          @if (isSaving) {
            <app-loading-icon
              class="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2"
              aria-label="Saving"
            />
          }
          <div [ngClass]="isSaving ? 'aria-hidden text-transparent' : ''">
            Save
          </div>
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

  @Output()
  public formSaving = new EventEmitter<void>();

  public readonly profileForm: FormGroup<AdminProfileForm>;
  public isSaving = false;

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

  public async onSubmit(): Promise<void> {
    this.profileForm.disable();
    this.isSaving = true;

    const formValues = this.profileForm.value;

    const profileUpdate: AdminProfileUpdate = {
      role: UserRole.Admin,
      username: formValues.username,
      bio: formValues.bio,
    };

    try {
      await this.profileService.saveProfile(profileUpdate);
    } finally {
      this.isSaving = false;
      this.formClose.emit();
    }
  }

  public cancelEdits(): void {
    this.formClose.emit();
  }
}
