import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  OnInit,
  Optional,
  SkipSelf,
  computed,
  input,
  output,
} from '@angular/core';
import { ControlContainer } from '@angular/forms';

import { formHasError } from '../form-utils';

@Directive({
  selector: '[appInput]',
})
export class InputDirective implements OnInit {
  @HostBinding('class')
  public get class(): string {
    const classes = 'input';

    if (this.elementRef.nativeElement.tagName.toLowerCase() === 'textarea') {
      return classes + ' input--textarea';
    }

    if (
      this.elementRef.nativeElement.tagName.toLowerCase() === 'cg-radio-input'
    ) {
      return '';
    }

    return classes;
  }

  @HostBinding('attr.aria-invalid')
  @HostBinding('class.input--invalid')
  public get hasError(): boolean {
    return formHasError(this.formControl());
  }

  @HostBinding('attr.aria-describedby')
  public get feedbackElementId(): string {
    return `${this.getId()}-feedback`;
  }

  public readonly formControlName = input.required<string>();

  public readonly touchChange = output();

  @HostListener('blur')
  public onBlur(): void {
    this.touchChange.emit();
  }

  private readonly formControl = computed(() => {
    const formControl = this.controlContainer?.control?.get(
      this.formControlName(),
    );
    if (!formControl) {
      throw new Error(
        `Control with name ${this.formControlName} does not exist`,
      );
    }

    return formControl;
  });

  constructor(
    private readonly elementRef: ElementRef<
      HTMLInputElement | HTMLTextAreaElement
    >,
    @SkipSelf()
    @Optional()
    private readonly controlContainer: ControlContainer | null,
  ) {}

  public ngOnInit(): void {
    if (!this.controlContainer) {
      throw new Error('Input directive must be used within a form');
    }
  }

  public getId(): string | undefined {
    return this.elementRef.nativeElement.id;
  }
}
