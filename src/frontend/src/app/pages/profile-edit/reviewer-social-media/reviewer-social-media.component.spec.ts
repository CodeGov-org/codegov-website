import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole, SocialMediaType } from '~core/state';
import { ReviewerSocialMediaComponent } from './reviewer-social-media.component';

describe('ReviewerSocialMediaComponent', () => {
  let component: ReviewerSocialMediaComponent;
  let fixture: ComponentFixture<ReviewerSocialMediaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerSocialMediaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerSocialMediaComponent);
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
