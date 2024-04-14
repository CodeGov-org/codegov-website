import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  effect,
  input,
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
  public readonly links = input.required<HTMLCgFooterElement['links']>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgFooterElement>,
  ) {
    effect(() => {
      const links = this.links();

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.links = links;
      });
    });
  }
}
