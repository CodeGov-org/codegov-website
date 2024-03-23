import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { defineCustomElement } from '@cg/ui/dist/components/cg-radio-input';
import { DefineCustomElement } from '../../define-custom-element';

type ChangeFn = (value: HTMLCgRadioInputElement['value']) => void;
type TouchedFn = () => void;

@DefineCustomElement(defineCustomElement)
@Component({
  selector: 'cg-radio-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioInputComponent),
      multi: true,
    },
  ],
  template: `
    <ng-content />
  `,
})
export class RadioInputComponent implements ControlValueAccessor {
  private notifyChange: ChangeFn = () => {};
  private notifyTouched: TouchedFn = () => {};

  @Input({ required: true })
  public set value(value: HTMLCgRadioInputElement['value']) {
    this.elementRef.nativeElement.value = value;
  }
  public get value(): HTMLCgRadioInputElement['value'] {
    return this.elementRef.nativeElement.value;
  }

  public writeValue(value: HTMLCgRadioInputElement['value']): void {
    this.elementRef.nativeElement.checked = value === this.value;
  }

  public registerOnChange(fn: ChangeFn): void {
    this.notifyChange = fn;
  }

  public registerOnTouched(fn: TouchedFn): void {
    this.notifyTouched = fn;
  }

  @Output()
  public blur = new EventEmitter<void>();

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
    private readonly elementRef: ElementRef<HTMLCgRadioInputElement>,
  ) {}
}
