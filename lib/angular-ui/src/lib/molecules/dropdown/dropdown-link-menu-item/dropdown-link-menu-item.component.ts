import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  NgZone,
  effect,
  input,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-dropdown-link-menu-item';
import { DefineCustomElement } from '../../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-dropdown-link-menu-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DropdownLinkMenuItemComponent {
  public readonly routerLink =
    input<HTMLCgDropdownLinkMenuItemElement['href']>();

  // prevent the `href` from being followed when clicked if it's not explicitly set.
  // this happens when `routerLink` is set.
  @HostListener('click', ['$event'])
  public onClick(event: Event): void {
    if (!this.hasExplicitHref) {
      event.preventDefault();
    }
  }

  // prevent the host element from being focused.
  // this happens when `routerLink` is set.
  @HostBinding('attr.tabindex')
  public tabIndex = -1;

  public href = input<HTMLCgDropdownLinkMenuItemElement['href']>();

  public isExternal =
    input<HTMLCgDropdownLinkMenuItemElement['isExternal']>(false);

  private hasExplicitHref = false;

  constructor(
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgDropdownLinkMenuItemElement>,
  ) {
    // when `routerLink` is set, proxy the value to the `href` attribute
    // for accessibility.
    effect(() => {
      const routerLink = this.routerLink();

      if (routerLink) {
        this.ngZone.runOutsideAngular(() => {
          this.elementRef.nativeElement.href = routerLink;
        });
      }
    });

    effect(() => {
      // see onClick for why this is necessary
      this.hasExplicitHref = true;
      const href = this.href();

      if (href) {
        this.ngZone.runOutsideAngular(() => {
          this.elementRef.nativeElement.href = href;
        });
      }
    });

    effect(() => {
      const isExternal = this.isExternal();

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.isExternal = isExternal;
      });
    });
  }
}
