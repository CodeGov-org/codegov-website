import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  effect,
  forwardRef,
  input,
  output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { defineCustomElement } from '@cg/ui/dist/components/cg-radio-input';
import { DefineCustomElement } from '../../define-custom-element';

type ChangeFn = (value: HTMLCgRadioInputElement['value']) => void;
type TouchedFn = () => void;

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-radio-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioInputComponent),
      multi: true,
    },
  ],
  template: `<ng-content />`,
})
export class RadioInputComponent implements ControlValueAccessor {
  private notifyChange: ChangeFn = () => {};
  private notifyTouched: TouchedFn = () => {};

  public readonly value = input.required<HTMLCgRadioInputElement['value']>();

  public writeValue(value: HTMLCgRadioInputElement['value']): void {
    this.elementRef.nativeElement.checked = value === this.value();
  }

  public registerOnChange(fn: ChangeFn): void {
    this.notifyChange = fn;
  }

  public registerOnTouched(fn: TouchedFn): void {
    this.notifyTouched = fn;
  }

  public readonly blur = output();

  @HostListener('change')
  public handleChangeEvent(): void {
    this.notifyChange(this.elementRef.nativeElement.value);
  }

  @HostListener('focusout')
  public handleBlurEvent(): void {
    this.notifyTouched();
    this.blur.emit();
  }

  public setDisabledState(isDisabled: boolean): void {
    this.elementRef.nativeElement.disabled = isDisabled;
  }

  constructor(
    private readonly ngZone: NgZone,
    private readonly elementRef: ElementRef<HTMLCgRadioInputElement>,
  ) {
    effect(() => {
      const value = this.value();

      this.ngZone.runOutsideAngular(() => {
        this.elementRef.nativeElement.value = value;
      });
    });
  }
}
