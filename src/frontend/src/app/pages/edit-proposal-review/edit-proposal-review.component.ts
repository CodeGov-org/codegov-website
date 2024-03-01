import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { ProposalService, ProposalState } from '~core/state';
import {
  CardComponent,
  FormFieldComponent,
  InputDirective,
  InputErrorComponent,
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

@Component({
  selector: 'app-edit-proposal-review',
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

      <app-card class="proposal-overview-card">
        <h2 class="h3" cardTitle>{{ proposal.title }}</h2>
      </app-card>

      <h3 class="h4 commits-heading">Commits</h3>
      @for (commitForm of commitForms; track i; let i = $index) {
        <ng-container [formGroup]="commitForm">
          <app-card class="commit-review-card">
            <app-key-value-grid>
              <app-key-col>
                <label appLabel [for]="'id-' + i">Commit hash (Id)</label>
              </app-key-col>
              <app-value-col>
                <app-form-field>
                  <input appInput [id]="'id-' + i" formControlName="id" />

                  <app-input-error key="required">
                    Commit hash (Id) cannot be empty
                  </app-input-error>
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
                      value="true"
                      type="radio"
                      formControlName="reviewed"
                    />
                    <label appLabel [for]="'reviewed-yes-' + i">Yes</label>

                    <input
                      appInput
                      [id]="'reviewed-no-' + i"
                      value="false"
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
            </app-key-value-grid>

            <div class="btn-group">
              <button class="btn btn--outline" (click)="removeCommitForm(i)">
                Remove
              </button>
            </div>
          </app-card>
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
export class EditProposalReviewComponent implements OnInit {
  public readonly reviewForm: FormGroup<ReviewForm>;
  public readonly commitForms: Array<FormGroup<ReviewCommitForm>> = [];

  public readonly currentProposal$ = this.proposalService.currentProposal$;

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
    this.proposalService.loadOpenProposalList();
  }

  public canAddCommitForm(): boolean {
    return this.commitForms.every(form => form.valid);
  }

  public addCommitForm(): void {
    if (this.canAddCommitForm()) {
      this.commitForms.push(
        new FormGroup<ReviewCommitForm>({
          id: new FormControl(null, {
            validators: [Validators.required],
          }),
          reviewed: new FormControl(null, {
            validators: [Validators.required],
          }),
          // [TODO]: required if `reviewed` is true
          matchesDescription: new FormControl(null),
          // [TODO]: required if `reviewed` is true
          summary: new FormControl(null),
          highlights: new FormControl(null),
        }),
      );
    }
  }

  public removeCommitForm(index: number): void {
    this.commitForms.splice(index, 1);
  }
}
