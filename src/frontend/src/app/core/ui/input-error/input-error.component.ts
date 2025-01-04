import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-input-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      .input-error {
        color: common.$error;
      }
    `,
  ],
  template: `
    <ng-template #errorTemplate>
      <div class="input-error">
        <ng-content />
      </div>
    </ng-template>
  `,
})
export class InputErrorComponent {
  public readonly key = input.required<string>();

  private readonly errorTemplate =
    viewChild.required<TemplateRef<HTMLElement>>('errorTemplate');

  public getTemplateRef(): TemplateRef<HTMLElement> {
    return this.errorTemplate();
  }
}
