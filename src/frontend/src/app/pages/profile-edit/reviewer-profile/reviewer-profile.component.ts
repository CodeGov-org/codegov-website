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
  TooltipDirective,
} from '~core/ui';
import { ComponentChanges, keysOf } from '~core/utils';

export interface ReviewerProfileForm {
  username: FormControl<string>;
  bio: FormControl<string>;
  walletAddress: FormControl<string>;
}

export type SocialMediaForm = {
  [K in SocialMediaType]: FormControl<string>;
};

@Component({
  selector: 'app-reviewer-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TooltipDirective,
  ],
  template: `
    <div class="mb-4 flex flex-row items-center">
      <span class="w-1/3 font-bold">ID</span>
      <span>{{ userProfile.id }}</span>
    </div>

    <div class="mb-4 flex flex-row items-center">
      <span class="w-1/3 font-bold">Role</span>
      <span>{{ userProfile.role }}</span>
      <app-info-icon [appTooltip]="nonEditableInfo"></app-info-icon>
    </div>

    <div class="mb-4 flex flex-row items-center">
      <span class="w-1/3 font-bold">Proposal Types</span>
      <span>{{ userProfile.proposalTypes.join(', ') }}</span>
      <app-info-icon [appTooltip]="nonEditableInfo"></app-info-icon>
    </div>

    <div class="mb-4 flex flex-row items-center">
      <span class="h-6 w-1/3 font-bold">Neuron ID</span>
      <span>{{ userProfile.neuronId }}</span>
      <app-info-icon [appTooltip]="nonEditableInfo"></app-info-icon>
    </div>

    <form [formGroup]="profileForm" (ngSubmit)="onProfileFormSubmit()">
      @if (isProfileEditable) {
        <app-form-field>
          <app-label>Username</app-label>

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
      } @else {
        <div class="mb-4 flex flex-row items-center">
          <span class="w-1/3 font-bold">Username</span>
          <span>{{ userProfile.username }}</span>
        </div>

        <div class="mb-4 flex flex-row items-center">
          <span class="w-1/3 font-bold">Bio</span>
          <span>{{ userProfile.bio }}</span>
        </div>

        <div class="mb-4 flex flex-row items-center">
          <span class="w-1/3 font-bold">Wallet Address</span>
          <span class="w-2/3 break-all">{{ userProfile.walletAddress }}</span>
        </div>
      }

      <div class="flex items-center">
        @if (isProfileEditable) {
          <a title="Cancel your edits" [routerLink]="'/'" class="ml-auto mr-4">
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
        } @else {
          <button
            type="button"
            class="btn ml-auto "
            (click)="editProfileForm()"
          >
            Edit
          </button>
        }
      </div>
    </form>

    <div class="py-6">
      <h2 class="mb-4">Social Media</h2>
      @if (isSocialMediaEditable) {
        <form
          [formGroup]="socialMediaForm"
          (ngSubmit)="onSocialMediaFormSubmit()"
        >
          @for (key of socialMediaKeys; track key) {
            <app-form-field>
              <app-label>{{ socialMediaInputs[key].label }}</app-label>

              <input appInput [id]="key" type="text" [formControlName]="key" />

              <app-input-hint>
                @if (socialMediaControlHasValue(key)) {
                  <a
                    href="{{ getSocialMediaUrl(key) }}"
                    target="_blank"
                    rel="nofollow noreferrer"
                    >{{ getSocialMediaUrl(key) }}</a
                  >
                }
              </app-input-hint>
            </app-form-field>
          }
          <div class="flex items-center">
            <a
              title="Cancel your edits"
              [routerLink]="'/'"
              class="ml-auto mr-4"
            >
              Cancel
            </a>
            <button type="submit" class="btn">Save</button>
          </div>
        </form>
      } @else {
        @for (key of socialMediaKeys; track key) {
          <div class="mb-4 flex flex-row items-center">
            <span class="w-1/3 font-bold">{{
              socialMediaInputs[key].label
            }}</span>
            <span>{{ getSocialMediaValue(key) }}</span>
          </div>
        }

        <div class="flex items-center">
          <button
            type="button"
            class="btn ml-auto "
            (click)="editSocialMediaForm()"
          >
            Edit
          </button>
        </div>
      }
    </div>
  `,
})
export class ReviewerProfileComponent implements OnChanges {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  public readonly profileForm: FormGroup<ReviewerProfileForm>;
  public readonly socialMediaForm: FormGroup<SocialMediaForm>;
  public isProfileEditable = false;
  public isSocialMediaEditable = false;

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
    });

    this.socialMediaForm = new FormGroup<SocialMediaForm>(
      this.generateSocialMedia(),
    );
  }

  public ngOnChanges(
    changes: ComponentChanges<ReviewerProfileComponent>,
  ): void {
    if (changes.userProfile) {
      this.profileForm.patchValue({
        username: this.userProfile.username,
        bio: this.userProfile.bio,
        walletAddress: this.userProfile.walletAddress,
      });

      this.socialMediaForm.patchValue(
        this.userProfile.socialMedia.reduce(
          (accum, value) => ({ ...accum, [value.type]: value.link }),
          {},
        ),
      );
    }
  }

  public onProfileFormSubmit(): void {
    const profileFormValues = this.profileForm.value;

    const profileUpdate: ReviewerProfileUpdate = {
      role: UserRole.Reviewer,
      username: profileFormValues.username,
      bio: profileFormValues.bio,
      walletAddress: profileFormValues.walletAddress,
    };

    this.profileService.saveProfile(profileUpdate);
    this.isProfileEditable = false;
  }

  public onSocialMediaFormSubmit(): void {
    const socialMediaFormValues = this.socialMediaForm.value;

    const socialMedia = Object.entries(
      socialMediaFormValues ?? {},
    ).map<SocialLink>(([key, value]) => ({
      type: key as SocialMediaType,
      link: value,
    }));

    const profileUpdate: ReviewerProfileUpdate = {
      role: UserRole.Reviewer,
      socialMedia: socialMedia,
    };

    this.profileService.saveProfile(profileUpdate);
    this.isSocialMediaEditable = false;
  }

  public editProfileForm(): void {
    this.isProfileEditable = true;
  }

  public editSocialMediaForm(): void {
    this.isSocialMediaEditable = true;
  }

  public socialMediaControlHasValue(controlName: string): boolean {
    const control = this.getSocialMediaControl(controlName);

    return control.value;
  }

  public getSocialMediaUrl(controlName: keyof SocialMediaInputs): string {
    const control = this.getSocialMediaControl(controlName);

    const baseUrl = this.socialMediaInputs[controlName].baseUrl;

    return baseUrl + control.value;
  }

  public getSocialMediaValue(lookupKey: string): string {
    return (
      this.userProfile.socialMedia.find(element => element.type === lookupKey)
        ?.link ?? ''
    );
  }

  private getSocialMediaControl(controlName: string): AbstractControl {
    const control = this.socialMediaForm.get(controlName);
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
