import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

import { GLOBAL_CONFIG } from '../../../../global-config';
import { CardComponent, CopyToClipboardComponent } from '@cg/angular-ui';
import { AnonymousProfile } from '~core/state';

@Component({
  selector: 'app-anonymous-profile',
  standalone: true,
  imports: [CopyToClipboardComponent, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cg-card>
      <h2 class="h3" slot="cardTitle">Welcome to the CodeGov organisation</h2>

      <div slot="cardContent">
        <p>
          If you would like to become a reviewer,
          <a [href]="applyLink()">apply now</a>
          .
        </p>

        <p>When requested, provide this ID to a CodeGov admin:</p>

        <cg-copy-to-clipboard [value]="userProfile().id" />

        <p>
          If you're just here to look around, you don't need to do anything
          else.
        </p>
      </div>
    </cg-card>
  `,
})
export class AnonymousProfileComponent {
  public readonly userProfile = input.required<AnonymousProfile>();

  public readonly applyLink = signal(GLOBAL_CONFIG.applyLink);
}
