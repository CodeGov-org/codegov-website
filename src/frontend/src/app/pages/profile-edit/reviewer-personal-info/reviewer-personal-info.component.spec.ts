import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialMediaType, UserRole } from '~core/state';
import { ReviewerPersonalInfoComponent } from './reviewer-personal-info.component';

describe('ReviewerPersonalInfoComponent', () => {
  let component: ReviewerPersonalInfoComponent;
  let fixture: ComponentFixture<ReviewerPersonalInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerPersonalInfoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerPersonalInfoComponent);
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
