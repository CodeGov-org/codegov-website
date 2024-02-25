import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileService, SocialMediaType, UserRole } from '~core/state';
import { ProfileServiceMock } from '~core/state/profile/profile.service.mock';
import { ReviewerSocialMediaFormComponent } from './reviewer-social-media-form.component';

describe('ReviewerSocialMediaFormComponent', () => {
  let component: ReviewerSocialMediaFormComponent;
  let fixture: ComponentFixture<ReviewerSocialMediaFormComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerSocialMediaFormComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerSocialMediaFormComponent);
    component = fixture.componentInstance;
    component.userProfile = {
      id: '1',
      role: UserRole.Reviewer,
      username: 'TestReviewer',
      neuronId: 10685924793606457081n,
      walletAddress: '123213123sdfsdfs',
      bio: 'bio',
      socialMedia: [{ type: SocialMediaType.DSCVR, username: 'testLink' }],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
