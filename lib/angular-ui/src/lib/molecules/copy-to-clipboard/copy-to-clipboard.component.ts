import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  effect,
  input,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-copy-to-clipboard';
import { DefineCustomElement } from '../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-copy-to-clipboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class CopyToClipboardComponent {
  public readonly value =
    input.required<HTMLCgCopyToClipboardElement['value']>();

  public readonly type = input<HTMLCgCopyToClipboardElement['type']>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgCopyToClipboardElement>,
  ) {
    effect(() => {
      const value = this.value();

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.value = value;
      });
    });

    effect(() => {
      const type = this.type();
      // [TODO]: use `isNil` from `@cg/utils` package
      if (!type) {
        return;
      }

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.type = type;
      });
    });
  }
}
