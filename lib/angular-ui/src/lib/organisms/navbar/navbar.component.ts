import { defineCustomElement } from '@cg/ui/dist/components/cg-navbar';
import { DefineCustomElement } from '../../define-custom-element';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
} from '@angular/core';
import { Components } from '@cg/ui';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class NavbarComponent {
  @Input({ required: true })
  public set homeUrl(value: Components.CgNavbar['homeUrl']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.homeUrl = value;
    });
  }
  public get homeUrl(): Components.CgNavbar['homeUrl'] {
    return this.elementRef.nativeElement.homeUrl;
  }

  @Input({ required: true })
  public set links(value: Components.CgNavbar['links']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.links = value;
    });
  }
  public get links(): Components.CgNavbar['links'] {
    return this.elementRef.nativeElement.links;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<Components.CgNavbar>,
  ) {
    this.changeDetectorRef.detach();
  }
}
