import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-dropdown';
import { DefineCustomElement } from '../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class DropdownComponent {
  @Input()
  public set anchorAlign(value: HTMLCgDropdownElement['anchorAlign']) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.anchorAlign = value;
    });
  }
  public get anchorAlign(): HTMLCgDropdownElement['anchorAlign'] {
    return this.elementRef.nativeElement.anchorAlign;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgDropdownElement>,
  ) {
    this.changeDetectorRef.detach();
  }
}
