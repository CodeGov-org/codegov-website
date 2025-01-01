import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  effect,
  input,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-dropdown';
import { DefineCustomElement } from '../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DropdownComponent {
  public readonly anchorAlign = input<HTMLCgDropdownElement['anchorAlign']>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgDropdownElement>,
  ) {
    effect(() => {
      const anchorAlign = this.anchorAlign();

      if (anchorAlign) {
        this.ngZone.runOutsideAngular(() => {
          this.elementRef.nativeElement.anchorAlign = anchorAlign;
        });
      }
    });
  }
}
