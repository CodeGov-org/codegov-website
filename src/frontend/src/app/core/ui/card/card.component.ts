import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mb-6 border-b border-slate-300 text-black dark:border-slate-700 dark:text-white"
    >
      <ng-content select="[cardTitle]" />
    </div>

    <ng-content />
  `,
})
export class CardComponent {
  @HostBinding('class')
  public class = 'card';
}
