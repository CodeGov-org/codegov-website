import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
} from '@angular/core';

import { NavLink, NavLinkCategory } from '@cg/ui/dist/types';
import { defineCustomElement } from '@cg/ui/dist/components/cg-sidenav';
import { DefineCustomElement } from '../../define-custom-element';

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
  @Input({ required: true })
  public set homeUrl(value: HTMLCgSidenavElement['homeUrl']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.homeUrl = value;
    });
  }
  public get homeUrl(): HTMLCgSidenavElement['homeUrl'] {
    return this.elementRef.nativeElement.homeUrl;
  }

  @Input({ required: true })
  public set links(value: HTMLCgSidenavElement['links']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.links = value;
    });
  }
  public get links(): HTMLCgSidenavElement['links'] {
    return this.elementRef.nativeElement.links;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgSidenavElement>,
  ) {
    this.changeDetectorRef.detach();
  }
}

export { NavLink, NavLinkCategory };
