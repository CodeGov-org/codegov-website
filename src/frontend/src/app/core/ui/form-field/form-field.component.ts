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

import { InputDirective } from '../input';
import { InputErrorComponent } from '../input-error';
import { InputHintComponent } from '../input-hint';
import { LabelComponent } from '../label';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col md:flex-row">
      @if (hasLabel()) {
        <label [for]="getFormControlId()" class="font-bold md:w-1/3">
          <ng-container *ngTemplateOutlet="getLabelTemplate()" />
        </label>
      }

      <div class="mb-3 flex flex-col md:w-2/3">
        <ng-content></ng-content>

        <div class="mb-1 ml-1 h-4 text-xs">
          @if (hasError()) {
            <span class="text-red-700 dark:text-red-400">
              <ng-container *ngTemplateOutlet="getErrorTemplate()" />
            </span>
          } @else if (hasHint()) {
            <ng-container *ngTemplateOutlet="getHintTemplate()" />
          }
        </div>
      </div>
    </div>
  `,
})
export class FormFieldComponent implements AfterContentInit {
  @ContentChild(LabelComponent, { descendants: true })
  private labelComponent?: LabelComponent;

  @ContentChild(InputDirective, { descendants: true })
  private inputDirective?: InputDirective;

  @ContentChildren(InputErrorComponent, { descendants: true })
  private inputErrorComponents?: InputErrorComponent[];

  @ContentChild(InputHintComponent, { descendants: true })
  private inputHintComponent?: InputHintComponent;

  private formControl: AbstractControl | undefined;

  constructor(
    @SkipSelf()
    @Optional()
    private readonly controlContainer: ControlContainer,
    private readonly destroyRef: DestroyRef,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  public ngAfterContentInit(): void {
    const formControlName = this.inputDirective?.formControlName;
    if (!formControlName) {
      throw new Error('Form field could not find form control name');
    }

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
  }

  public hasLabel(): boolean {
    return !!this.labelComponent;
  }

  public getLabelTemplate(): TemplateRef<HTMLElement> {
    if (!this.labelComponent) {
      throw new Error('Label does not exist');
    }

    return this.labelComponent.getTemplateRef();
  }

  public hasError(): boolean {
    return this.formControl?.invalid ?? false;
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
