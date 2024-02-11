import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileService, SocialMediaType, UserRole } from '~core/state';
import { ProfileServiceMock } from '~core/state/profile/profile.service.mock';
import { ReviewerSocialMediaEditComponent } from './reviewer-social-media-edit.component';

describe('ReviewerSocialMediaEditComponent', () => {
  let component: ReviewerSocialMediaEditComponent;
  let fixture: ComponentFixture<ReviewerSocialMediaEditComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerSocialMediaEditComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerSocialMediaEditComponent);
    component = fixture.componentInstance;
    component.userProfile = {
      id: '1',
      role: UserRole.Reviewer,
      username: 'TestReviewer',
      proposalTypes: ['SCM'],
      neuronId: 10685924793606457081n,
      walletAddress: '123213123sdfsdfs',
      bio: 'bio',
      socialMedia: [{ type: SocialMediaType.DSCVR, link: 'testLink' }],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
