import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole, SocialMediaType } from '~core/state';
import { ReviewerSocialMediaViewComponent } from './reviewer-social-media-view.component';

describe('ReviewerSocialMediaViewComponent', () => {
  let component: ReviewerSocialMediaViewComponent;
  let fixture: ComponentFixture<ReviewerSocialMediaViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerSocialMediaViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerSocialMediaViewComponent);
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
