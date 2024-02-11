import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { SOCIAL_MEDIA_INPUTS } from '../profile.model';
import { ReviewerProfile } from '~core/state';
import { keysOf } from '~core/utils';

@Component({
  selector: 'app-reviewer-social-media-view',
  standalone: true,
  template: `
    @for (key of socialMediaKeys; track key) {
      <div class="mb-4 flex flex-row items-center">
        <span class="w-1/3 font-bold">{{ socialMediaInputs[key].label }}</span>
        <span>{{ getSocialMediaValue(key) }}</span>
      </div>
    }

    <div class="flex items-center">
      <button type="button" class="btn ml-auto" (click)="editForm()">
        Edit
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewerSocialMediaViewComponent {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  @Output()
  public formEdit = new EventEmitter<void>();

  public readonly socialMediaKeys = keysOf(SOCIAL_MEDIA_INPUTS);
  public readonly socialMediaInputs = SOCIAL_MEDIA_INPUTS;

  public editForm(): void {
    this.formEdit.emit();
  }

  public getSocialMediaValue(lookupKey: string): string {
    return (
      this.userProfile.socialMedia.find(element => element.type === lookupKey)
        ?.link ?? ''
    );
  }
}
