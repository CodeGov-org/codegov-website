import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
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
import { InfoIconComponent } from '~core/ui';
import { keysOf } from '~core/utils';
import { SOCIAL_MEDIA_INPUTS } from './profile.model';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, InfoIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container px-5 py-5 mx-auto bg-gray-200">
      <h1
        class="text-center text-2xl sm:text-3xl font-medium mb-4 text-gray-900"
      >
        Edit Profile
      </h1>
      <div class="md:w-2/3 mx-auto">
        <div>
          @if (userProfile$ | async; as userProfile) {
            <div class="flex flex-row mb-4 items-center">
              <span class="w-1/3 font-bold">Role</span>
              <span>{{ userProfile.role }}</span>
              <app-info-icon [infoText]="nonEditableInfo"></app-info-icon>
            </div>

            <div class="flex flex-row mb-4 items-center">
              <span class="w-1/3 font-bold">Proposal Types</span>
              <span>{{ userProfile.proposalTypes.join(', ') }}</span>
              <app-info-icon [infoText]="nonEditableInfo"></app-info-icon>
            </div>

            <div class="flex flex-row mb-4 items-center">
              <span class="w-1/3 h-6 font-bold">Neuron ID</span>
              <span>{{ userProfile.neuronId }}</span>
              <app-info-icon [infoText]="nonEditableInfo"></app-info-icon>
            </div>
          }
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
          <div class="flex flex-row">
            <label for="username" class="w-1/3 font-bold">Username</label>

            <div class="flex flex-col mb-3 w-2/3">
              <input
                id="username"
                type="text"
                formControlName="username"
                class="mb-1"
                [ngClass]="{
                  'border-red-600 bg-red-100': isControlInvalid('username')
                }"
              />

              <div class="h-4 text-red-600 text-xs">
                @if (isControlInvalid('username')) {
                  {{ getErrorMessage('username') }}
                }
              </div>
            </div>
          </div>

          <div class="flex flex-row mb-4">
            <label for="bio" class="w-1/3 font-bold">Bio</label>
            <textarea
              id="bio"
              type="text"
              formControlName="bio"
              class="w-2/3 h-24 resize-y leading-24"
            ></textarea>
          </div>

          <div class="py-5">
            <h2
              class="text-left text-lg sm:text-xl font-normal mb-4 text-gray-900"
            >
              Social Media
            </h2>
            <div formGroupName="socialMedia">
              @for (key of socialMediaKeys; track key) {
                <div class="flex mb-7 items-center">
                  <label [for]="key" class="w-1/3 font-bold">{{
                    socialMediaInputs[key].label
                  }}</label>
                  <input
                    [id]="key"
                    type="text"
                    [formControlName]="key"
                    class="w-2/3"
                  />
                </div>
              }
            </div>
          </div>

          <div class="flex items-center">
            <a title="Cancel your edits" routerLink="/" class="ml-auto mr-4">
              Cancel
            </a>
            <button
              type="submit"
              [title]="profileForm.valid ? 'Save' : 'Fix the validation errors'"
              [disabled]="!profileForm.valid"
              class="text-white bg-blue-500 py-1 px-4 rounded text-lg enabled:hover:bg-blue-600 disabled:bg-blue-300"
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
  };

  constructor(
    formBuilder: FormBuilder,
    private readonly profileService: ProfileService,
  ) {
    this.profileForm = formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      bio: [''],
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

    return (control.touched || control.dirty) && control.invalid;
  }

  public getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);
    if (control === null) {
      throw new Error(`Control "${controlName} not found."`);
    }

    if (control.errors) {
      for (const err in control.errors) {
        if (this.validationMessages[controlName][err]) {
          return this.validationMessages[controlName][err];
        }
      }
    }

    return 'This field is invalid';
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
