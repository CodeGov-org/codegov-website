import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  RouterModule,
  convertToParamMap,
} from '@angular/router';
import { of } from 'rxjs';

import {
  ProposalTopic,
  ProposalState,
  ProposalVotingLinkType,
  BaseUrl,
} from '~core/api';
import { ProfileService, ReviewService, ProposalService } from '~core/state';
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
import { ProposalDetailsComponent } from './proposal-details.component';

describe('ProposalDetailsComponent', () => {
  let component: ProposalDetailsComponent;
  let fixture: ComponentFixture<ProposalDetailsComponent>;
  let proposalServiceMock: ProposalServiceMock;
  let profileServiceMock: ProfileServiceMock;
  let activatedRouteMock: ActivatedRouteMock;
  let reviewServiceMock: ReviewServiceMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    defineProp(
      proposalServiceMock,
      'currentProposal$',
      of({
        id: '1',
        nsProposalId: 1n,
        title: 'title',
        topic: ProposalTopic.IcOsVersionElection,
        type: 'unknown',
        state: ProposalState.InProgress,
        reviewPeriodEnd: new Date(2024, 1, 17, 1, 1, 25),
        votingPeriodEnd: new Date(2024, 1, 19, 1, 1, 25),
        reviewCompletedAt: null,
        decidedAt: null,
        proposedAt: new Date(2024, 1, 15, 1, 1, 25),
        proposedBy: 432432432423n,
        summary: 'Elect new replica binary revision',
        codeGovVote: null,
        proposalLinks: [
          {
            type: ProposalVotingLinkType.NNSDApp,
            link: BaseUrl.NNSDApp + 1,
          },
        ],
      }),
    );

    profileServiceMock = profileServiceMockFactory();
    defineProp(profileServiceMock, 'isCurrentUserAdmin$', of(false));
    defineProp(profileServiceMock, 'isCurrentUserReviewer$', of(true));
    defineProp(profileServiceMock, 'currentUser$', of(null));

    activatedRouteMock = activatedRouteMockFactory();
    defineProp(
      activatedRouteMock,
      'paramMap',
      of(convertToParamMap([{ id: 1 }])),
    );

    reviewServiceMock = reviewServiceMockFactory();
    defineProp(reviewServiceMock, 'reviews$', of([]));
    defineProp(reviewServiceMock, 'currentUserReviews$', of([]));

    await TestBed.configureTestingModule({
      imports: [ProposalDetailsComponent, RouterModule],
      providers: [
        { provide: ProposalService, useValue: proposalServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: ReviewService, useValue: reviewServiceMock },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalDetailsComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
