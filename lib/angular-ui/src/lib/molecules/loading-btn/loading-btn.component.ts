import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-loading-btn';
import { ButtonType, Theme } from '@cg/ui';
import { defineCustomElementComponent } from '../../custom-element-component';

@Component({
  selector: 'cg-loading-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class LoadingBtnComponent extends defineCustomElementComponent<HTMLCgLoadingBtnElement>(
  defineCustomElement,
) {
  public readonly type = input<ButtonType>('button');
  public readonly theme = input<Theme>();
  public readonly isLoading = input<boolean>();
  public readonly disabled = input<boolean>();

  constructor() {
    super();

    this.elemProxyEffect(this.type, 'type');
    this.elemProxyEffect(this.theme, 'theme');
    this.elemProxyEffect(this.isLoading, 'isLoading');
    this.elemProxyEffect(this.disabled, 'disabled');
  }
}
