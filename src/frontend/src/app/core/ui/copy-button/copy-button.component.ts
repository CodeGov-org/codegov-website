import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TooltipDirective } from '../tooltip';
import { CopyIconComponent } from '~core/icons';

const INITIAL_TOOLTIP_TEXT = 'Copy to clipboard';

@Component({
  selector: 'app-copy-button',
  standalone: true,
  imports: [CopyIconComponent, TooltipDirective],
  template: `
    <button
      (click)="copyToClipboard()"
      class="btn btn--icon"
      [appTooltip]="tooltipText"
      [attr.aria-label]="tooltipText"
      (tooltipClose)="onTooltipClosed()"
    >
      <app-copy-icon />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyButtonComponent {
  @Input({ required: true })
  public input!: string;

  public tooltipText = INITIAL_TOOLTIP_TEXT;

  constructor(private readonly clipboard: Clipboard) {}

  public copyToClipboard(): void {
    this.clipboard.copy(this.input);
    this.tooltipText = 'Copied!';
  }

  public onTooltipClosed(): void {
    this.tooltipText = INITIAL_TOOLTIP_TEXT;
  }
}
