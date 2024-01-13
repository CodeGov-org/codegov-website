import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { keysOf } from '@core/utils';
import { socialMediaInputs } from './profile.model';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div><span>Role</span></div>
    <div><span>Proposal Types</span></div>
    <div><span>Neuron ID</span></div>

    <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
      <div>
        <label for="username">Username</label>
        <input id="username" type="text" formControlName="username" />
      </div>

      <div>
        <label for="bio">Bio</label>
        <input id="bio" type="text" formControlName="bio" />
      </div>

      <div>
        Social Media
        <div formGroupName="socialMedia">
          @for (key of socialMediaKeys; track key) {
            <div>
              <label [for]="key">{{ socialMediaInputs[key].label }}</label>
              <input [id]="key" type="text" [formControlName]="key" />
            </div>
          }
        </div>
      </div>

      <div>
        <a title="Cancel your edits" routerLink="/"> Cancel </a>
        <button type="submit">Save</button>
      </div>
    </form>
  `,
})
export class ProfileEditComponent {
  public readonly profileForm!: FormGroup;

  public readonly socialMediaKeys = keysOf(socialMediaInputs);
  public readonly socialMediaInputs = socialMediaInputs;

  constructor(formBuilder: FormBuilder) {
    this.profileForm = formBuilder.group({
      username: [''],
      bio: [''],
      socialMedia: formBuilder.group(this.generateSocialMedia()),
    });
  }

  public onSubmit(): void {
    throw new Error('Method not implemented.');
  }

  private generateSocialMedia(): Record<string, string[]> {
    return this.socialMediaKeys.reduce(
      (accum, value) => ({
        ...accum,
        [value]: [''],
      }),
      {},
    );
  }
}
