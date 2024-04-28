import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  signal,
  viewChildren,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  FormFieldComponent,
  InputDirective,
  InputErrorComponent,
  InputHintComponent,
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '../../../core/ui';
import { CardComponent, RadioInputComponent } from '@cg/angular-ui';

@Component({
  selector: 'app-review-commits-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    FormFieldComponent,
    InputDirective,
    InputErrorComponent,
    InputHintComponent,
    RadioInputComponent,
  ],
  styles: [
    `
      @import '@cg/styles/common';

      .commit-review-card {
        margin-bottom: size(4);
      }
    `,
  ],
  template: `
    @for (commitForm of commitForms(); track i; let i = $index) {
      <ng-container [formGroup]="commitForm">
        <cg-card class="commit-review-card">
          <div slot="cardContent">
            <app-key-value-grid>
              <app-key-col>
                <label appLabel [for]="'id-' + i">Commit hash</label>
              </app-key-col>
              <app-value-col>
                <app-form-field>
                  <input
                    appInput
                    [id]="'id-' + i"
                    formControlName="id"
                    autocomplete="off"
                    #commitShaInput
                  />

                  <app-input-error key="required">
                    Commit hash cannot be empty.
                  </app-input-error>

                  <app-input-error key="pattern">
                    Please enter a valid commit hash.
                  </app-input-error>

                  <app-input-hint>
                    @if (commitForm.controls.id.value) {
                      <a
                        [href]="
                          'https://github.com/dfinity/ic/commit/' +
                          commitForm.controls.id.value
                        "
                        target="_blank"
                        rel="nofollow noreferrer"
                      >
                        https://github.com/dfinity/ic/commit/{{
                          commitForm.controls.id.value
                        }}
                      </a>
                    } @else {
                      Enter a short or long commit hash/id/sha, or a GitHub URL
                      to the commit.
                    }
                  </app-input-hint>
                </app-form-field>
              </app-value-col>

              <app-key-col>
                <div>Reviewed</div>
              </app-key-col>
              <app-value-col>
                <app-form-field>
                  <div class="radio-group">
                    <cg-radio-input
                      appInput
                      [value]="1"
                      formControlName="reviewed"
                      [attr.name]="'reviewed-' + i"
                    >
                      Yes
                    </cg-radio-input>

                    <cg-radio-input
                      appInput
                      [value]="0"
                      formControlName="reviewed"
                      [attr.name]="'reviewed-' + i"
                    >
                      No
                    </cg-radio-input>
                  </div>

                  <app-input-error key="required">
                    Did you review the commit?
                  </app-input-error>
                </app-form-field>
              </app-value-col>

              <ng-container>
                <ng-container *ngIf="commitForm.controls.reviewed.value === 1">
                  <app-key-col>
                    <div>Matches description</div>
                  </app-key-col>
                  <app-value-col>
                    <app-form-field>
                      <div class="radio-group">
                        <cg-radio-input
                          appInput
                          [value]="1"
                          formControlName="matchesDescription"
                          [attr.name]="'matches-description-' + i"
                        >
                          Yes
                        </cg-radio-input>

                        <cg-radio-input
                          appInput
                          [value]="0"
                          formControlName="matchesDescription"
                          [attr.name]="'matches-description-' + i"
                        >
                          No
                        </cg-radio-input>
                      </div>

                      <app-input-error key="required">
                        Did the commit match the description?
                      </app-input-error>
                    </app-form-field>
                  </app-value-col>

                  <app-key-col>
                    <label appLabel [for]="'summary-' + i">Summary</label>
                  </app-key-col>
                  <app-value-col>
                    <app-form-field>
                      <textarea
                        appInput
                        [id]="'summary-' + i"
                        formControlName="summary"
                        autocomplete="off"
                      ></textarea>

                      <app-input-error key="required">
                        Summary cannot be empty.
                      </app-input-error>
                    </app-form-field>
                  </app-value-col>

                  <app-key-col>
                    <label appLabel [for]="'highlights-' + i">Highlights</label>
                  </app-key-col>
                  <app-value-col>
                    <app-form-field>
                      <textarea
                        appInput
                        [id]="'highlights-' + i"
                        formControlName="highlights"
                        autocomplete="off"
                      ></textarea>
                    </app-form-field>
                  </app-value-col>
                </ng-container>
              </ng-container>
            </app-key-value-grid>

            <div class="btn-group">
              <button class="btn btn--outline" (click)="onRemoveCommitForm(i)">
                Remove
              </button>
            </div>
          </div>
        </cg-card>
      </ng-container>
    }

    <div>
      <button
        class="btn btn--outline"
        (click)="onAddCommitForm()"
        [disabled]="!canAddCommitForm()"
      >
        Add commit
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewCommitsFormComponent {
  public readonly commitForms = signal<Array<FormGroup<ReviewCommitForm>>>([]);
  public readonly commitShaInputs =
    viewChildren<ElementRef<HTMLInputElement>>('commitShaInput');

  private readonly commitFormReviewedSubscriptions: Subscription[] = [];
  private readonly commitShaSubscriptions: Subscription[] = [];

  // [TODO] - convert to signal
  public canAddCommitForm(): boolean {
    return this.commitForms().every(form => form.valid);
  }

  public onAddCommitForm(): void {
    if (this.canAddCommitForm()) {
      const commitForm = new FormGroup<ReviewCommitForm>({
        id: new FormControl(null, {
          validators: [Validators.required, Validators.pattern(commitShaRegex)],
        }),
        reviewed: new FormControl(null, {
          validators: [Validators.required],
        }),
        matchesDescription: new FormControl(null),
        summary: new FormControl(null),
        highlights: new FormControl(null),
      });

      this.commitForms.set([...this.commitForms(), commitForm]);

      const reviewedSubscription =
        commitForm.controls.reviewed.valueChanges.subscribe(reviewed => {
          this.onCommitReviewedChange(reviewed === 1, commitForm);
        });
      this.commitFormReviewedSubscriptions.push(reviewedSubscription);

      const commitShaSubscription =
        commitForm.controls.id.valueChanges.subscribe(commitSha => {
          this.onCommitShaChange(commitSha, commitForm);
        });
      this.commitShaSubscriptions.push(commitShaSubscription);

      this.focusCommitShaInput(this.commitForms().length - 1);
    }
  }

  public onRemoveCommitForm(index: number): void {
    this.commitForms.set([
      ...this.commitForms().slice(0, index),
      ...this.commitForms().slice(index + 1),
    ]);

    const [reviewedSubscription] = this.commitFormReviewedSubscriptions.splice(
      index,
      1,
    );
    reviewedSubscription.unsubscribe();

    const [commitShaSubscription] = this.commitShaSubscriptions.splice(
      index,
      1,
    );
    commitShaSubscription.unsubscribe();

    this.focusCommitShaInput(Math.min(index, this.commitForms().length - 1));
  }

  private onCommitReviewedChange(
    reviewed: boolean,
    commitForm: FormGroup<ReviewCommitForm>,
  ): void {
    const matchesDescription = commitForm.controls.matchesDescription;
    const summary = commitForm.controls.summary;

    if (reviewed) {
      matchesDescription.addValidators(Validators.required);
      summary.addValidators(Validators.required);
    } else {
      matchesDescription.removeValidators(Validators.required);
      summary.removeValidators(Validators.required);

      matchesDescription.reset();
      summary.reset();
    }

    matchesDescription.updateValueAndValidity();
    summary.updateValueAndValidity();
  }

  private onCommitShaChange(
    commitSha: string | null | undefined,
    commitForm: FormGroup<ReviewCommitForm>,
  ): void {
    if (!commitSha) {
      return;
    }

    const result = extractCommitSha(commitSha);

    if (!result) {
      return;
    }

    commitForm.controls.id.setValue(result, { emitEvent: false });
  }

  private focusCommitShaInput(index: number): void {
    setTimeout(() => {
      this.commitShaInputs()[index]?.nativeElement.focus();
    }, 0);
  }
}

interface ReviewCommitForm {
  id: FormControl<string | null>;
  reviewed: FormControl<0 | 1 | null>;
  matchesDescription: FormControl<0 | 1 | null>;
  summary: FormControl<string | null>;
  highlights: FormControl<string | null>;
}

const commitShaRegex = /[0-9a-f]{7,40}/;

function extractCommitSha(commitSha: string): string | null {
  return commitShaRegex.exec(commitSha)?.[0] ?? null;
}
