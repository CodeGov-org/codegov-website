import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole, SocialMediaLinkType } from '~core/api';
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
    fixture.componentRef.setInput('userProfile', {
      id: '1',
      role: UserRole.Reviewer,
      username: 'TestReviewer',
      neuronId: 10685924793606457081n,
      walletAddress: '123213123sdfsdfs',
      bio: 'bio',
      socialMedia: [{ type: SocialMediaLinkType.DSCVR, username: 'testLink' }],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
