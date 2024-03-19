import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
} from '@angular/core';
import { DefineCustomElement } from '../../define-custom-element';
import { defineCustomElement } from '@cg/ui/dist/components/cg-footer';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class FooterComponent {
  @Input({ required: true })
  public set links(value: HTMLCgFooterElement['links']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.links = value;
    });
  }
  public get links(): HTMLCgFooterElement['links'] {
    return this.elementRef.nativeElement.links;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgFooterElement>,
  ) {
    this.changeDetectorRef.detach();
  }
}
