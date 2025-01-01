import { ChangeDetectionStrategy, Component } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-dropdown-btn-menu-item';
import { DefineCustomElement } from '../../../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-dropdown-btn-menu-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DropdownBtnMenuItemComponent {}
