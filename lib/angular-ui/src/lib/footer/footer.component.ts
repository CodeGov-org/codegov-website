import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { DefineCustomElement } from '../define-custom-element';
import { defineCustomElement } from '@cg/ui/dist/components/cg-footer';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class FooterComponent {
  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {
    this.changeDetectorRef.detach();
  }
}
