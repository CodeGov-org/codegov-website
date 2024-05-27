import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ToastService } from '~core/state';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .toast {
        top: 2%;
        right: 2%;
        position: absolute;
        background-color: grey;
        color: white;
        width: 350px;
      }
    `,
  ],
  template: `
    @if (toast()) {
      <div class="toast">
        <div>{{ toast()!.title }}</div>
        <div>{{ toast()!.message }}</div>
        <button (click)="close()">Close</button>
      </div>
    }
  `,
})
export class ToastComponent {
  public readonly toast = toSignal(this.toastService.toast$);

  constructor(private readonly toastService: ToastService) {}

  public close(): void {
    this.toastService.close();
  }
}
