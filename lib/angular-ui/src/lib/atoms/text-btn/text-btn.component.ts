import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-text-btn';
import { defineCustomElementComponent } from '../../custom-element-component';
import { AriaHasPopup, ButtonType, Theme } from '@cg/ui';

@Component({
  selector: 'cg-text-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class TextBtnComponent extends defineCustomElementComponent<HTMLCgTextBtnElement>(
  defineCustomElement,
) {
  public readonly type = input<ButtonType>('button');
  public readonly theme = input<Theme>();
  public readonly disabled = input<boolean>();
  public readonly ariaHasPopup = input<AriaHasPopup>();
  public readonly ariaExpanded = input<boolean>();
  public readonly ariaControls = input<string>();

  constructor() {
    super();

    this.elemProxyEffect(this.type, 'type');
    this.elemProxyEffect(this.theme, 'theme');
    this.elemProxyEffect(this.disabled, 'disabled');
    this.elemProxyEffect(this.ariaHasPopup, 'ariaHasPopup');
    this.elemProxyEffect(this.ariaExpanded, 'ariaExpanded');
    this.elemProxyEffect(this.ariaControls, 'ariaControls');
  }
}
