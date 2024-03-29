import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
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
  @Input()
  public set isIconBtn(value: HTMLCgDropdownTriggerElement['isIconBtn']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.isIconBtn = value;
    });
  }
  public get isIconBtn(): HTMLCgDropdownTriggerElement['isIconBtn'] {
    return this.elementRef.nativeElement.isIconBtn;
  }

  @Input()
  public set btnLabel(value: HTMLCgDropdownTriggerElement['btnLabel']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.btnLabel = value;
    });
  }
  public get btnLabel(): HTMLCgDropdownTriggerElement['btnLabel'] {
    return this.elementRef.nativeElement.btnLabel;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgDropdownTriggerElement>,
  ) {
    this.changeDetectorRef.detach();
  }
}
