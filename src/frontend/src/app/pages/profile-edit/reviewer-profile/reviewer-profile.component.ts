import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ReviewerPersonalInfoComponent } from '../reviewer-personal-info';
import { ReviewerPersonalInfoFormComponent } from '../reviewer-personal-info-form';
import { ReviewerSocialMediaComponent } from '../reviewer-social-media';
import { ReviewerSocialMediaFormComponent } from '../reviewer-social-media-form';
import { InfoIconComponent } from '~core/icons';
import { ReviewerProfile } from '~core/state';
import { TooltipDirective } from '~core/ui';

@Component({
  selector: 'app-reviewer-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    InfoIconComponent,
    TooltipDirective,
    ReviewerPersonalInfoFormComponent,
    ReviewerPersonalInfoComponent,
    ReviewerSocialMediaFormComponent,
    ReviewerSocialMediaComponent,
  ],
  template: `
    <div class="mb-4 flex flex-col md:flex-row md:items-center">
      <span class="font-bold md:w-1/3">ID</span>
      <span>{{ userProfile.id }}</span>
    </div>

    <div class="mb-4 flex flex-col md:flex-row md:items-center">
      <span class="font-bold md:w-1/3">Role</span>
      <div class="flex flex-row items-center">
        <span>{{ userProfile.role }}</span>
        <app-info-icon [appTooltip]="nonEditableInfo"></app-info-icon>
      </div>
    </div>

    <div class="mb-4 flex flex-col md:flex-row md:items-center">
      <span class="font-bold md:w-1/3">Proposal Types</span>
      <div class="flex flex-row items-center">
        <span>{{ userProfile.proposalTypes.join(', ') }}</span>
        <app-info-icon [appTooltip]="nonEditableInfo"></app-info-icon>
      </div>
    </div>

    <div class="mb-4 flex flex-col md:flex-row md:items-center">
      <span class="h-6 font-bold md:w-1/3">Neuron ID</span>
      <div class="flex flex-row items-center">
        <span>{{ userProfile.neuronId }}</span>
        <app-info-icon [appTooltip]="nonEditableInfo"></app-info-icon>
      </div>
    </div>

    <div class="py-6">
      <h2 class="mb-4">Personal Info</h2>
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
    </div>

    <div class="py-6">
      <h2 class="mb-4">Social Media</h2>
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
    </div>
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
