import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  ElementRef,
  HostListener,
} from '@angular/core';

import { ChevronIconComponent } from '../chevron-icon';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, ChevronIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      (click)="onTriggerClicked()"
      [ngClass]="[menuTriggerClassName, 'dropdown-trigger']"
    >
      <div>
        <ng-content select="[menuTrigger]" />
      </div>

      @if (showChevron) {
        <app-chevron-icon />
      }
    </button>

    <div class="dropdown-menu" [ngClass]="{ hidden: !isOpen }">
      <ng-content select="[menu]" />
    </div>
  `,
})
export class DropdownComponent {
  @HostBinding('class.dropdown')
  public hostCssClass = true;

  @Input()
  public showChevron = true;

  public isOpen = false;

  @HostListener('document:click', ['$event'])
  public onDocumentClicked(event: MouseEvent): void {
    if (!this.hostElem.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  @Input()
  public menuTriggerClassName?: string = '';

  constructor(private readonly hostElem: ElementRef<HTMLElement>) {}

  public onTriggerClicked(): void {
    this.isOpen = !this.isOpen;
  }
}
