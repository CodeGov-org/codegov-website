import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserRole, SocialMediaLinkType } from '~core/api';
import { ProfileService } from '~core/state';
import { ProfileServiceMock } from '~core/state/profile/profile.service.mock';
import { ReviewerPersonalInfoFormComponent } from './reviewer-personal-info-form.component';

describe('ReviewerPersonalInfoFormComponent', () => {
  let component: ReviewerPersonalInfoFormComponent;
  let fixture: ComponentFixture<ReviewerPersonalInfoFormComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerPersonalInfoFormComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerPersonalInfoFormComponent);
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
