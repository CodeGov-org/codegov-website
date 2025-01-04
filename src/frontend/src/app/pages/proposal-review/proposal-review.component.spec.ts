import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
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
import { ProposalReviewComponent } from './proposal-review.component';

describe('ProposalReviewComponent', () => {
  let component: ProposalReviewComponent;
  let fixture: ComponentFixture<ProposalReviewComponent>;
  let reviewServiceMock: ReviewServiceMock;
  let proposalServiceMock: ProposalServiceMock;
  let profileServiceMock: ProfileServiceMock;
  let activatedRouteMock: ActivatedRouteMock;

  beforeEach(async () => {
    reviewServiceMock = reviewServiceMockFactory();
    defineProp(reviewServiceMock, 'currentReview$', of(null));

    proposalServiceMock = proposalServiceMockFactory();
    defineProp(proposalServiceMock, 'currentProposal$', of(null));

    profileServiceMock = profileServiceMockFactory();
    defineProp(profileServiceMock, 'currentUserProfile$', of(null));
    defineProp(profileServiceMock, 'reviewerProfiles$', of({}));

    activatedRouteMock = activatedRouteMockFactory();
    defineProp(
      activatedRouteMock,
      'paramMap',
      of(convertToParamMap([{ id: 1 }])),
    );

    await TestBed.configureTestingModule({
      imports: [ProposalReviewComponent],
      providers: [
        { provide: ReviewService, useValue: reviewServiceMock },
        { provide: ProposalService, useValue: proposalServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
