import { ChangeDetectionStrategy, Component } from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-card';
import { defineCustomElementComponent } from '../../custom-element-component';

type CustomElement = HTMLCgCardElement;

@Component({
  selector: 'cg-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class CardComponent extends defineCustomElementComponent<CustomElement>(
  defineCustomElement,
) {}
