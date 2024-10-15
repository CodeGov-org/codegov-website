import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import {
  ProposalLinkBaseUrl,
  ProposalVotingLinkType,
  ProposalTopic,
  ProposalState,
} from '~core/api';
import { ProposalService, ReviewService } from '~core/state';
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
import { ProposalReviewEditComponent } from './proposal-review-edit.component';

describe('ProposalReviewEditComponent', () => {
  let component: ProposalReviewEditComponent;
  let fixture: ComponentFixture<ProposalReviewEditComponent>;

  let proposalServiceMock: ProposalServiceMock;
  let reviewServiceMock: ReviewServiceMock;
  let activatedRouteMock: ActivatedRouteMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    defineProp(
      proposalServiceMock,
      'currentProposal$',
      of({
        id: '1',
        nsProposalId: 1n,
        title: 'title',
        topic: ProposalTopic.RVM,
        type: 'unknown',
        state: ProposalState.InProgress,
        reviewPeriodEnd: new Date(2024, 1, 17, 1, 1, 25),
        votingPeriodEnd: new Date(2024, 1, 19, 1, 1, 25),
        proposedAt: new Date(2024, 1, 15, 1, 1, 25),
        proposedBy: 432432432423n,
        decidedAt: null,
        summary: 'Elect new replica binary revision',
        reviewCompletedAt: null,
        codeGovVote: null,
        proposalLinks: [
          {
            type: ProposalVotingLinkType.NNSDApp,
            link: ProposalLinkBaseUrl.NNSDApp + 1,
          },
        ],
      }),
    );

    reviewServiceMock = reviewServiceMockFactory();
    defineProp(reviewServiceMock, 'currentReview$', of(null));

    activatedRouteMock = activatedRouteMockFactory();
    defineProp(
      activatedRouteMock,
      'paramMap',
      of(convertToParamMap([{ id: 1 }])),
    );

    await TestBed.configureTestingModule({
      imports: [ProposalReviewEditComponent],
      providers: [
        { provide: ProposalService, useValue: proposalServiceMock },
        { provide: ReviewService, useValue: reviewServiceMock },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalReviewEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
