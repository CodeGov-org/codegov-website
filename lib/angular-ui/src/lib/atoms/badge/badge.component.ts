import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-badge';
import { DefineCustomElement } from '../../define-custom-element';
import { defineCustomElementComponent } from '../../custom-element-component';

type CustomElement = HTMLCgBadgeElement;

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class BadgeComponent extends defineCustomElementComponent<CustomElement>(
  defineCustomElement,
) {
  public readonly theme = input<CustomElement['theme']>('primary');

  constructor() {
    super();

    this.elemProxyEffect(this.theme, 'theme');
  }
}
