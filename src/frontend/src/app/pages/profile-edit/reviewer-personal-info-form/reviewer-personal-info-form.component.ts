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
import { RouterModule } from '@angular/router';

import { LoadingIconComponent } from '~core/icons';
import {
  ProfileService,
  ReviewerProfile,
  ReviewerProfileUpdate,
  UserRole,
} from '~core/state';
import {
  FormFieldComponent,
  InputDirective,
  InputErrorComponent,
  KeyColComponent,
  KeyValueGridComponent,
  TooltipDirective,
  ValueColComponent,
} from '~core/ui';
import { ComponentChanges } from '~core/utils';

export interface ReviewerProfileForm {
  username: FormControl<string>;
  bio: FormControl<string>;
  walletAddress: FormControl<string>;
}

@Component({
  selector: 'app-reviewer-personal-info-form',
  standalone: true,
  imports: [
    FormFieldComponent,
    InputErrorComponent,
    InputDirective,
    ReactiveFormsModule,
    RouterModule,
    TooltipDirective,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    CommonModule,
    LoadingIconComponent,
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

        <app-key-col>
          <label appLabel for="walletAddress">Wallet address</label>
        </app-key-col>
        <app-value-col>
          <app-form-field>
            <input
              appInput
              id="walletAddress"
              type="text"
              formControlName="walletAddress"
            />

            <app-input-error key="required">
              Wallet address cannot be empty
            </app-input-error>
          </app-form-field>
        </app-value-col>
      </app-key-value-grid>

      <div class="flex items-center justify-end">
        @if (profileForm.invalid) {
          <div class="text-error pr-5 text-sm md:pr-10">
            Fix the validation errors
          </div>
        }
        <button class="btn btn-outline mr-4" (click)="cancelEdits()">
          Cancel
        </button>

        <button
          type="submit"
          [attr.aria-label]="isSaving ? 'Saving' : 'Save'"
          [disabled]="profileForm.invalid || isSaving"
          class="btn relative"
          [ngClass]="isSaving ? 'text-transparent' : ''"
        >
          @if (isSaving) {
            <app-loading-icon
              class="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2"
            />
          }
          Save
        </button>
      </div>
    </form>
  `,
})
export class ReviewerPersonalInfoFormComponent implements OnChanges {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  @Output()
  public formClose = new EventEmitter<void>();

  @Output()
  public formSaving = new EventEmitter<void>();

  public readonly profileForm: FormGroup<ReviewerProfileForm>;
  public isSaving = false;

  constructor(private readonly profileService: ProfileService) {
    this.profileForm = new FormGroup<ReviewerProfileForm>({
      username: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)],
      }),
      bio: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      walletAddress: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  public ngOnChanges(
    changes: ComponentChanges<ReviewerPersonalInfoFormComponent>,
  ): void {
    if (changes.userProfile) {
      this.profileForm.patchValue({
        username: this.userProfile.username,
        bio: this.userProfile.bio,
        walletAddress: this.userProfile.walletAddress,
      });
    }
  }

  public async onSubmit(): Promise<void> {
    this.profileForm.disable();
    this.isSaving = true;

    const profileFormValues = this.profileForm.value;

    const profileUpdate: ReviewerProfileUpdate = {
      role: UserRole.Reviewer,
      username: profileFormValues.username,
      bio: profileFormValues.bio,
      walletAddress: profileFormValues.walletAddress,
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
