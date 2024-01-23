import { Directive, ElementRef, HostBinding } from '@angular/core';

@Directive({
  selector: '[appInput]',
  standalone: true,
})
export class InputDirective {
  @HostBinding('class')
  public get class(): string {
    const classes = 'mb-1 dark:bg-slate-800';

    if (this.elementRef.nativeElement.tagName.toLowerCase() === 'textarea') {
      return classes + ' leading-24 h-24 resize-y';
    }

    return classes;
  }

  constructor(
    private readonly elementRef: ElementRef<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) {}

  public getId(): string | undefined {
    return this.elementRef.nativeElement.id;
  }
}
