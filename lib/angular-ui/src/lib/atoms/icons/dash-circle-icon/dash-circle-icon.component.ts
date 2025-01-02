import { ChangeDetectionStrategy, Component } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-dash-circle-icon';
import { DefineCustomElement } from '../../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-dash-circle-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DashCircleIconComponent {}
