import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Profile, SocialMediaType, UpdatableProfile } from './profile.model';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private userProfileSubject = new BehaviorSubject<Profile | null>(null);
  public userProfile$ = this.userProfileSubject.asObservable();

  public loadProfile(): void {
    this.userProfileSubject.next({
      role: 'Reviewer',
      proposalTypes: ['SCM', 'RCM'],
      username: 'TextReviewer',
      neuronId: 'XXXXXX',
      bio: 'bio text',
      socialMedia: [{ type: SocialMediaType.DSCVR, link: 'DSCVRUsername' }],
    });
  }

  public saveProfile(updatedProfile: UpdatableProfile): void {
    const currentProfile = this.userProfileSubject.getValue();

    this.userProfileSubject.next({
      ...updatedProfile,
      role: currentProfile?.role ?? '',
      proposalTypes: currentProfile?.proposalTypes ?? [],
      neuronId: currentProfile?.neuronId ?? '',
    });
  }
}
