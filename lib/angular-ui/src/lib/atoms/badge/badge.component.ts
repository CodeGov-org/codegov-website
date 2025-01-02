import { ChangeDetectionStrategy, Component } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-badge';
import { DefineCustomElement } from '../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content></ng-content>`,
})
export class BadgeComponent {}
