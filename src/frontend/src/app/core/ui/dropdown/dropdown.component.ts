import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  ElementRef,
  HostListener,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationSkipped, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';

import { TooltipDirective } from '../tooltip';
import { ChevronIconComponent } from '~core/icons';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, ChevronIconComponent, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      (click)="onTriggerClicked()"
      [ngClass]="[menuTriggerClassName, 'dropdown__trigger']"
      [appTooltip]="tooltip"
      [attr.aria-label]="ariaLabel"
      [attr.aria-expanded]="isOpen"
      [attr.aria-controls]="id"
      aria-haspopup="menu"
    >
      <ng-content select="[menuTrigger]" />

      @if (showChevron) {
        <app-chevron-icon
          class="dropdown__chevron"
          aria-hidden="true"
          [class.dropdown__chevron--open]="isOpen"
        />
      }
    </button>

    <div
      class="dropdown__menu"
      [class.dropdown__menu--closed]="!isOpen"
      [id]="id"
      role="menu"
    >
      <ng-content select="[menu]" />
    </div>
  `,
})
export class DropdownComponent {
  @HostBinding('class.dropdown')
  public hostCssClass = true;

  @Input()
  public tooltip: string | null = null;

  @Input()
  public ariaLabel: string | null = null;

  @Input({ required: true })
  public id!: string;

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

  constructor(
    private readonly hostElem: ElementRef<HTMLElement>,
    router: Router,
  ) {
    router.events
      .pipe(
        takeUntilDestroyed(),
        filter(() => this.isOpen),
        filter(
          event =>
            event instanceof NavigationStart ||
            event instanceof NavigationSkipped,
        ),
      )
      .subscribe(() => {
        this.isOpen = false;
      });
  }

  public onTriggerClicked(): void {
    this.isOpen = !this.isOpen;
  }
}
