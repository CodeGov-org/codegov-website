import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';

import { SOCIAL_MEDIA_INPUTS, SocialMediaInputs } from '../profile.model';
import { ReviewerProfileComponent } from '../reviewer-profile';
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
  InputDirective,
  InputHintComponent,
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { ComponentChanges, keysOf } from '~core/utils';

export type SocialMediaForm = {
  [K in SocialMediaType]: FormControl<string>;
};

@Component({
  selector: 'app-reviewer-social-media-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormFieldComponent,
    InputHintComponent,
    InputDirective,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
  ],
  template: `
    <form [formGroup]="socialMediaForm" (ngSubmit)="onSubmit()">
      <app-key-value-grid>
        @for (key of socialMediaKeys; track key) {
          <app-key-col>
            <label appLabel [for]="key">
              {{ socialMediaInputs[key].label }}
            </label>
          </app-key-col>

          <app-value-col>
            <app-form-field>
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
          </app-value-col>
        }
      </app-key-value-grid>

      <div class="flex items-center justify-end">
        <button class="btn btn-outline mr-4" (click)="cancelEdits()">
          Cancel
        </button>

        <button type="submit" class="btn">Save</button>
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewerSocialMediaFormComponent implements OnChanges {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  @Output()
  public formClose = new EventEmitter<void>();

  public readonly socialMediaForm: FormGroup<SocialMediaForm>;
  public readonly socialMediaKeys = keysOf(SOCIAL_MEDIA_INPUTS);
  public readonly socialMediaInputs = SOCIAL_MEDIA_INPUTS;

  constructor(private readonly profileService: ProfileService) {
    this.socialMediaForm = new FormGroup<SocialMediaForm>(
      this.generateSocialMedia(),
    );
  }

  public ngOnChanges(
    changes: ComponentChanges<ReviewerProfileComponent>,
  ): void {
    if (changes.userProfile) {
      this.socialMediaForm.patchValue(
        this.userProfile.socialMedia.reduce(
          (accum, value) => ({ ...accum, [value.type]: value.link }),
          {},
        ),
      );
    }
  }

  public onSubmit(): void {
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
    this.formClose.emit();
  }

  public cancelEdits(): void {
    this.formClose.emit();
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