import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DestroyRef,
  HostBinding,
  Optional,
  SkipSelf,
  TemplateRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlContainer } from '@angular/forms';

import { InputDirective } from '../input';
import { InputErrorComponent } from '../input-error';
import { InputHintComponent } from '../input-hint';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content></ng-content>

    <div class="ml-1 h-4 pt-1 text-xs">
      @if (hasError()) {
        <span class="text-error">
          <ng-container *ngTemplateOutlet="getErrorTemplate()" />
        </span>
      } @else if (hasHint()) {
        <ng-container *ngTemplateOutlet="getHintTemplate()" />
      }
    </div>
  `,
})
export class FormFieldComponent implements AfterContentInit {
  @HostBinding('class')
  public readonly class = 'form-field';

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
    if (!this.inputDirective) {
      throw new Error('Form field must have an input directive as a child');
    }
    const formControlName = this.inputDirective.formControlName;

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
