import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GLOBAL_CONFIG } from 'src/global-config';

import { AnonymousProfile } from '~core/state';
import { CardComponent, CopyButtonComponent } from '~core/ui';

@Component({
  selector: 'app-anonymous-profile',
  standalone: true,
  imports: [CopyButtonComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .user-id {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      .user-id__value {
        overflow-x: auto;
        white-space: nowrap;
        border-radius: $border-radius;

        margin-right: size(3);
        @include px(3);
        @include py(2);

        border: 1px solid $slate-300;
        color: $slate-900;
        background-color: $white;

        @include dark {
          border-color: $slate-700;
          background-color: $slate-950;
          color: $slate-200;
        }
      }
    `,
  ],
  template: `
    <app-card>
      <h2 class="h3" cardTitle>Welcome to the CodeGov organisation</h2>

      <p>
        If you would like to become a reviewer,
        <a [href]="applyLink">apply now</a>.
      </p>

      <p>When requested, provide this ID to a CodeGov admin:</p>

      <div class="user-id">
        <div class="user-id__value">
          {{ userProfile.id }}
        </div>

        <app-copy-button [input]="userProfile.id"></app-copy-button>
      </div>

      <p>
        If you're just here to look around, you don't need to do anything else.
      </p>
    </app-card>
  `,
})
export class AnonymousProfileComponent {
  @Input({ required: true })
  public userProfile!: AnonymousProfile;

  public applyLink = GLOBAL_CONFIG.applyLink;
}
