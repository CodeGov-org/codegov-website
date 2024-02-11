import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialMediaType, UserRole } from '~core/state';
import { ReviewerPersonalInfoViewComponent } from './reviewer-personal-info-view.component';

describe('ReviewerPersonalInfoViewComponent', () => {
  let component: ReviewerPersonalInfoViewComponent;
  let fixture: ComponentFixture<ReviewerPersonalInfoViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerPersonalInfoViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerPersonalInfoViewComponent);
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
