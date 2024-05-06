import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ToastService } from '~core/state';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [``],
  template: `
    <div
      class="toast"
      [class.toast--success]="type === 'success'"
      [class.toast--error]="type === 'error'"
    >
      <div class="toast__icon"></div>
    </div>
  `,
})
export class ToastComponent {
  public readonly toast = toSignal(this.toastService.toast$);
  public readonly isVisible = toSignal(this.toastService.isVisible$);

  constructor(private readonly toastService: ToastService) {}
}
