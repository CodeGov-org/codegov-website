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
  LabelComponent,
  TooltipDirective,
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
    LabelComponent,
    InputErrorComponent,
    InputDirective,
    ReactiveFormsModule,
    RouterModule,
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

      <app-form-field>
        <app-label>Wallet Address</app-label>

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

      <div class="flex items-center">
        <a
          title="Cancel your edits"
          (click)="cancelEdits()"
          class="ml-auto mr-4"
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
