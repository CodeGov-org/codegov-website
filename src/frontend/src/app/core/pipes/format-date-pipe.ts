import { DatePipe } from '@angular/common';
import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
  standalone: true,
})
export class FormatDatePipe implements PipeTransform {
  constructor(@Inject(LOCALE_ID) public locale: string) {}

  public transform(date: Date): string | null {
    const pipe = new DatePipe(this.locale);

    return pipe.transform(date, 'medium');
  }
}
