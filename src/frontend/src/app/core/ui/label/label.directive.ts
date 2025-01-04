import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[appLabel]',
})
export class LabelDirective {
  @HostBinding('class')
  public class = 'label';
}
