import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { LoadingIconComponent } from '../../icons';

@Component({
  selector: 'app-loading-button',
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
    <button [type]="type()" [disabled]="disabled()" [class]="btnClass()">
      @if (isSaving()) {
        <app-loading-icon class="btn--loading" aria-label="Saving" />
      }

      <div
        [attr.aria-hidden]="isSaving()"
        [class.loading-button__text--transparent]="isSaving()"
      >
        <ng-content />
      </div>
    </button>
  `,
})
export class LoadingButtonComponent {
  public readonly type = input<'submit' | 'button'>('button');

  public readonly disabled = input(false);

  public readonly btnClass = input('');

  public readonly isSaving = input(false);
}
