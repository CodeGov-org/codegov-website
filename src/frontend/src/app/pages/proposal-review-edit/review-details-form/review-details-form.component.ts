import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  ImageSet,
  ImageUploaderBtnComponent,
  LoadingBtnComponent,
  RadioInputComponent,
} from '@cg/angular-ui';
import { ProposalReviewImage } from '~core/api';
import { ReviewSubmissionService } from '~core/state';
import {
  FormFieldComponent,
  InputDirective,
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { boolToRadio, isNil, radioToBool, toSyncSignal } from '~core/utils';

@Component({
  selector: 'app-review-details-form',
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
    LoadingBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @use '@cg/styles/common';

    .image-preview {
      margin-top: common.size(4);
    }
  `,
  template: `
    @let reviewForm = this.reviewForm();
    @let selectedImages = this.selectedImages();
    @let imagesSaving = this.imagesSaving();
    @let imagesDeleting = this.imagesDeleting();

    <ng-container [formGroup]="reviewForm">
      <app-key-value-grid>
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
          <div>Vote to adopt</div>
        </app-key-col>
        <app-value-col>
          <app-form-field>
            <div class="radio-group">
              <cg-radio-input
                appInput
                [value]="1"
                formControlName="vote"
                name="vote"
              >
                Yes
              </cg-radio-input>

              <cg-radio-input
                appInput
                [value]="0"
                formControlName="vote"
                name="vote"
              >
                No
              </cg-radio-input>
            </div>
          </app-form-field>
        </app-value-col>

        <app-key-col>
          <div>Build verification image</div>
        </app-key-col>
        <app-value-col>
          <cg-image-uploader-btn
            [isLoading]="imagesSaving"
            [disabled]="selectedImages.length > 0 || imagesDeleting"
            (selectedImagesChange)="onImagesSelected($event)"
          >
            Select image
          </cg-image-uploader-btn>
        </app-value-col>
      </app-key-value-grid>

      @for (image of selectedImages; track image.path) {
        <div class="image-preview">
          <a [href]="image.path" target="_blank">
            <img [src]="image.path" />
          </a>

          <div class="btn-group">
            <cg-loading-btn
              [isLoading]="imagesDeleting"
              [disabled]="imagesSaving"
              (click)="removeImage(image.path)"
              theme="error"
            >
              Remove image
            </cg-loading-btn>
          </div>
        </div>
      }
    </ng-container>
  `,
})
export class ReviewDetailsFormComponent implements OnDestroy {
  private readonly reviewSubmissionService = inject(ReviewSubmissionService);

  private readonly review = toSyncSignal(this.reviewSubmissionService.review$);

  public readonly reviewForm = signal(
    new FormGroup<ReviewForm>({
      summary: new FormControl(null),
      buildReproduced: new FormControl(null),
      vote: new FormControl(null),
    }),
  );

  public readonly imagesSaving = signal(false);
  public readonly imagesDeleting = signal(false);
  public readonly selectedImages = signal<ProposalReviewImage[]>([]);

  private formSubscription = new Subscription();

  constructor() {
    effect(() => {
      const reviewForm = this.reviewForm();

      this.formSubscription.unsubscribe();
      this.formSubscription = new Subscription();

      this.formSubscription.add(
        reviewForm.valueChanges.subscribe(value => {
          this.onFormValueChange(value, reviewForm);
        }),
      );
    });

    effect(() => {
      const review = this.review();
      if (!review) {
        return;
      }

      this.selectedImages.set(review.images);
      this.reviewForm().setValue(
        {
          summary: review.summary,
          buildReproduced: boolToRadio(review.buildReproduced),
          vote: boolToRadio(review.vote),
        },
        { emitEvent: false },
      );
    });
  }

  public ngOnDestroy(): void {
    this.formSubscription.unsubscribe();
  }

  public async onImagesSelected(images: ImageSet[]): Promise<void> {
    this.imagesSaving.set(true);
    const optimisticImages = images.map<ProposalReviewImage>(image => ({
      path: image.xxl.url,
    }));
    this.selectedImages.set(optimisticImages);

    try {
      await Promise.all(
        images.map(
          async image =>
            await this.reviewSubmissionService.createProposalReviewImage(
              image.type,
              image.xxl.bytes,
            ),
        ),
      );
    } finally {
      this.imagesSaving.set(false);
    }
  }

  public async removeImage(imagePath: string): Promise<void> {
    const images = this.selectedImages();
    if (images.length === 0) {
      return;
    }

    this.imagesDeleting.set(true);

    try {
      await this.reviewSubmissionService.deleteProposalReviewImage(imagePath);
    } finally {
      this.selectedImages.set(images.slice(1));
      this.imagesDeleting.set(false);
    }
  }

  private onFormValueChange(
    value: Partial<ReviewFormValue>,
    reviewForm: FormGroup<ReviewForm>,
  ): void {
    const review = this.review();
    if (!reviewForm.valid || isNil(review)) {
      return;
    }

    this.reviewSubmissionService.updateReview({
      proposalId: review.proposalId,
      summary: value.summary ?? null,
      buildReproduced: radioToBool(value.buildReproduced),
      vote: radioToBool(value.vote),
    });
  }
}

interface ReviewFormValue {
  summary: string | null;
  buildReproduced: 0 | 1 | null;
  vote: 0 | 1 | null;
}

interface ReviewForm {
  summary: FormControl<string | null>;
  buildReproduced: FormControl<0 | 1 | null>;
  vote: FormControl<0 | 1 | null>;
}
