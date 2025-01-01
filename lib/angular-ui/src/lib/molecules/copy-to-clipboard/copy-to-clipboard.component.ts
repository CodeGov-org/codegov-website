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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class CopyToClipboardComponent {
  public readonly value =
    input.required<HTMLCgCopyToClipboardElement['value']>();

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
  }
}
