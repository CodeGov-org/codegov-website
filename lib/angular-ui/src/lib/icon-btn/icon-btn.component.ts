import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';

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
export class IconBtnComponent {
  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {
    this.changeDetectorRef.detach();
  }
}
