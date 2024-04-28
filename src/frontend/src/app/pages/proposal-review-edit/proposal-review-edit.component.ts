import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  effect,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, filter, map } from 'rxjs';

import {
  CardComponent,
  RadioInputComponent,
  ImageUploaderBtnComponent,
  ImageSet,
} from '@cg/angular-ui';
import { ProposalService, ProposalState } from '~core/state';
import {
  FormFieldComponent,
  InputDirective,
  InputErrorComponent,
  InputHintComponent,
  KeyColComponent,
  KeyValueGridComponent,
  LabelDirective,
  ValueColComponent,
} from '~core/ui';
import { isNil } from '~core/utils';

interface ReviewForm {
  timeSpent: FormControl<number | null>;
  summary: FormControl<string | null>;
  buildReproduced: FormControl<boolean | null>;
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

@Component({
  selector: 'app-proposal-review-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    LabelDirective,
    FormFieldComponent,
    InputDirective,
    InputErrorComponent,
    InputHintComponent,
    RadioInputComponent,
    ImageUploaderBtnComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import '@cg/styles/common';

      :host {
        @include page-content;
      }

      .proposal-overview-card {
        margin-bottom: size(4);
      }

      .commit-review-card {
        &:not(:first-child) {
          margin-bottom: size(4);
        }
      }

      .review-card {
        margin-top: size(6);
      }
    `,
  ],
  template: `
    @if (currentProposal(); as proposal) {
      <h1 class="h1">
        Submit review for proposal {{ proposal.ns_proposal_id }}
      </h1>

      <cg-card class="proposal-overview-card">
        <h2 class="h3" slot="cardTitle">{{ proposal.title }}</h2>
      </cg-card>

      <h2 class="h3">Commits</h2>
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
                        Enter a short or long commit hash/id/sha, or a GitHub
                        URL to the commit.
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
                    *ngIf="commitForm.controls.reviewed.value === 1"
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
                      <label appLabel [for]="'highlights-' + i">
                        Highlights
                      </label>
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
                <button
                  class="btn btn--outline"
                  (click)="onRemoveCommitForm(i)"
                >
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

      <cg-card class="review-card">
        <h2 class="h3" slot="cardTitle">Review details</h2>

        <div slot="cardContent">
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
        </div>
      </cg-card>
    }
  `,
})
export class ProposalReviewEditComponent implements OnInit {
  public readonly reviewForm = signal(
    new FormGroup<ReviewForm>({
      timeSpent: new FormControl(null),
      summary: new FormControl(null),
      buildReproduced: new FormControl(null),
    }),
  );

  public readonly commitForms = signal<Array<FormGroup<ReviewCommitForm>>>([]);

  public selectedImages = signal<ImageSet[]>([]);

  public readonly currentProposal = toSignal(
    this.proposalService.currentProposal$,
  );

  public readonly commitShaInputs =
    viewChildren<ElementRef<HTMLInputElement>>('commitShaInput');

  private readonly proposalIdFromRoute$ = this.route.params.pipe(
    map(params => {
      try {
        return params['id'];
      } catch (error) {
        return null;
      }
    }),
    filter(Boolean),
  );

  private readonly commitFormReviewedSubscriptions: Subscription[] = [];
  private readonly commitShaSubscriptions: Subscription[] = [];

  constructor(
    private readonly proposalService: ProposalService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.proposalIdFromRoute$
      .pipe(takeUntilDestroyed())
      .subscribe(proposalId => {
        this.proposalService.setCurrentProposalId(proposalId);
      });

    effect(() => {
      const proposal = this.currentProposal();
      if (isNil(proposal)) {
        return;
      }

      if (proposal.state === ProposalState.Completed) {
        this.router.navigate(['review', 'view', { id: proposal.id }]);
      }
    });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposalList(ProposalState.InProgress);
  }

  public onImagesSelected(images: ImageSet[]): void {
    this.selectedImages.set(images);
  }

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
