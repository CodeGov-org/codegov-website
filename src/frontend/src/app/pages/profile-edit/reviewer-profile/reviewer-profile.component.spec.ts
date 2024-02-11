import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole } from '~core/state';
import {} from '~core/state/profile/profile.service.mock';
import { ReviewerProfileComponent } from './reviewer-profile.component';

describe('ReviewerProfileComponent', () => {
  let component: ReviewerProfileComponent;
  let fixture: ComponentFixture<ReviewerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerProfileComponent);
    component = fixture.componentInstance;
    component.userProfile = {
      id: '1',
      role: UserRole.Reviewer,
      username: 'TestReviewer',
      proposalTypes: ['SCM'],
      neuronId: 10685924793606457081n,
      walletAddress: '123213123sdfsdfs',
      bio: 'bio',
      socialMedia: [],
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
