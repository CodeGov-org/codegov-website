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
          <label appLabel for="username">Bio</label>
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
        <button class="btn btn-outline mr-4" (click)="cancelEdits()">
          Cancel
        </button>

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
export class ReviewerPersonalInfoFormComponent implements OnChanges {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  @Output()
  public formClose = new EventEmitter<void>();

  public readonly profileForm: FormGroup<ReviewerProfileForm>;
  public isEditable = false;

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

  public onSubmit(): void {
    const profileFormValues = this.profileForm.value;

    const profileUpdate: ReviewerProfileUpdate = {
      role: UserRole.Reviewer,
      username: profileFormValues.username,
      bio: profileFormValues.bio,
      walletAddress: profileFormValues.walletAddress,
    };

    this.profileService.saveProfile(profileUpdate);
    this.formClose.emit();
  }

  public cancelEdits(): void {
    this.formClose.emit();
  }
}
