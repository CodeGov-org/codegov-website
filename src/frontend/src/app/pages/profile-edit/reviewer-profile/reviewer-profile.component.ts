import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

import { ReviewerPersonalInfoComponent } from '../reviewer-personal-info';
import { ReviewerPersonalInfoFormComponent } from '../reviewer-personal-info-form';
import { ReviewerSocialMediaComponent } from '../reviewer-social-media';
import { ReviewerSocialMediaFormComponent } from '../reviewer-social-media-form';
import { CardComponent } from '@cg/angular-ui';
import { InfoIconComponent } from '~core/icons';
import { ReviewerProfile } from '~core/state';
import {
  KeyColComponent,
  KeyValueGridComponent,
  TooltipDirective,
  ValueColComponent,
} from '~core/ui';

@Component({
  selector: 'app-reviewer-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    InfoIconComponent,
    TooltipDirective,
    CardComponent,
    KeyValueGridComponent,
    KeyColComponent,
    ValueColComponent,
    ReviewerPersonalInfoFormComponent,
    ReviewerPersonalInfoComponent,
    ReviewerSocialMediaFormComponent,
    ReviewerSocialMediaComponent,
  ],
  styles: [
    `
      @import '@cg/styles/common';

      .reviewer-profile-card,
      .reviewer-personal-info-card {
        margin-bottom: size(3);

        @include sm {
          margin-bottom: size(4);
        }
      }
    `,
  ],
  template: `
    <cg-card class="reviewer-profile-card">
      <h2 class="h3" slot="cardTitle">Profile</h2>

      <app-key-value-grid slot="cardContent">
        <app-key-col id="reviewer-id">ID</app-key-col>
        <app-value-col aria-labelledby="reviewer-id">
          {{ userProfile().id }}
        </app-value-col>

        <app-key-col id="reviewer-role">Role</app-key-col>
        <app-value-col
          aria-labelledby="reviewer-role"
          aria-describedby="reviewer-role-description"
        >
          {{ userProfile().role }}

          <app-info-icon
            aria-hidden="true"
            [appTooltip]="nonEditableInfo()"
          ></app-info-icon>
        </app-value-col>
        <div id="reviewer-role-description" role="tooltip" class="sr-only">
          {{ nonEditableInfo() }}
        </div>

        <app-key-col id="reviewer-neuron-id">Neuron ID</app-key-col>
        <app-value-col
          aria-labelledby="reviewer-neuron-id"
          aria-describedby="reviewer-neuron-id-description"
        >
          <a
            [href]="
              'https://dashboard.internetcomputer.org/neuron/' +
              userProfile().neuronId
            "
            target="_blank"
            rel="nofollow noreferrer"
          >
            {{ userProfile().neuronId }}
          </a>

          <app-info-icon
            aria-hidden="true"
            [appTooltip]="nonEditableInfo()"
          ></app-info-icon>
        </app-value-col>
        <div id="reviewer-neuron-id-description" role="tooltip" class="sr-only">
          {{ nonEditableInfo() }}
        </div>
      </app-key-value-grid>
    </cg-card>

    <cg-card class="reviewer-personal-info-card">
      <h2 class="h3" slot="cardTitle">Personal info</h2>

      <div slot="cardContent">
        @if (isPersonalInfoEditable()) {
          <app-reviewer-personal-info-form
            [userProfile]="userProfile()"
            (formClose)="hidePersonalInfoForm()"
          />
        } @else {
          <app-reviewer-personal-info
            [userProfile]="userProfile()"
            (edit)="showPersonalInfoForm()"
          />
        }
      </div>
    </cg-card>

    <cg-card>
      <h2 class="h3" slot="cardTitle">Social media</h2>

      <div slot="cardContent">
        @if (isSocialMediaEditable()) {
          <app-reviewer-social-media-form
            [userProfile]="userProfile()"
            (formClose)="hideSocialMediaForm()"
          />
        } @else {
          <app-reviewer-social-media
            [userProfile]="userProfile()"
            (edit)="showSocialMediaForm()"
          />
        }
      </div>
    </cg-card>
  `,
})
export class ReviewerProfileComponent {
  public readonly userProfile = input.required<ReviewerProfile>();
  public readonly isPersonalInfoEditable = signal(false);
  public readonly isSocialMediaEditable = signal(false);

  public readonly nonEditableInfo = signal(
    'To change this property, contact a CodeGov admin.',
  );

  public showPersonalInfoForm(): void {
    this.isPersonalInfoEditable.set(true);
  }

  public hidePersonalInfoForm(): void {
    this.isPersonalInfoEditable.set(false);
  }

  public showSocialMediaForm(): void {
    this.isSocialMediaEditable.set(true);
  }

  public hideSocialMediaForm(): void {
    this.isSocialMediaEditable.set(false);
  }
}
