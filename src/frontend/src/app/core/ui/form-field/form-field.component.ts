import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { InputDirective } from '../input';
import { LabelComponent } from '../label';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col md:flex-row">
      @if (hasLabel()) {
        <label [for]="getFormControlId()" class="font-bold md:w-1/3">
          <ng-container *ngTemplateOutlet="getLabelTemplate()"></ng-container>
        </label>
      }
      <div class="mb-3 flex flex-col md:w-2/3">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class FormFieldComponent {
  @ContentChild(LabelComponent, { descendants: true })
  private labelComponent?: LabelComponent;

  @ContentChild(InputDirective, { descendants: true })
  private inputDirective?: InputDirective;

  public hasLabel(): boolean {
    return !!this.labelComponent;
  }

  public getLabelTemplate(): TemplateRef<HTMLElement> {
    if (!this.labelComponent) {
      throw new Error('Label does not exist');
    }

    return this.labelComponent.getTemplateRef();
  }

  public getFormControlId(): string | undefined {
    if (!this.inputDirective) {
      throw new Error('Form field must have an input directive as a child');
    }

    return this.inputDirective.getId();
  }
}
