import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { LoadingBtnComponent, TextBtnComponent } from '@cg/angular-ui';
import {
  ReviewerUserProfile,
  UpdateMyUserProfileRequest,
  UserRole,
} from '~core/api';
import { ProfileService } from '~core/state';
import {
  FormFieldComponent,
  FormValidationInfoComponent,
  InputDirective,
  InputErrorComponent,
  InputHintComponent,
  KeyColComponent,
  KeyValueGridComponent,
  LabelDirective,
  ValueColComponent,
} from '~core/ui';

export interface ReviewerProfileForm {
  username: FormControl<string>;
  bio: FormControl<string>;
  walletAddress: FormControl<string>;
}

@Component({
  selector: 'app-reviewer-personal-info-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    FormValidationInfoComponent,
    InputDirective,
    LabelDirective,
    InputHintComponent,
    InputErrorComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    LoadingBtnComponent,
    TextBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="profileForm()" (ngSubmit)="onSubmit()">
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
          <label appLabel for="wallet-address">Wallet address</label>
        </app-key-col>
        <app-value-col>
          <app-form-field>
            <input
              appInput
              id="wallet-address"
              type="text"
              formControlName="walletAddress"
            />

            <app-input-hint>
              @if (hasWalletAddress()) {
                <a
                  class="truncate"
                  [href]="walletAddressLink()"
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  {{ walletAddressLink() }}
                </a>
              }
            </app-input-hint>

            <app-input-error key="required">
              Wallet address cannot be empty
            </app-input-error>
          </app-form-field>
        </app-value-col>
      </app-key-value-grid>

      <app-form-validation-info />

      <div class="btn-group">
        <cg-text-btn (click)="onCancelEdits()" [disabled]="isSaving()">
          Cancel
        </cg-text-btn>

        <cg-loading-btn
          type="submit"
          [disabled]="profileForm().invalid"
          [isLoading]="isSaving()"
        >
          Save
        </cg-loading-btn>
      </div>
    </form>
  `,
})
export class ReviewerPersonalInfoFormComponent {
  public readonly userProfile = input.required<ReviewerUserProfile>();

  public readonly formClose = output();

  public readonly formSaving = output();

  public readonly profileForm = signal(
    new FormGroup<ReviewerProfileForm>({
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
    }),
  );
  public walletAddressControl = computed(() =>
    this.profileForm().get('walletAddress'),
  );
  public walletAddress = computed(() => this.walletAddressControl()?.value);
  public hasWalletAddress = computed(() => Boolean(this.walletAddress()));
  public walletAddressLink = computed(
    () =>
      `https://dashboard.internetcomputer.org/account/${this.walletAddress()}`,
  );

  public readonly isSaving = signal(false);

  constructor(private readonly profileService: ProfileService) {
    effect(() => {
      this.profileForm().patchValue({
        username: this.userProfile().username,
        bio: this.userProfile().bio,
        walletAddress: this.userProfile().walletAddress,
      });
    });
  }

  public async onSubmit(): Promise<void> {
    this.profileForm().disable();
    this.isSaving.set(true);

    const profileFormValues = this.profileForm().value;

    const profileUpdate: UpdateMyUserProfileRequest = {
      role: UserRole.Reviewer,
      username: profileFormValues.username,
      bio: profileFormValues.bio,
      walletAddress: profileFormValues.walletAddress,
      socialMedia: this.userProfile().socialMedia,
    };

    try {
      await this.profileService.updateCurrentUserProfile(profileUpdate);
    } finally {
      this.isSaving.set(false);
      this.formClose.emit();
    }
  }

  public onCancelEdits(): void {
    this.formClose.emit();
  }
}
