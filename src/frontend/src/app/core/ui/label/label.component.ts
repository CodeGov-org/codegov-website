import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-label',
  standalone: true,
  template: `
    <ng-template #labelTemplate>
      <ng-content />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelComponent {
  @ViewChild('labelTemplate', { static: true })
  private labelTemplate!: TemplateRef<HTMLElement>;

  public getTemplateRef(): TemplateRef<HTMLElement> {
    return this.labelTemplate;
  }
}
