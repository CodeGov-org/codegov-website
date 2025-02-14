import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole } from '~core/api';
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
    fixture.componentRef.setInput('userProfile', {
      id: '1',
      role: UserRole.Reviewer,
      username: 'TestReviewer',
      neuronId: 10685924793606457081n,
      walletAddress: '123213123sdfsdfs',
      bio: 'bio',
      socialMedia: [],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
