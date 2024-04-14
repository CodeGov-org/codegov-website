import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  effect,
  input,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-dropdown-trigger';
import { DefineCustomElement } from '../../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-dropdown-trigger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class DropdownTriggerComponent {
  public readonly isIconBtn =
    input<HTMLCgDropdownTriggerElement['isIconBtn']>(false);

  public readonly btnLabel = input<HTMLCgDropdownTriggerElement['btnLabel']>();

  constructor(
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgDropdownTriggerElement>,
  ) {
    effect(() => {
      const isIconBtn = this.isIconBtn();

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.isIconBtn = isIconBtn;
      });
    });

    effect(() => {
      const btnLabel = this.btnLabel();

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.btnLabel = btnLabel;
      });
    });
  }
}
