import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { LoadingIconComponent } from '../../icons';

@Component({
  selector: 'app-loading-button',
  standalone: true,
  imports: [LoadingIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .loading-button__text--transparent {
        color: transparent;
      }
    `,
  ],
  template: `
    <button [type]="type" [disabled]="disabled" [class]="btnClass">
      @if (isSaving) {
        <app-loading-icon class="btn--loading" aria-label="Saving" />
      }

      <div
        [attr.aria-hidden]="isSaving"
        [class.loading-button__text--transparent]="isSaving"
      >
        <ng-content />
      </div>
    </button>
  `,
})
export class LoadingButtonComponent {
  @Input()
  public type: 'submit' | 'button' = 'button';

  @Input()
  public disabled = false;

  @Input()
  public btnClass = '';

  @Input()
  public isSaving = false;
}
