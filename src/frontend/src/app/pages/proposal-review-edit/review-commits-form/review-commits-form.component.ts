import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  viewChildren,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';

import { CardComponent, RadioInputComponent } from '@cg/angular-ui';
import { ReviewCommitDetails } from '~core/api';
import { ReviewSubmissionService } from '~core/state';
import {
  FormFieldComponent,
  InputDirective,
  InputErrorComponent,
  InputHintComponent,
  KeyColComponent,
  KeyValueGridComponent,
  ValueColComponent,
} from '~core/ui';
import { boolToRadio, isNil, radioToBool, toSyncSignal } from '~core/utils';

@Component({
  selector: 'app-review-commits-form',
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @use '@cg/styles/common';

      .commit-review-card {
        margin-bottom: common.size(4);
      }
    `,
  ],
  template: `
    @for (commit of commits(); track commit.uiId; let i = $index) {
      <ng-container [formGroup]="commitForms()[i]">
        <cg-card class="commit-review-card">
          <div slot="cardContent">
            <app-key-value-grid>
              <app-key-col>
                <label appLabel [for]="'commitSha-' + i">Commit hash</label>
              </app-key-col>
              <app-value-col>
                <app-form-field>
                  <input
                    appInput
                    [id]="'commitSha-' + i"
                    formControlName="commitSha"
                    autocomplete="off"
                    #commitShaInput
                  />

                  <app-input-error key="required">
                    Commit hash cannot be empty.
                  </app-input-error>

                  <app-input-error key="pattern">
                    Please enter a valid commit hash.
                  </app-input-error>

                  <app-input-error key="uniqueSha">
                    Another commit entry already has this hash.
                  </app-input-error>

                  <app-input-hint>
                    @if (commitForms()[i].controls.commitSha.value) {
                      <a
                        class="truncate"
                        [href]="
                          'https://github.com/dfinity/ic/commit/' +
                          commitForms()[i].controls.commitSha.value
                        "
                        target="_blank"
                        rel="nofollow noreferrer"
                      >
                        https://github.com/dfinity/ic/commit/{{
                          commitForms()[i].controls.commitSha.value
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
                <ng-container
                  *ngIf="commitForms()[i].controls.reviewed.value === 1"
                >
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
                    <label appLabel [for]="'comment-' + i">Summary</label>
                  </app-key-col>
                  <app-value-col>
                    <app-form-field>
                      <textarea
                        appInput
                        [id]="'comment-' + i"
                        formControlName="comment"
                        autocomplete="off"
                      ></textarea>

                      <app-input-error key="required">
                        Summary cannot be empty.
                      </app-input-error>
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
})
export class ReviewCommitsFormComponent implements OnDestroy {
  private readonly reviewSubmissionService = inject(ReviewSubmissionService);

  public readonly commits = toSyncSignal(this.reviewSubmissionService.commits$);
  public readonly commitForms = computed(() => {
    const commits = this.commits() ?? [];

    return commits.map((commit, index) => {
      const commitForm = this.createCommitForm(index);
      commitForm.setValue(
        commitToFormValue(commit.commit.commitSha, commit.commit.details),
      );
      return commitForm;
    });
  });

  private readonly commitShaInputs =
    viewChildren<ElementRef<HTMLInputElement>>('commitShaInput');

  private formSubscription = new Subscription();

  constructor() {
    effect(() => {
      const commitForms = this.commitForms();

      this.formSubscription.unsubscribe();
      this.formSubscription = new Subscription();

      commitForms.forEach((commitForm, index) => {
        this.formSubscription.add(
          commitForm.valueChanges.subscribe(value => {
            this.onFormValueChange(value, index, commitForm);
          }),
        );
      });
    });
  }

  public ngOnDestroy(): void {
    this.formSubscription.unsubscribe();
  }

  // [TODO] - convert to signal
  public canAddCommitForm(): boolean {
    return this.commitForms().every(form => form.valid);
  }

  public onAddCommitForm(): void {
    if (!this.canAddCommitForm()) {
      return;
    }

    this.reviewSubmissionService.addCommit();

    const commits = this.commits();
    if (isNil(commits)) {
      return;
    }

    setTimeout(() => {
      this.focusCommitForm(this.commitShaInputs().length - 1);
    });
  }

  public onRemoveCommitForm(index: number): void {
    const commits = this.commits();
    if (isNil(commits)) {
      return;
    }

    const commitSha = commits[index]?.commit.commitSha;

    this.reviewSubmissionService.removeCommit(commitSha);

    setTimeout(() => {
      this.focusCommitForm(Math.min(index, this.commitShaInputs().length - 1));
    });
  }

  private onFormValueChange(
    value: Partial<ReviewCommitFormValue>,
    index: number,
    commitForm: FormGroup<ReviewCommitForm>,
  ): void {
    const commits = this.commits();
    if (isNil(commits)) {
      return;
    }

    const commit = commits[index];

    const reviewed = radioToBool(value.reviewed);
    if (reviewed !== commit.commit.details.reviewed) {
      this.onCommitReviewedChange(reviewed, commitForm);
    }

    if (value.commitSha !== commit.commit.commitSha) {
      this.onCommitShaChange(value.commitSha, commitForm);
    }

    if (commitForm.valid) {
      this.reviewSubmissionService.updateCommit(
        commit.commit.commitSha ? commit.commit.commitSha : null,
        value.commitSha ? value.commitSha : null,
        commitFromFormValue(value),
      );
    }
  }

  private onCommitReviewedChange(
    reviewed: boolean | null,
    commitForm: FormGroup<ReviewCommitForm>,
  ): void {
    const matchesDescription = commitForm.controls.matchesDescription;
    const summary = commitForm.controls.comment;

    if (reviewed) {
      matchesDescription.addValidators(Validators.required);
      summary.addValidators(Validators.required);
    } else {
      matchesDescription.removeValidators(Validators.required);
      summary.removeValidators(Validators.required);

      matchesDescription.reset(null, { emitEvent: false });
      summary.reset(null, { emitEvent: false });
    }

    matchesDescription.updateValueAndValidity({ emitEvent: false });
    summary.updateValueAndValidity({ emitEvent: false });
  }

  private onCommitShaChange(
    commitSha: string | null | undefined,
    commitForm: FormGroup<ReviewCommitForm>,
  ): void {
    if (isNil(commitSha)) {
      return;
    }

    const result = extractCommitSha(commitSha);
    if (isNil(result)) {
      return;
    }

    commitForm.controls.commitSha.setValue(result, { emitEvent: false });
  }

  private focusCommitForm(index: number): void {
    this.commitShaInputs()[index]?.nativeElement.focus();
  }

  private createCommitForm(index: number): FormGroup<ReviewCommitForm> {
    return new FormGroup<ReviewCommitForm>({
      commitSha: new FormControl(null, {
        validators: [
          Validators.required,
          Validators.pattern(commitShaRegex),
          this.uniqueCommitShaValidator(index),
        ],
      }),
      reviewed: new FormControl(null, {
        validators: [Validators.required],
      }),
      matchesDescription: new FormControl(null),
      comment: new FormControl(null),
    });
  }

  private uniqueCommitShaValidator(index: number): ValidatorFn {
    return (control: AbstractControl<string>) => {
      const commits = this.commits();
      if (isNil(commits)) {
        return null;
      }

      const commitSha = extractCommitSha(control.value);
      if (isNil(commitSha)) {
        return null;
      }

      const existingCommit = commits.find(
        (commit, i) => i !== index && commit.commit.commitSha === commitSha,
      );

      return existingCommit ? { uniqueSha: true } : null;
    };
  }
}

interface ReviewCommitFormValue {
  commitSha: string | null;
  reviewed: 0 | 1 | null;
  matchesDescription: 0 | 1 | null;
  comment: string | null;
}

interface ReviewCommitForm {
  commitSha: FormControl<string | null>;
  reviewed: FormControl<0 | 1 | null>;
  matchesDescription: FormControl<0 | 1 | null>;
  comment: FormControl<string | null>;
}

const commitShaRegex = /[0-9a-f]{7,40}/;

function extractCommitSha(commitSha: string): string | null {
  return commitShaRegex.exec(commitSha)?.[0] ?? null;
}

function commitToFormValue(
  commitSha: string | null,
  commit: ReviewCommitDetails,
): ReviewCommitFormValue {
  const reviewed = boolToRadio(commit.reviewed);

  let matchesDescription = null;
  let comment = null;

  if (commit.reviewed) {
    matchesDescription = boolToRadio(commit.matchesDescription);
    comment = commit.comment;
  }

  return {
    commitSha: commitSha,
    matchesDescription,
    reviewed,
    comment,
  };
}

function commitFromFormValue(
  formValue: Partial<ReviewCommitFormValue>,
): ReviewCommitDetails {
  const reviewed = radioToBool(formValue.reviewed);

  if (reviewed) {
    return {
      matchesDescription: radioToBool(formValue.matchesDescription),
      reviewed: true,
      comment: formValue.comment ?? null,
      highlights: [],
    };
  }

  return { reviewed };
}
