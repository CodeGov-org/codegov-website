import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { ReviewerProfile } from '~core/state';

@Component({
  selector: 'app-reviewer-personal-info-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4 flex flex-col md:flex-row md:items-center">
      <span class="font-bold md:w-1/3">Username</span>
      <span>{{ userProfile.username }}</span>
    </div>

    <div class="mb-4 flex flex-col md:flex-row md:items-center">
      <span class="font-bold md:w-1/3">Bio</span>
      <span>{{ userProfile.bio }}</span>
    </div>

    <div class="mb-4 flex flex-col md:flex-row md:items-center">
      <span class="font-bold md:w-1/3">Wallet Address</span>
      <span class="break-all md:w-2/3">{{ userProfile.walletAddress }}</span>
    </div>

    <div class="flex items-center">
      <button type="button" class="btn ml-auto" (click)="editForm()">
        Edit
      </button>
    </div>
  `,
})
export class ReviewerPersonalInfoViewComponent {
  @Input({ required: true })
  public userProfile!: ReviewerProfile;

  @Output()
  public formEdit = new EventEmitter<void>();

  public editForm(): void {
    this.formEdit.emit();
  }
}
