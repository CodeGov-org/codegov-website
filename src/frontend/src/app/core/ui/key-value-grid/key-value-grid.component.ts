import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

@Component({
  selector: 'app-key-value-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class KeyValueGridComponent {
  @HostBinding('class')
  public class = 'key-value-grid';
}
