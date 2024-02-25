import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ChevronIconComponent } from '~core/icons';

@Component({
  selector: 'app-collapsible',
  standalone: true,
  imports: [ChevronIconComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  template: `
    <button class="collapsible__trigger" (click)="onTriggerClicked()">
      <ng-content select="[header]" />

      <app-chevron-icon />
    </button>

    <div
      class="collapsible__content"
      [ngClass]="{ 'collapsible__content--closed': !isOpen }"
    >
      <ng-content select="[body]" />
    </div>
  `,
})
export class CollapsibleComponent {
  public isOpen = false;

  public onTriggerClicked(): void {
    this.isOpen = !this.isOpen;
  }
}
