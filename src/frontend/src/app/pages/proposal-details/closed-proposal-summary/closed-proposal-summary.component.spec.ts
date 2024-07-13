import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import {
  ProposalTopic,
  ProposalState,
  ProposalVotingLinkType,
  ProposalLinkBaseUrl,
} from '~core/state';
import { ProposalService } from '~core/state';
import {
  ProposalServiceMock,
  proposalServiceMockFactory,
} from '~core/state/proposal/proposal.service.mock';
import { ReviewService } from '~core/state/review/review.service';
import {
  ReviewServiceMock,
  reviewServiceMockFactory,
} from '~core/state/review/review.service.mock';
import {
  ActivatedRouteMock,
  activatedRouteMockFactory,
  defineProp,
} from '~testing';
import { ClosedProposalSummaryComponent } from './closed-proposal-summary.component';

describe('ClosedProposalSummaryComponent', () => {
  let component: ClosedProposalSummaryComponent;
  let fixture: ComponentFixture<ClosedProposalSummaryComponent>;
  let proposalServiceMock: ProposalServiceMock;
  let reviewServiceMock: ReviewServiceMock;
  let activatedRoute: ActivatedRouteMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    defineProp(
      proposalServiceMock,
      'currentProposal$',
      of({
        id: '1',
        ns_proposal_id: 1n,
        title: 'title',
        topic: ProposalTopic.RVM,
        type: 'unknown',
        state: ProposalState.InProgress,
        reviewPeriodEnd: new Date(2024, 1, 17, 1, 1, 25),
        votingPeriodEnd: new Date(2024, 1, 19, 1, 1, 25),
        reviewCompletedAt: null,
        proposedAt: new Date(2024, 1, 15, 1, 1, 25),
        proposedBy: 432432432423n,
        summary: 'Elect new replica binary revision',
        proposalLinks: [
          {
            type: ProposalVotingLinkType.NNSDApp,
            link: ProposalLinkBaseUrl.NNSDApp + 1,
          },
        ],
      }),
    );

    reviewServiceMock = reviewServiceMockFactory();
    defineProp(reviewServiceMock, 'proposalReviewList$', of([]));

    activatedRoute = activatedRouteMockFactory();
    activatedRoute.params = of([{ id: 1 }]);

    await TestBed.configureTestingModule({
      imports: [ClosedProposalSummaryComponent, RouterTestingModule],
      providers: [
        { provide: ProposalService, useValue: proposalServiceMock },
        { provide: ReviewService, useValue: reviewServiceMock },
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClosedProposalSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('proposal', {
      id: 1n,
      title: 'title',
      topic: ProposalTopic.RVM,
      type: 'unknown',
      state: ProposalState.Completed,
      reviewPeriodEnd: new Date(2024, 1, 17, 1, 1, 25),
      votingPeriodEnd: new Date(2024, 1, 19, 1, 1, 25),
      proposedAt: new Date(2024, 1, 15, 1, 1, 25),
      proposedBy: 432432432423n,
      reviewCompletedAt: new Date(2024, 1, 19, 1, 1, 25),
      decidedAt: new Date(2024, 1, 19, 1, 1, 25),
      summary: 'Elect new replica binary revision',
      proposalLinks: [
        {
          type: ProposalVotingLinkType.NNSDApp,
          link: ProposalLinkBaseUrl.NNSDApp + 1,
        },
      ],
      codeGovVote: 'ADOPT',
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
