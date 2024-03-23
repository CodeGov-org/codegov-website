import {
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnInit,
  Optional,
  Output,
  SkipSelf,
} from '@angular/core';
import { AbstractControl, ControlContainer } from '@angular/forms';

import { formHasError } from '../form-utils';

@Directive({
  selector: '[appInput]',
  standalone: true,
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
    return formHasError(this.formControl);
  }

  @HostBinding('attr.aria-describedby')
  public get feedbackElementId(): string | undefined {
    return `${this.getId()}-feedback`;
  }

  @Input({ required: true })
  public formControlName!: string;

  @Output()
  public touchChange = new EventEmitter<void>();

  @HostListener('blur')
  public onBlur(): void {
    this.touchChange.emit();
  }

  private formControl: AbstractControl | null | undefined;

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

    this.formControl = this.controlContainer.control?.get(this.formControlName);
    if (!this.formControl) {
      throw new Error(
        `Control with name ${this.formControlName} does not exist`,
      );
    }
  }

  public getId(): string | undefined {
    return this.elementRef.nativeElement.id;
  }
}
