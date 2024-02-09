import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { AnonymousProfile } from '~core/state';

@Component({
  selector: 'app-anonymous-profile',
  standalone: true,
  template: `
    <div
      class="bg-primary-700 mx-auto mb-10 rounded-md px-2 py-6 text-white xl:w-2/3 dark:bg-slate-600"
    >
      <div class="mx-auto flex flex-col md:flex-row">
        <div class="flex flex-col px-4 md:mx-auto">
          <h2 class="mb-8">Welcome to the CodeGov organisation</h2>
          <p>
            If you would like to become a reviewer,
            <a href="/apply">apply now</a>.
          </p>
          <p>When requested, provide this ID to a CodeGov admin:</p>
          <p class="mb-8 font-bold">{{ userProfile.id }}</p>
          <p>
            If you're just here to look around, you don't need to do anything
            else.
          </p>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonymousProfileComponent {
  @Input({ required: true })
  public userProfile!: AnonymousProfile;
}
