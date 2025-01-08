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
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { SOCIAL_MEDIA_INPUTS, SocialMediaInputs } from '../profile.model';
import { LoadingBtnComponent, TextBtnComponent } from '@cg/angular-ui';
import {
  ReviewerUserProfile,
  SocialMediaLink,
  UpdateMyUserProfileRequest,
  UserRole,
  SocialMediaLinkType,
} from '~core/api';
import { ProfileService } from '~core/state';
import {
  FormFieldComponent,
  FormValidationInfoComponent,
  InputDirective,
  InputHintComponent,
  KeyColComponent,
  KeyValueGridComponent,
  LabelDirective,
  ValueColComponent,
} from '~core/ui';
import { keysOf } from '~core/utils';

export type SocialMediaForm = {
  [K in SocialMediaLinkType]: FormControl<string>;
};

@Component({
  selector: 'app-reviewer-social-media-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    FormValidationInfoComponent,
    InputDirective,
    LabelDirective,
    InputHintComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    LoadingBtnComponent,
    TextBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="socialMediaForm()" (ngSubmit)="onSubmit()">
      <app-key-value-grid>
        @for (key of socialMediaKeys(); track key) {
          <app-key-col>
            <label appLabel [for]="key">
              {{ socialMediaInputs()[key].formLabel }}
            </label>
          </app-key-col>

          <app-value-col>
            <app-form-field>
              <input appInput [id]="key" type="text" [formControlName]="key" />

              <app-input-hint>
                @if (socialMediaControlHasValue(key)) {
                  <a
                    [href]="getSocialMediaUrl(key)"
                    target="_blank"
                    rel="nofollow noreferrer"
                  >
                    {{ getSocialMediaUrl(key) }}
                  </a>
                }
              </app-input-hint>
            </app-form-field>
          </app-value-col>
        }
      </app-key-value-grid>

      <app-form-validation-info />

      <div class="btn-group">
        <cg-text-btn (click)="onCancelEdits()" [disabled]="isSaving()">
          Cancel
        </cg-text-btn>

        <cg-loading-btn
          type="submit"
          [disabled]="socialMediaForm().invalid"
          [isLoading]="isSaving()"
        >
          Save
        </cg-loading-btn>
      </div>
    </form>
  `,
})
export class ReviewerSocialMediaFormComponent {
  public readonly userProfile = input.required<ReviewerUserProfile>();

  public readonly formClose = output();
  public readonly formSaving = output();

  public readonly socialMediaKeys = signal(keysOf(SOCIAL_MEDIA_INPUTS));
  public readonly socialMediaInputs = signal(SOCIAL_MEDIA_INPUTS);
  public readonly isSaving = signal(false);

  public readonly socialMediaForm = computed(
    () =>
      new FormGroup<SocialMediaForm>(
        this.socialMediaKeys().reduce(
          (accum, value) => ({
            ...accum,
            [value]: new FormControl('', {
              nonNullable: true,
            }),
          }),
          {},
        ) as SocialMediaForm,
      ),
  );

  constructor(private readonly profileService: ProfileService) {
    effect(() => {
      this.socialMediaForm().patchValue(
        this.userProfile().socialMedia.reduce(
          (accum, value) => ({ ...accum, [value.type]: value.username }),
          {},
        ),
      );
    });
  }

  public async onSubmit(): Promise<void> {
    this.socialMediaForm().disable();
    this.isSaving.set(true);

    const socialMediaFormValues = this.socialMediaForm().value;

    const socialMedia = Object.entries(
      socialMediaFormValues ?? {},
    ).map<SocialMediaLink>(([key, value]) => ({
      type: key as SocialMediaLinkType,
      username: value,
    }));

    const profileUpdate: UpdateMyUserProfileRequest = {
      role: UserRole.Reviewer,
      socialMedia: socialMedia,
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

  public socialMediaControlHasValue(
    controlName: keyof SocialMediaInputs,
  ): boolean {
    const control = this.getSocialMediaControl(controlName);

    return control.value;
  }

  // [TODO] - convert to signal
  public getSocialMediaUrl(controlName: keyof SocialMediaInputs): string {
    const control = this.getSocialMediaControl(controlName);

    const baseUrl = this.socialMediaInputs()[controlName].baseUrl;

    return baseUrl + control.value;
  }

  private getSocialMediaControl(controlName: string): AbstractControl {
    const control = this.socialMediaForm().get(controlName);
    if (control === null) {
      throw new Error(`Control "${controlName} not found."`);
    }
    return control;
  }
}
