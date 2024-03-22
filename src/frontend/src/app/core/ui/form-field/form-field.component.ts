import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DestroyRef,
  Optional,
  SkipSelf,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlContainer } from '@angular/forms';

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
        <ng-container *ngTemplateOutlet="getErrorTemplate()" />
      } @else if (hasHint()) {
        <ng-container *ngTemplateOutlet="getHintTemplate()" />
      }
    </div>
  `,
})
export class FormFieldComponent implements AfterContentInit {
  @ContentChild(InputDirective, { descendants: true })
  private inputDirective?: InputDirective;

  @ContentChildren(InputErrorComponent, { descendants: true })
  private inputErrorComponents?: InputErrorComponent[];

  @ContentChild(InputHintComponent, { descendants: true })
  private inputHintComponent?: InputHintComponent;

  private formControl: AbstractControl | undefined;

  public formControlId: string | undefined;

  constructor(
    @SkipSelf()
    @Optional()
    private readonly controlContainer: ControlContainer,
    private readonly destroyRef: DestroyRef,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  public ngAfterContentInit(): void {
    if (!this.inputDirective) {
      throw new Error('Form field must have an input directive as a child');
    }
    const formControlName = this.inputDirective.formControlName;

    if (!formControlName) {
      throw new Error('Form field could not find form control name');
    }
    this.formControlId = this.inputDirective.getId();

    const formControl = this.controlContainer?.control?.get(formControlName);
    if (!formControl) {
      throw new Error(`Control with name ${formControlName} does not exist`);
    }

    this.formControl = formControl;

    this.formControl.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.changeDetectorRef.markForCheck();
      });

    this.inputDirective.touchChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.changeDetectorRef.markForCheck();
      });
  }

  public hasError(): boolean {
    return formHasError(this.formControl);
  }

  public getErrorTemplate(): TemplateRef<HTMLElement> | null {
    if (this.formControl?.errors) {
      for (const inputError of this.inputErrorComponents ?? []) {
        if (this.formControl.errors[inputError.key]) {
          return inputError.getTemplateRef();
        }
      }
    }

    return null;
  }

  public hasHint(): boolean {
    return !!this.inputHintComponent;
  }

  public getHintTemplate(): TemplateRef<HTMLElement> {
    if (!this.inputHintComponent) {
      throw new Error('Input hint does not exist');
    }

    return this.inputHintComponent.getTemplateRef();
  }

  public getFormControlId(): string | undefined {
    if (!this.inputDirective) {
      throw new Error('Form field must have an input directive as a child');
    }

    return this.inputDirective.getId();
  }
}
