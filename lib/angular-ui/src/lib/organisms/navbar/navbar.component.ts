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
  public set homeUrl(value: HTMLCgNavbarElement['homeUrl']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.homeUrl = value;
    });
  }
  public get homeUrl(): HTMLCgNavbarElement['homeUrl'] {
    return this.elementRef.nativeElement.homeUrl;
  }

  @Input({ required: true })
  public set links(value: HTMLCgNavbarElement['links']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.links = value;
    });
  }
  public get links(): HTMLCgNavbarElement['links'] {
    return this.elementRef.nativeElement.links;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgNavbarElement>,
  ) {
    this.changeDetectorRef.detach();
  }
}
