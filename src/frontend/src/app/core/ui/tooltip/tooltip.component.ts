import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  template: `
    <div
      class="bg-primary-900 border-primary-600 w-auto rounded-sm border-[0.5px] px-1 py-1 text-xs text-white dark:border-slate-500 dark:bg-slate-900"
    >
      {{ tooltipText }}
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipComponent {
  @Input({ required: true })
  public tooltipText!: string;
}
