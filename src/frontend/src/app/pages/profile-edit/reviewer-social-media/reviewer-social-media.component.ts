import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import { SOCIAL_MEDIA_INPUTS } from '../profile.model';
import { TextBtnComponent } from '@cg/angular-ui';
import { ReviewerUserProfile } from '~core/api';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { keysOf } from '~core/utils';

@Component({
  selector: 'app-reviewer-social-media',
  imports: [
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    TextBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-key-value-grid>
      @for (key of socialMediaKeys(); track key; let i = $index) {
        <app-key-col [id]="'social-media-' + i">
          {{ socialMediaInputs()[key].label }}
        </app-key-col>
        <app-value-col [attr.aria-labelledby]="'social-media-' + i">
          @if (hasSocialMediaMap()[key]) {
            <a
              [href]="socialMediaUrls()[key]"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ socialMediaUrls()[key] }}
            </a>
          }
        </app-value-col>
      }
    </app-key-value-grid>

    <div class="btn-group">
      <cg-text-btn (click)="onEditForm()">Edit</cg-text-btn>
    </div>
  `,
})
export class ReviewerSocialMediaComponent {
  public readonly userProfile = input.required<ReviewerUserProfile>();

  public readonly edit = output();

  public readonly socialMediaKeys = signal(keysOf(SOCIAL_MEDIA_INPUTS));
  public readonly socialMediaInputs = signal(SOCIAL_MEDIA_INPUTS);

  public readonly socialMediaUsernames = computed(() =>
    keysOf(SOCIAL_MEDIA_INPUTS).reduce<Record<string, string>>(
      (accum, key) => ({
        ...accum,
        [key]:
          this.userProfile().socialMedia.find(element => element.type === key)
            ?.username ?? '',
      }),
      {},
    ),
  );

  public readonly socialMediaUrls = computed(() =>
    keysOf(SOCIAL_MEDIA_INPUTS).reduce<Record<string, string>>(
      (accum, key) => ({
        ...accum,
        [key]:
          this.socialMediaInputs()[key].baseUrl +
          this.socialMediaUsernames()[key],
      }),
      {},
    ),
  );

  public readonly hasSocialMediaMap = computed(() =>
    keysOf(SOCIAL_MEDIA_INPUTS).reduce<Record<string, boolean>>(
      (accum, key) => ({
        ...accum,
        [key]: this.socialMediaUsernames()[key].length > 0,
      }),
      {},
    ),
  );

  public onEditForm(): void {
    this.edit.emit();
  }
}
