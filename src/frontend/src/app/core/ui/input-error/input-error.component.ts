import {
  ChangeDetectionStrategy,
  Component,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-input-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      .input-error {
        color: $error;
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
  @Input({ required: true })
  public key!: string;

  @ViewChild('errorTemplate', { static: true })
  private errorTemplate!: TemplateRef<HTMLElement>;

  public getTemplateRef(): TemplateRef<HTMLElement> {
    return this.errorTemplate;
  }
}
