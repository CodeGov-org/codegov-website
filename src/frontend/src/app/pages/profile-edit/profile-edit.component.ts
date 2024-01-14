import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Observable, filter, take } from 'rxjs';

import {
  Profile,
  ProfileService,
  SocialLink,
  UpdatableProfile,
} from '~core/state';
import { keysOf } from '~core/utils';
import { SOCIAL_MEDIA_INPUTS } from './profile.model';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (userProfile$ | async; as userProfile) {
      <div>
        <span>Role</span>
        <span>{{ userProfile.role }}</span>
      </div>
      <div>
        <span>Proposal Types</span>
        <span>{{ userProfile.proposalTypes.join(', ') }}</span>
      </div>
      <div>
        <span>Neuron ID</span>
        <span>{{ userProfile.neuronId }}</span>
      </div>
    }

    <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
      <div>
        <label for="username">Username</label>
        <input id="username" type="text" formControlName="username" />
      </div>

      <div>
        <label for="bio">Bio</label>
        <input id="bio" type="text" formControlName="bio" />
      </div>

      <div>
        Social Media
        <div formGroupName="socialMedia">
          @for (key of socialMediaKeys; track key) {
            <div>
              <label [for]="key">{{ socialMediaInputs[key].label }}</label>
              <input [id]="key" type="text" [formControlName]="key" />
            </div>
          }
        </div>
      </div>

      <div>
        <a title="Cancel your edits" routerLink="/"> Cancel </a>
        <button type="submit">Save</button>
      </div>
    </form>
  `,
})
export class ProfileEditComponent implements OnInit {
  public readonly userProfile$: Observable<Profile | null>;
  public readonly profileForm: FormGroup;

  public readonly socialMediaKeys = keysOf(SOCIAL_MEDIA_INPUTS);
  public readonly socialMediaInputs = SOCIAL_MEDIA_INPUTS;

  constructor(
    formBuilder: FormBuilder,
    private readonly profileService: ProfileService,
  ) {
    this.profileForm = formBuilder.group({
      username: [''],
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
