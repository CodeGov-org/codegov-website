import { ChangeDetectionStrategy, Component } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-close-icon';
import { DefineCustomElement } from '../../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-close-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class CloseIconComponent {}
