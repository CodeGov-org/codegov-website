import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, filter, map } from 'rxjs';

import { CardComponent } from '@cg/angular-ui';
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
import { isNotNil } from '~core/utils';

interface ReviewForm {
  timeSpent: FormControl<number | null>;
  summary: FormControl<string | null>;
  buildReproduced: FormControl<boolean | null>;
}

interface ReviewCommitForm {
  id: FormControl<string | null>;
  reviewed: FormControl<boolean | null>;
  matchesDescription: FormControl<boolean | null>;
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
    `,
  ],
  template: `
    @if (currentProposal$ | async; as proposal) {
      <h1 class="h1">Submit review for proposal {{ proposal.id }}</h1>

      <cg-card class="proposal-overview-card">
        <h2 class="h3" slot="cardTitle">{{ proposal.title }}</h2>
      </cg-card>

      <h3 class="h4 commits-heading">Commits</h3>
      @for (commitForm of commitForms; track i; let i = $index) {
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
                      <input
                        appInput
                        [id]="'reviewed-yes-' + i"
                        [attr.name]="'reviewed-' + i"
                        [value]="true"
                        type="radio"
                        formControlName="reviewed"
                      />
                      <label appLabel [for]="'reviewed-yes-' + i">Yes</label>

                      <input
                        appInput
                        [id]="'reviewed-no-' + i"
                        [attr.name]="'reviewed-' + i"
                        [value]="false"
                        type="radio"
                        formControlName="reviewed"
                      />
                      <label appLabel [for]="'reviewed-no-' + i">No</label>
                    </div>

                    <app-input-error key="required">
                      Did you review the commit?
                    </app-input-error>
                  </app-form-field>
                </app-value-col>

                <ng-container>
                  <ng-container
                    *ngIf="commitForm.controls.reviewed.value === true"
                  >
                    <app-key-col>
                      <div>Matches description</div>
                    </app-key-col>
                    <app-value-col>
                      <app-form-field>
                        <div class="radio-group">
                          <input
                            appInput
                            [id]="'matches-description-yes-' + i"
                            [attr.name]="'matches-description-' + i"
                            [value]="true"
                            type="radio"
                            formControlName="matchesDescription"
                          />
                          <label
                            appLabel
                            [for]="'matches-description-yes-' + i"
                          >
                            Yes
                          </label>

                          <input
                            appInput
                            [id]="'matches-description-no-' + i"
                            [attr.name]="'matches-description-' + i"
                            [value]="false"
                            type="radio"
                            formControlName="matchesDescription"
                          />
                          <label appLabel [for]="'matches-description-no-' + i">
                            No
                          </label>
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
                <button class="btn btn--outline" (click)="removeCommitForm(i)">
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
          (click)="addCommitForm()"
          [disabled]="!canAddCommitForm()"
        >
          Add commit
        </button>
      </div>
    }
  `,
})
export class ProposalReviewEditComponent implements OnInit {
  public readonly reviewForm: FormGroup<ReviewForm>;
  public readonly commitForms: Array<FormGroup<ReviewCommitForm>> = [];
  public readonly commitFormReviewedSubscriptions: Subscription[] = [];
  public readonly commitShaSubscriptions: Subscription[] = [];

  public readonly currentProposal$ = this.proposalService.currentProposal$;

  @ViewChildren('commitShaInput')
  public readonly commitShaInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private readonly proposalIdFromRoute$ = this.route.params.pipe(
    map(params => {
      try {
        return BigInt(params['id']);
      } catch (error) {
        return null;
      }
    }),
    filter(Boolean),
  );

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

    this.currentProposal$
      .pipe(takeUntilDestroyed(), filter(isNotNil))
      .subscribe(proposal => {
        if (proposal.state === ProposalState.Completed) {
          this.router.navigate(['review', 'view', { id: proposal.id }]);
        }
      });

    this.reviewForm = new FormGroup<ReviewForm>({
      timeSpent: new FormControl(null),
      summary: new FormControl(null),
      buildReproduced: new FormControl(null),
    });
  }

  public ngOnInit(): void {
    this.proposalService.loadProposalList(ProposalState.InProgress);
  }

  public canAddCommitForm(): boolean {
    return this.commitForms.every(form => form.valid);
  }

  public addCommitForm(): void {
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

      this.commitForms.push(commitForm);

      const reviewedSubscription =
        commitForm.controls.reviewed.valueChanges.subscribe(reviewed => {
          this.onCommitReviewedChange(reviewed, commitForm);
        });
      this.commitFormReviewedSubscriptions.push(reviewedSubscription);

      const commitShaSubscription =
        commitForm.controls.id.valueChanges.subscribe(commitSha => {
          this.onCommitShaChange(commitSha, commitForm);
        });
      this.commitShaSubscriptions.push(commitShaSubscription);

      this.focusCommitShaInput(this.commitForms.length - 1);
    }
  }

  public removeCommitForm(index: number): void {
    this.commitForms.splice(index, 1);

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

    this.focusCommitShaInput(Math.min(index, this.commitForms.length - 1));
  }

  private onCommitReviewedChange(
    reviewed: boolean | null | undefined,
    commitForm: FormGroup<ReviewCommitForm>,
  ): void {
    const matchesDescription = commitForm.controls.matchesDescription;
    const summary = commitForm.controls.summary;

    if (reviewed === true) {
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
      this.commitShaInputs.get(index)?.nativeElement.focus();
    }, 0);
  }
}
