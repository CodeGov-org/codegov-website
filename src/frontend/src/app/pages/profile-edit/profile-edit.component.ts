import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, filter, take } from 'rxjs';

import {
  Profile,
  ProfileService,
  SocialLink,
  UpdatableProfile,
} from '~core/state';
import {
  FormFieldComponent,
  InfoIconComponent,
  InputDirective,
  LabelComponent,
} from '~core/ui';
import { keysOf } from '~core/utils';
import { SOCIAL_MEDIA_INPUTS, SocialMediaInputs } from './profile.model';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    InfoIconComponent,
    FormFieldComponent,
    LabelComponent,
    InputDirective,
  ],
  template: `
    <div
      class="container mx-auto my-8 rounded-md bg-slate-200 px-8 py-8 shadow-md dark:bg-slate-700 dark:text-slate-200"
    >
      <h1 class="mb-16 mt-4 text-center text-2xl font-medium sm:text-3xl">
        Edit Profile
      </h1>
      <div class="mx-auto md:w-2/3">
        <div>
          @if (userProfile$ | async; as userProfile) {
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
          }
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
          <app-form-field>
            <app-label>Username</app-label>
            <input
              appInput
              id="username"
              type="text"
              formControlName="username"
              [ngClass]="{
                'border-red-700': isControlInvalid('username')
              }"
            />

            <div class="mb-1 ml-1 h-4 text-xs text-red-700 dark:text-red-400">
              @if (isControlInvalid('username')) {
                {{ getErrorMessage('username') }}
              }
            </div>
          </app-form-field>

          <app-form-field>
            <app-label>Bio</app-label>
            <textarea
              appInput
              id="bio"
              type="text"
              formControlName="bio"
              [ngClass]="{
                'border-red-700 ': isControlInvalid('bio')
              }"
            ></textarea>
            <div class="mb-1 ml-1 h-4 text-xs text-red-700 dark:text-red-400">
              @if (isControlInvalid('bio')) {
                {{ getErrorMessage('bio') }}
              }
            </div>
          </app-form-field>

          <app-form-field>
            <app-label>Wallet Address</app-label>
            <input
              appInput
              id="walletAddress"
              type="text"
              formControlName="walletAddress"
              [ngClass]="{
                'border-red-700': isControlInvalid('walletAddress')
              }"
            />
            <div class="mb-1 ml-1 h-4 text-xs text-red-700 dark:text-red-400">
              @if (isControlInvalid('walletAddress')) {
                {{ getErrorMessage('walletAddress') }}
              }
            </div>
          </app-form-field>

          <div class="py-6">
            <h2 class="mb-4 text-left text-lg font-normal sm:text-xl">
              Social Media
            </h2>
            <div formGroupName="socialMedia">
              @for (key of socialMediaKeys; track key) {
                <app-form-field>
                  <app-label>{{ socialMediaInputs[key].label }}</app-label>

                  <input
                    appInput
                    [id]="key"
                    type="text"
                    [formControlName]="key"
                  />
                  <div class="mb-1 ml-3 h-4 text-xs">
                    @if (controlHasValue('socialMedia.' + key)) {
                      <a
                        href="{{ getSocialMediaUrl(key) }}"
                        class=" text-blue-900 underline dark:text-blue-400"
                        target="_blank"
                        rel="nofollow noreferrer"
                        >{{ getSocialMediaUrl(key) }}</a
                      >
                    }
                  </div>
                </app-form-field>
              }
            </div>
          </div>

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
      </div>
    </div>
  `,
})
export class ProfileEditComponent implements OnInit {
  public readonly userProfile$: Observable<Profile | null>;
  public readonly profileForm: FormGroup;

  public readonly nonEditableInfo: string =
    'To change this property, contact a CodeGov admin.';

  public readonly socialMediaKeys = keysOf(SOCIAL_MEDIA_INPUTS);
  public readonly socialMediaInputs = SOCIAL_MEDIA_INPUTS;

  private validationMessages: Record<string, Record<string, string>> = {
    username: {
      required: 'Username cannot be empty',
      minlength: 'Username must have at least 3 characters',
    },
    bio: {
      required: 'Bio cannot be empty',
    },
    walletAddress: {
      required: 'Wallet address cannot be empty',
    },
  };

  constructor(
    formBuilder: FormBuilder,
    private readonly profileService: ProfileService,
  ) {
    this.profileForm = formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      bio: ['', Validators.required],
      walletAddress: ['', Validators.required],
      socialMedia: formBuilder.group(this.generateSocialMedia()),
    });

    this.userProfile$ = profileService.userProfile$;

    profileService.userProfile$
      .pipe(
        filter((userProfile): userProfile is Profile => userProfile !== null),
        take(1),
      )
      .subscribe(userProfile => {
        this.profileForm.patchValue({
          username: userProfile.username,
          bio: userProfile.bio,
          socialMedia: userProfile.socialMedia.reduce(
            (accum, value) => ({ ...accum, [value.type]: value.link }),
            {},
          ),
        });
      });
  }

  public ngOnInit(): void {
    this.profileService.loadProfile();
  }

  public onSubmit(): void {
    const formValues = this.profileForm.value;

    const updatedProfile: UpdatableProfile = {
      username: formValues.username.value,
      bio: formValues.bio.value,
      socialMedia: Object.entries(formValues.socialMedia).map(
        ([key, value]) =>
          ({
            type: key,
            link: value,
          }) as SocialLink,
      ),
    };

    this.profileService.saveProfile(updatedProfile);
  }

  public isControlInvalid(controlName: string): boolean {
    const control = this.profileForm.get(controlName);
    if (control === null) {
      throw new Error(`Control "${controlName} not found."`);
    }

    return control.invalid;
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

  public getErrorMessage(controlName: string): string {
    const control = this.getControl(controlName);

    if (control.errors) {
      for (const err in control.errors) {
        if (this.validationMessages[controlName][err]) {
          return this.validationMessages[controlName][err];
        }
      }
    }

    return 'This field is invalid';
  }

  private getControl(controlName: string): AbstractControl {
    const control = this.profileForm.get(controlName);
    if (control === null) {
      throw new Error(`Control "${controlName} not found."`);
    }
    return control;
  }

  private generateSocialMedia(): Record<string, string[]> {
    return this.socialMediaKeys.reduce(
      (accum, value) => ({
        ...accum,
        [value]: [''],
      }),
      {},
    );
  }
}
