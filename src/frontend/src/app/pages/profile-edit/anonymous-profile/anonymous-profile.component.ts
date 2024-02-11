import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GLOBAL_CONFIG } from 'src/global-config';

import { AnonymousProfile } from '~core/state';
import { CardComponent, CopyButtonComponent } from '~core/ui';

@Component({
  selector: 'app-anonymous-profile',
  standalone: true,
  imports: [CopyButtonComponent, CardComponent],
  template: `
    <app-card>
      <h2 class="h3" cardTitle>Welcome to the CodeGov organisation</h2>

      <p>
        If you would like to become a reviewer,
        <a [href]="applyLink">apply now</a>.
      </p>

      <p>When requested, provide this ID to a CodeGov admin:</p>

      <div class="flex flex-row items-center">
        <div
          class="mr-3 overflow-x-auto whitespace-nowrap rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
        >
          {{ userProfile.id }}
        </div>

        <app-copy-button [input]="userProfile.id"></app-copy-button>
      </div>

      <p>
        If you're just here to look around, you don't need to do anything else.
      </p>
    </app-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousProfileComponent {
  @Input({ required: true })
  public userProfile!: AnonymousProfile;

  public applyLink = GLOBAL_CONFIG.applyLink;
}
