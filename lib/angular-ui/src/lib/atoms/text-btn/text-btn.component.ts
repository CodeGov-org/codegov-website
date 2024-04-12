import { ChangeDetectionStrategy, Component } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-text-btn';
import { DefineCustomElement } from '../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-text-btn',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class TextBtnComponent {}
