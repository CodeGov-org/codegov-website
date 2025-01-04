import { defineCustomElement } from '@cg/ui/dist/components/cg-navbar';
import { DefineCustomElement } from '../../define-custom-element';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  effect,
  input,
} from '@angular/core';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class NavbarComponent {
  public readonly homeUrl = input.required<HTMLCgNavbarElement['homeUrl']>();
  public readonly links = input.required<HTMLCgNavbarElement['links']>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgNavbarElement>,
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
