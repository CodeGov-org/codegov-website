import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileService, UserRole, SocialMediaType } from '~core/state';
import { ProfileServiceMock } from '~core/state/profile/profile.service.mock';
import { ReviewerPersonalInfoEditComponent } from './reviewer-personal-info-edit.component';

describe('ReviewerPersonalInfoEditComponent', () => {
  let component: ReviewerPersonalInfoEditComponent;
  let fixture: ComponentFixture<ReviewerPersonalInfoEditComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewerPersonalInfoEditComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerPersonalInfoEditComponent);
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
