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
  AbstractControl,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SOCIAL_MEDIA_INPUTS, SocialMediaInputs } from '../profile.model';
import { InfoIconComponent } from '~core/icons';
import {
  ProfileService,
  ReviewerProfile,
  ReviewerProfileUpdate,
  SocialLink,
  SocialMediaType,
  UserRole,
} from '~core/state';
import {
  FormFieldComponent,
  LabelComponent,
  InputDirective,
  InputErrorComponent,
  InputHintComponent,
} from '~core/ui';
import { ComponentChanges, keysOf } from '~core/utils';

export interface ReviewerProfileForm {
  username: FormControl<string>;
  bio: FormControl<string>;
  walletAddress: FormControl<string>;
  socialMedia: FormGroup<SocialMediaForm>;
}

export type SocialMediaForm = {
  [K in SocialMediaType]: FormControl<string>;
};

@Component({
  selector: 'app-reviewer-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    LabelComponent,
    CommonModule,
    InputDirective,
    InputErrorComponent,
    InputHintComponent,
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
      <app-info-icon [infoText]="nonEditableInfo"></app-info-icon>
    </div>

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

      <div class="py-6">
        <h2 class="mb-4">Social Media</h2>
        <div formGroupName="socialMedia">
          @for (key of socialMediaKeys; track key) {
            <app-form-field>
              <app-label>{{ socialMediaInputs[key].label }}</app-label>

              <input appInput [id]="key" type="text" [formControlName]="key" />

              <app-input-hint>
                @if (controlHasValue('socialMedia.' + key)) {
                  <a
                    href="{{ getSocialMediaUrl(key) }}"
                    class=" text-blue-900 underline dark:text-blue-400"
                    target="_blank"
                    rel="nofollow noreferrer"
                    >{{ getSocialMediaUrl(key) }}</a
                  >
                }
              </app-input-hint>
            </app-form-field>
          }
        </div>
      </div>

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
export class ReviewerProfileComponent implements OnChanges {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  public readonly profileForm: FormGroup<ReviewerProfileForm>;

  public readonly nonEditableInfo: string =
    'To change this property, contact a CodeGov admin.';

  public readonly socialMediaKeys = keysOf(SOCIAL_MEDIA_INPUTS);
  public readonly socialMediaInputs = SOCIAL_MEDIA_INPUTS;

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
      socialMedia: new FormGroup<SocialMediaForm>(this.generateSocialMedia()),
    });
  }

  public ngOnChanges(
    changes: ComponentChanges<ReviewerProfileComponent>,
  ): void {
    if (changes.userProfile) {
      this.profileForm.patchValue({
        username: this.userProfile.username,
        bio: this.userProfile.bio,
        walletAddress: this.userProfile.walletAddress,
        socialMedia: this.userProfile.socialMedia.reduce(
          (accum, value) => ({ ...accum, [value.type]: value.link }),
          {},
        ),
      });
    }
  }

  public onSubmit(): void {
    const formValues = this.profileForm.value;

    const socialMediaFormValues = Object.entries(
      formValues.socialMedia ?? {},
    ).map<SocialLink>(([key, value]) => ({
      type: key as SocialMediaType,
      link: value,
    }));

    const profileUpdate: ReviewerProfileUpdate = {
      role: UserRole.Reviewer,
      username: formValues.username,
      bio: formValues.bio,
      walletAddress: formValues.walletAddress,
      socialMedia: socialMediaFormValues,
    };

    this.profileService.saveProfile(profileUpdate);
  }

  public controlHasValue(controlName: string): boolean {
    const control = this.getControl(controlName);

    return control.value;
  }

  public getSocialMediaUrl(controlName: keyof SocialMediaInputs): string {
    const control = this.getControl('socialMedia.' + controlName);

    const baseUrl = this.socialMediaInputs[controlName].baseUrl;

    return baseUrl + control.value;
  }

  private getControl(controlName: string): AbstractControl {
    const control = this.profileForm.get(controlName);
    if (control === null) {
      throw new Error(`Control "${controlName} not found."`);
    }
    return control;
  }

  private generateSocialMedia(): SocialMediaForm {
    return this.socialMediaKeys.reduce(
      (accum, value) => ({
        ...accum,
        [value]: new FormControl('', {
          nonNullable: true,
        }),
      }),
      {},
    ) as SocialMediaForm;
  }
}
