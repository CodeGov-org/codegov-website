import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { defineCustomLinkElementComponent } from '../../custom-element-component';
import { defineCustomElement } from '@cg/ui/dist/components/cg-link-text-btn';

type CustomElement = HTMLCgLinkTextBtnElement;

@Component({
  selector: 'cg-link-text-btn',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class LinkTextBtnComponent extends defineCustomLinkElementComponent<CustomElement>(
  defineCustomElement,
) {
  public readonly routerLink = input<string | string[]>();
  public readonly href = input<CustomElement['href']>();
  public readonly isExternal = input<CustomElement['isExternal']>(false);
}
