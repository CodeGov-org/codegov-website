import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Inject,
  Optional,
  SkipSelf,
} from '@angular/core';
import { ControlContainer } from '@angular/forms';

import { isNotNil } from '../../utils';

@Component({
  selector: 'app-form-validation-info',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      :host {
        display: block;
        text-align: right;
        margin-bottom: common.size(2);

        color: common.$error;
        @include common.text-sm;
      }

      :host-context(.form-validation-info--hidden) {
        color: transparent;
      }
    `,
  ],
  template: `
    There are some errors in your form. Please fix them and try again.
  `,
})
export class FormValidationInfoComponent {
  @HostBinding('class.form-validation-info--hidden')
  public get isFormValid(): boolean {
    // controlContainer.valid is false when the form is submitted for some reason,
    // so we invert controlContainer.invalid instead, which behaves as expected.
    return isNotNil(this.controlContainer?.invalid)
      ? !this.controlContainer?.invalid
      : false;
  }

  private readonly controlContainer: ControlContainer;

  constructor(
    @Inject(ControlContainer)
    @Optional()
    @SkipSelf()
    controlContainer: ControlContainer | undefined,
  ) {
    if (!controlContainer) {
      throw new Error('FormValidationInfoComponent must be used within a form');
    }

    this.controlContainer = controlContainer;
  }
}
