import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import {
  ProposalLinkBaseUrl,
  ProposalService,
  ProposalState,
  ProposalTopic,
  ProposalVotingLinkType,
} from '~core/state';
import {
  ProposalServiceMock,
  proposalServiceMockFactory,
} from '~core/state/proposal/proposal.service.mock';
import {
  ActivatedRouteMock,
  activatedRouteMockFactory,
  defineProp,
} from '~testing';
import { ProposalReviewEditComponent } from './proposal-review-edit.component';

describe('EditProposalReviewComponent', () => {
  let component: ProposalReviewEditComponent;
  let fixture: ComponentFixture<ProposalReviewEditComponent>;

  let proposalServiceMock: ProposalServiceMock;
  let activatedRoute: ActivatedRouteMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    defineProp(
      proposalServiceMock,
      'currentProposal$',
      of({
        id: 1n,
        title: 'title',
        topic: ProposalTopic.RVM,
        type: 'unknown',
        state: ProposalState.InProgress,
        reviewPeriodEnd: new Date(2024, 1, 17, 1, 1, 25),
        votingPeriodEnd: new Date(2024, 1, 19, 1, 1, 25),
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

    activatedRoute = activatedRouteMockFactory();
    activatedRoute.params = of([{ id: 1 }]);

    await TestBed.configureTestingModule({
      imports: [ProposalReviewEditComponent],
      providers: [
        { provide: ProposalService, useValue: proposalServiceMock },
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
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
