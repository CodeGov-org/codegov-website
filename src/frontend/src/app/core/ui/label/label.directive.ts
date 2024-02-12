import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[appLabel]',
  standalone: true,
})
export class LabelDirective {
  @HostBinding('class')
  public class = 'label';
}
