import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';

import { defineCustomElement } from '@cg/ui/dist/components/cg-profile-icon';
import { DefineCustomElement } from '../define-custom-element';

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-profile-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
  `,
})
export class ProfileIconComponent {
  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {
    this.changeDetectorRef.detach();
  }
}
