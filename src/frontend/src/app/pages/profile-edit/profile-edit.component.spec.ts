import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of } from 'rxjs';

import { ProfileService, ProposalService, ReviewService } from '~core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '~core/state/profile/profile.service.mock';
import {
  ProposalServiceMock,
  proposalServiceMockFactory,
} from '~core/state/proposal/proposal.service.mock';
import {
  ReviewServiceMock,
  reviewServiceMockFactory,
} from '~core/state/review/review.service.mock';
import {
  ActivatedRouteMock,
  activatedRouteMockFactory,
  defineProp,
} from '~testing';
import { ProfileEditComponent } from './profile-edit.component';

describe('ProfileViewComponent', () => {
  let component: ProfileEditComponent;
  let fixture: ComponentFixture<ProfileEditComponent>;
  let profileServiceMock: ProfileServiceMock;
  let proposalServiceMock: ProposalServiceMock;
  let activatedRouteMock: ActivatedRouteMock;
  let reviewServiceMock: ReviewServiceMock;

  beforeEach(async () => {
    profileServiceMock = profileServiceMockFactory();
    defineProp(profileServiceMock, 'currentUserProfile$', of(null));
    defineProp(profileServiceMock, 'isCurrentUserReviewer$', of(true));

    proposalServiceMock = proposalServiceMockFactory();
    defineProp(proposalServiceMock, 'currentProposal$', of(null));

    activatedRouteMock = activatedRouteMockFactory();
    activatedRouteMock.params = of([{ id: 1 }]);

    reviewServiceMock = reviewServiceMockFactory();
    defineProp(reviewServiceMock, 'proposalReviewList$', of([]));
    defineProp(reviewServiceMock, 'userReviewList$', of([]));

    await TestBed.configureTestingModule({
      imports: [ProfileEditComponent, RouterModule],
      providers: [
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: ProposalService, useValue: proposalServiceMock },
        { provide: ReviewService, useValue: reviewServiceMock },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
