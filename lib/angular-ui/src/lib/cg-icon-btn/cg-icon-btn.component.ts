import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
} from '@angular/core';

import { Components } from '@cg/ui';
import { defineCustomElement } from '@cg/ui/dist/components/cg-icon-btn';
import { DefineCustomElement } from '../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-icon-btn',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class CgIconBtnComponent {
  @Input({ required: true })
  public set label(value: string) {
    this.ngZone.runOutsideAngular(() => {
      this.elementRef.nativeElement.label = value;
    });
  }
  public get label(): string {
    return this.elementRef.nativeElement.label;
  }

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<Components.CgIconBtn>,
  ) {
    this.changeDetectorRef.detach();
  }
}
