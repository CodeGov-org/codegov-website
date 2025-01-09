import { ChangeDetectionStrategy, Component } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-dropdown-link-menu-item';
import { defineCustomLinkElementComponent } from '../../../custom-element-component';

type CustomElement = HTMLCgLinkTextBtnElement;

@Component({
  selector: 'cg-dropdown-link-menu-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class DropdownLinkMenuItemComponent extends defineCustomLinkElementComponent<CustomElement>(
  defineCustomElement,
) {}
