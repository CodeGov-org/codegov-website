import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { SOCIAL_MEDIA_INPUTS } from '../profile.model';
import { ReviewerProfile } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { keysOf } from '~core/utils';

@Component({
  selector: 'app-reviewer-social-media',
  imports: [KeyValueGridComponent, KeyColComponent, ValueColComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-key-value-grid>
      @for (key of socialMediaKeys; track key; let i = $index) {
        <app-key-col [id]="'social-media-' + i">
          {{ socialMediaInputs[key].label }}
        </app-key-col>
        <app-value-col [attr.aria-labelledby]="'social-media-' + i">
          {{ getSocialMediaValue(key) }}
        </app-value-col>
      }
    </app-key-value-grid>

    <div class="btn-group">
      <button type="button" class="btn" (click)="editForm()">Edit</button>
    </div>
  `,
})
export class ReviewerSocialMediaComponent {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  @Output()
  public edit = new EventEmitter<void>();

  public readonly socialMediaKeys = keysOf(SOCIAL_MEDIA_INPUTS);
  public readonly socialMediaInputs = SOCIAL_MEDIA_INPUTS;

  public editForm(): void {
    this.edit.emit();
  }

  public getSocialMediaValue(lookupKey: string): string {
    return (
      this.userProfile.socialMedia.find(element => element.type === lookupKey)
        ?.username ?? ''
    );
  }
}
