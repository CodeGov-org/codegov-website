import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  FormFieldComponent,
  InputDirective,
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '../../../core/ui';
import {
  ImageSet,
  ImageUploaderBtnComponent,
  RadioInputComponent,
} from '@cg/angular-ui';

@Component({
  selector: 'app-review-details-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    FormFieldComponent,
    InputDirective,
    RadioInputComponent,
    ImageUploaderBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container [formGroup]="reviewForm()">
      <app-key-value-grid>
        <app-key-col>
          <label appLabel for="timeSpent">Time spent (minutes)</label>
        </app-key-col>
        <app-value-col>
          <app-form-field>
            <input
              appInput
              id="timeSpent"
              formControlName="timeSpent"
              type="number"
              min="0"
            />
          </app-form-field>
        </app-value-col>

        <app-key-col>
          <div>Summary</div>
        </app-key-col>
        <app-value-col>
          <app-form-field>
            <textarea appInput formControlName="summary"></textarea>
          </app-form-field>
        </app-value-col>

        <app-key-col>
          <div>Build reproduced</div>
        </app-key-col>
        <app-value-col>
          <app-form-field>
            <div class="radio-group">
              <cg-radio-input
                appInput
                [value]="1"
                formControlName="buildReproduced"
                name="buildReproduced"
              >
                Yes
              </cg-radio-input>

              <cg-radio-input
                appInput
                [value]="0"
                formControlName="buildReproduced"
                name="buildReproduced"
              >
                No
              </cg-radio-input>
            </div>
          </app-form-field>
        </app-value-col>

        <app-key-col>
          <div>Build verification images</div>
        </app-key-col>
        <app-value-col>
          <cg-image-uploader-btn
            (selectedImagesChange)="onImagesSelected($event)"
          >
            Select image(s)
          </cg-image-uploader-btn>
        </app-value-col>
      </app-key-value-grid>

      @for (image of selectedImages(); track image.sm.url) {
        <img [src]="image.xxl.url" />
      }
    </ng-container>
  `,
})
export class ReviewDetailsFormComponent {
  public readonly reviewForm = signal(
    new FormGroup<ReviewForm>({
      timeSpent: new FormControl(null),
      summary: new FormControl(null),
      buildReproduced: new FormControl(null),
    }),
  );

  public selectedImages = signal<ImageSet[]>([]);

  public onImagesSelected(images: ImageSet[]): void {
    this.selectedImages.set(images);
  }
}

interface ReviewForm {
  timeSpent: FormControl<number | null>;
  summary: FormControl<string | null>;
  buildReproduced: FormControl<boolean | null>;
}
