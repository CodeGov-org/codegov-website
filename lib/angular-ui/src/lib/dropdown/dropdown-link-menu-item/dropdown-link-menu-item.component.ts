import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  NgZone,
} from '@angular/core';

import { Components } from '@cg/ui';
import { defineCustomElement } from '@cg/ui/dist/components/cg-dropdown-link-menu-item';
import { DefineCustomElement } from '../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-dropdown-link-menu-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class DropdownLinkMenuItemComponent {
  // when `routerLink` is set, proxy the value to the `href` attribute
  // for accessibility.
  @Input()
  public set routerLink(value: Components.CgDropdownLinkMenuItem['href']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.href = value;
    });
  }

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

  @Input()
  public set href(value: Components.CgDropdownLinkMenuItem['href']) {
    this.hasExplicitHref = true;

    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.href = value;
    });
  }
  public get href(): Components.CgDropdownLinkMenuItem['href'] {
    return this.elementRef.nativeElement.href;
  }

  @Input()
  public set isExternal(
    value: Components.CgDropdownLinkMenuItem['isExternal'],
  ) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.isExternal = value;
    });
  }
  public get isExternal(): Components.CgDropdownLinkMenuItem['isExternal'] {
    return this.elementRef.nativeElement.isExternal;
  }

  private hasExplicitHref = false;

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<Components.CgDropdownLinkMenuItem>,
  ) {
    this.changeDetectorRef.detach();
  }
}
