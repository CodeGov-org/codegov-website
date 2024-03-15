import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
} from '@angular/core';

import { Components } from '@cg/ui';
import {
  SidenavLink,
  SidenavLinkCategory,
} from '@cg/ui/dist/types/components/sidenav/sidenav';
import { defineCustomElement } from '@cg/ui/dist/components/cg-sidenav';
import { DefineCustomElement } from '../define-custom-element';

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
  public set homeUrl(value: string) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.homeUrl = value;
    });
  }
  public get homeUrl(): string {
    return this.elementRef.nativeElement.homeUrl;
  }

  @Input({ required: true })
  public set links(value: Array<SidenavLink | SidenavLinkCategory>) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.links = value;
    });
  }
  public get links(): Array<SidenavLink | SidenavLinkCategory> {
    return this.elementRef.nativeElement.links;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<Components.CgSidenav>,
  ) {
    this.changeDetectorRef.detach();
  }
}

export { SidenavLink, SidenavLinkCategory };