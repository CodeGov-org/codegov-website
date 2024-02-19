import {
  Directive,
  ElementRef,
  HostBinding,
  Input,
  OnInit,
  Optional,
  SkipSelf,
} from '@angular/core';
import { AbstractControl, ControlContainer } from '@angular/forms';

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

    return classes;
  }

  @HostBinding('attr.aria-invalid')
  @HostBinding('class.input--invalid')
  public get hasError(): boolean {
    return this.formControl?.invalid ?? false;
  }

  @HostBinding('attr.aria-describedby')
  public get feedbackElementId(): string | undefined {
    return `${this.getId()}-feedback`;
  }

  @Input({ required: true })
  public formControlName!: string;

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
