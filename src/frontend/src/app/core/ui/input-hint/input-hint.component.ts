import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
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
  @ViewChild('hintTemplate', { static: true })
  private hintTemplate!: TemplateRef<HTMLElement>;

  public getTemplateRef(): TemplateRef<HTMLElement> {
    return this.hintTemplate;
  }
}
