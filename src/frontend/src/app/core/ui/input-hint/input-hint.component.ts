import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-input-hint',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #hintTemplate>
      <ng-content />
    </ng-template>
  `,
})
export class InputHintComponent {
  private readonly hintTemplate =
    viewChild.required<TemplateRef<HTMLElement>>('hintTemplate');

  public getTemplateRef(): TemplateRef<HTMLElement> {
    return this.hintTemplate();
  }
}
