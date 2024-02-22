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

import {
  ProfileService,
  ReviewerProfile,
  ReviewerProfileUpdate,
  UserRole,
} from '~core/state';
import {
  FormFieldComponent,
  FormValidationInfoComponent,
  InputDirective,
  InputErrorComponent,
  InputHintComponent,
  KeyColComponent,
  KeyValueGridComponent,
  LabelDirective,
  LoadingButtonComponent,
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
    LoadingButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .wallet-address-link {
        display: block;
        overflow-x: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-right: size(4);
      }
    `,
  ],
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
              @if (walletAddressControlHasValue()) {
                <a
                  class="wallet-address-link"
                  [href]="getWalletAddressLink()"
                  target="_blank"
                  rel="nofollow noreferrer"
                >
                  {{ getWalletAddressLink() }}
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
        <button
          class="btn btn--outline"
          (click)="cancelEdits()"
          [disabled]="isSaving"
        >
          Cancel
        </button>

        <app-loading-button
          btnClass="btn"
          type="submit"
          [disabled]="profileForm.invalid || isSaving"
          [isSaving]="isSaving"
        >
          Save
        </app-loading-button>
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

  public walletAddressControlHasValue(): boolean {
    const control = this.profileForm.get('walletAddress');

    return Boolean(control?.value);
  }

  public getWalletAddressLink(): string {
    const walletAddress = this.profileForm.get('walletAddress')?.value;

    return `https://dashboard.internetcomputer.org/account/${walletAddress}`;
  }
}
