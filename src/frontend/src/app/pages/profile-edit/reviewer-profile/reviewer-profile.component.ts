import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ReviewerPersonalInfoEditComponent } from '../reviewer-personal-info-edit';
import { ReviewerPersonalInfoViewComponent } from '../reviewer-personal-info-view';
import { ReviewerSocialMediaEditComponent } from '../reviewer-social-media-edit';
import { ReviewerSocialMediaViewComponent } from '../reviewer-social-media-view';
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
    ReviewerPersonalInfoEditComponent,
    ReviewerPersonalInfoViewComponent,
    ReviewerSocialMediaEditComponent,
    ReviewerSocialMediaViewComponent,
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
        <app-reviewer-personal-info-edit
          [userProfile]="userProfile"
          (formSave)="stopEditingPersonalInfo()"
        />
      } @else {
        <app-reviewer-personal-info-view
          [userProfile]="userProfile"
          (formEdit)="editPersonalInfo()"
        />
      }
    </div>

    <div class="py-6">
      <h2 class="mb-4">Social Media</h2>
      @if (isSocialMediaEditable) {
        <app-reviewer-social-media-edit
          [userProfile]="userProfile"
          (formSave)="stopEditingSocialMedia()"
        />
      } @else {
        <app-reviewer-social-media-view
          [userProfile]="userProfile"
          (formEdit)="editSocialMedia()"
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

  public editPersonalInfo(): void {
    this.isPersonalInfoEditable = true;
  }

  public stopEditingPersonalInfo(): void {
    this.isPersonalInfoEditable = false;
  }

  public editSocialMedia(): void {
    this.isSocialMediaEditable = true;
  }

  public stopEditingSocialMedia(): void {
    this.isSocialMediaEditable = false;
  }
}
