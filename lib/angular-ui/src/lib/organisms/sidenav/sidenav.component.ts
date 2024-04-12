import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  effect,
  input,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-sidenav';
import { DefineCustomElement } from '../../define-custom-element';

export { NavLink, NavLinkCategory } from '@cg/ui/dist/types';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-sidenav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class SidenavComponent {
  public readonly homeUrl = input.required<HTMLCgSidenavElement['homeUrl']>();
  public readonly links = input.required<HTMLCgSidenavElement['links']>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgSidenavElement>,
  ) {
    effect(() => {
      const homeUrl = this.homeUrl();

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.homeUrl = homeUrl;
      });
    });

    effect(() => {
      const links = this.links();

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.links = links;
      });
    });
  }
}
