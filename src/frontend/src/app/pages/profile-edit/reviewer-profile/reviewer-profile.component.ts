import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ReviewerPersonalInfoComponent } from '../reviewer-personal-info';
import { ReviewerPersonalInfoFormComponent } from '../reviewer-personal-info-form';
import { ReviewerSocialMediaComponent } from '../reviewer-social-media';
import { ReviewerSocialMediaFormComponent } from '../reviewer-social-media-form';
import { InfoIconComponent } from '~core/icons';
import { ReviewerProfile } from '~core/state';
import {
  CardComponent,
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
    <app-card class="reviewer-profile-card">
      <h2 class="h3" cardTitle>Profile</h2>

      <app-key-value-grid>
        <app-key-col id="reviewer-id">ID</app-key-col>
        <app-value-col aria-labelledby="reviewer-id">
          {{ userProfile.id }}
        </app-value-col>

        <app-key-col id="reviewer-role">Role</app-key-col>
        <app-value-col
          aria-labelledby="reviewer-role"
          aria-describedby="reviewer-role-description"
        >
          {{ userProfile.role }}

          <app-info-icon
            aria-hidden="true"
            [appTooltip]="nonEditableInfo"
          ></app-info-icon>
        </app-value-col>
        <div id="reviewer-role-description" role="tooltip" class="sr-only">
          {{ nonEditableInfo }}
        </div>

        <app-key-col id="reviewer-neuron-id">Neuron ID</app-key-col>
        <app-value-col
          aria-labelledby="reviewer-neuron-id"
          aria-describedby="reviewer-neuron-id-description"
        >
          <a
            [href]="
              'https://dashboard.internetcomputer.org/neuron/' +
              userProfile.neuronId
            "
            target="_blank"
            rel="nofollow noreferrer"
          >
            {{ userProfile.neuronId }}
          </a>

          <app-info-icon
            aria-hidden="true"
            [appTooltip]="nonEditableInfo"
          ></app-info-icon>
        </app-value-col>
        <div id="reviewer-neuron-id-description" role="tooltip" class="sr-only">
          {{ nonEditableInfo }}
        </div>
      </app-key-value-grid>
    </app-card>

    <app-card class="reviewer-personal-info-card">
      <h2 class="h3" cardTitle>Personal info</h2>

      @if (isPersonalInfoEditable) {
        <app-reviewer-personal-info-form
          [userProfile]="userProfile"
          (formClose)="hidePersonalInfoForm()"
        />
      } @else {
        <app-reviewer-personal-info
          [userProfile]="userProfile"
          (edit)="showPersonalInfoForm()"
        />
      }
    </app-card>

    <app-card>
      <h2 class="h3" cardTitle>Social media</h2>

      @if (isSocialMediaEditable) {
        <app-reviewer-social-media-form
          [userProfile]="userProfile"
          (formClose)="hideSocialMediaForm()"
        />
      } @else {
        <app-reviewer-social-media
          [userProfile]="userProfile"
          (edit)="showSocialMediaForm()"
        />
      }
    </app-card>
  `,
})
export class ReviewerProfileComponent {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  public isPersonalInfoEditable = false;
  public isSocialMediaEditable = false;

  public readonly nonEditableInfo: string =
    'To change this property, contact a CodeGov admin.';

  public showPersonalInfoForm(): void {
    this.isPersonalInfoEditable = true;
  }

  public hidePersonalInfoForm(): void {
    this.isPersonalInfoEditable = false;
  }

  public showSocialMediaForm(): void {
    this.isSocialMediaEditable = true;
  }

  public hideSocialMediaForm(): void {
    this.isSocialMediaEditable = false;
  }
}
