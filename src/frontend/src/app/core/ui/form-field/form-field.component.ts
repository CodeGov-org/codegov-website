import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Optional,
  SkipSelf,
  computed,
  contentChild,
  contentChildren,
  effect,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlContainer } from '@angular/forms';

import { formHasError } from '../form-utils';
import { InputDirective } from '../input';
import { InputErrorComponent } from '../input-error';
import { InputHintComponent } from '../input-hint';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
      }

      .form-field__feedback {
        margin-left: size(1);
        height: size(4);
        padding-top: size(1);
        @include text-xs;
      }
    `,
  ],
  template: `
    <ng-content></ng-content>

    <div class="form-field__feedback" [id]="formControlId + '-feedback'">
      @if (hasError()) {
        <ng-container *ngTemplateOutlet="errorTemplate()" />
      } @else if (hasHint()) {
        <ng-container *ngTemplateOutlet="hintTemplate()" />
      }
    </div>
  `,
})
export class FormFieldComponent {
  private readonly inputDirective = contentChild.required(InputDirective, {
    descendants: true,
  });
  public readonly formControlId = computed(() => this.inputDirective().getId());
  private readonly formControl = computed(() => {
    const formControlName = this.inputDirective().formControlName();

    const formControl = this.controlContainer?.control?.get(formControlName);
    if (!formControl) {
      throw new Error(`Control with name ${formControlName} does not exist`);
    }

    return formControl;
  });

  private readonly inputHintComponent = contentChild(InputHintComponent, {
    descendants: true,
  });
  public readonly hasHint = computed(() => Boolean(this.inputHintComponent()));
  public readonly hintTemplate = computed(() => {
    const template = this.inputHintComponent()?.getTemplateRef();

    if (!template) {
      throw new Error('Input hint does not exist');
    }

    return template;
  });

  private readonly inputErrorComponents = contentChildren(InputErrorComponent, {
    descendants: true,
  });
  public readonly hasError = signal(false);
  public readonly errorTemplate = computed(() => {
    for (const inputError of this.inputErrorComponents()) {
      if (this.formControl().errors?.[inputError.key()]) {
        return inputError.getTemplateRef();
      }
    }

    return null;
  });

  constructor(
    @SkipSelf()
    @Optional()
    private readonly controlContainer: ControlContainer,
    onDestroy: DestroyRef,
  ) {
    effect(() => {
      this.formControl()
        .statusChanges.pipe(takeUntilDestroyed(onDestroy))
        .subscribe(() => {
          this.setHasError();
        });
    });

    effect(() => {
      this.inputDirective().touchChange.subscribe(() => {
        this.setHasError();
      });
    });
  }

  private setHasError(): void {
    this.hasError.set(formHasError(this.formControl()));
  }
}
