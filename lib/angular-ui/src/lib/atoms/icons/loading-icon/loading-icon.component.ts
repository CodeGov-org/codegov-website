import { ChangeDetectionStrategy, Component } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-loading-icon';
import { DefineCustomElement } from '../../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-loading-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class LoadingIconComponent {}
