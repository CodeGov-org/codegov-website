import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

import { ChevronIconComponent } from '~core/icons';

@Component({
  selector: 'app-collapsible',
  standalone: true,
  imports: [ChevronIconComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="collapsible-trigger" (click)="onTriggerClicked()">
      <ng-content select="[header]" />

      <app-chevron-icon />
    </button>

    <div class="collapsible-content" [ngClass]="{ hidden: !isOpen }">
      <ng-content select="[body]" />
    </div>
  `,
})
export class CollapsibleComponent {
  public isOpen = false;

  @HostBinding('class.block')
  public hostCssClass = true;

  public onTriggerClicked(): void {
    this.isOpen = !this.isOpen;
  }
}
