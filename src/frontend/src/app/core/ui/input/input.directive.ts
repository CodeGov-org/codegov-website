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
    const classes = 'mb-1 dark:bg-slate-800';

    if (this.elementRef.nativeElement.tagName.toLowerCase() === 'textarea') {
      return classes + ' leading-24 h-24 resize-y';
    }

    return classes;
  }

  @HostBinding('class.border-red-700')
  public get hasError(): boolean {
    return this.formControl?.invalid ?? false;
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
