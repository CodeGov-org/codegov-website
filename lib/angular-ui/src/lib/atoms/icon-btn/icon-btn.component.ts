import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-icon-btn';
import { defineCustomElementComponent } from '../../custom-element-component';

type CustomElement = HTMLCgIconBtnElement;

@Component({
  selector: 'cg-icon-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class IconBtnComponent extends defineCustomElementComponent<CustomElement>(
  defineCustomElement,
) {
  public readonly type = input<CustomElement['type']>('button');
  public readonly disabled = input<CustomElement['disabled']>(false);
  public readonly ariaLabel = input.required<CustomElement['ariaLabel']>();
  public readonly ariaHasPopup = input<CustomElement['ariaHasPopup']>();
  public readonly ariaExpanded = input<CustomElement['ariaExpanded']>();
  public readonly ariaControls = input<CustomElement['ariaControls']>();

  constructor() {
    super();

    this.elemProxyEffect(this.type, 'type');
    this.elemProxyEffect(this.disabled, 'disabled');
    this.elemProxyEffect(this.ariaLabel, 'ariaLabel');
    this.elemProxyEffect(this.ariaHasPopup, 'ariaHasPopup');
    this.elemProxyEffect(this.ariaExpanded, 'ariaExpanded');
    this.elemProxyEffect(this.ariaControls, 'ariaControls');
  }
}
