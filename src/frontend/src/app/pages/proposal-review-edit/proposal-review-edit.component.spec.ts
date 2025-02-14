import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { ProposalService, ReviewSubmissionService } from '~core/state';
import {
  ProposalServiceMock,
  proposalServiceMockFactory,
} from '~core/state/proposal/proposal.service.mock';
import {
  ReviewSubmissionServiceMock,
  reviewSubmissionServiceMockFactory,
} from '~core/state/review-submission/review-submission.service.mock';
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
  let reviewSubmissionServiceMock: ReviewSubmissionServiceMock;
  let activatedRouteMock: ActivatedRouteMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    defineProp(proposalServiceMock, 'currentProposal$', of(null));

    activatedRouteMock = activatedRouteMockFactory();
    defineProp(
      activatedRouteMock,
      'paramMap',
      of(convertToParamMap([{ id: 1 }])),
    );

    reviewSubmissionServiceMock = reviewSubmissionServiceMockFactory();
    defineProp(reviewSubmissionServiceMock, 'review$', of(null));

    await TestBed.configureTestingModule({
      imports: [ProposalReviewEditComponent],
      providers: [
        { provide: ProposalService, useValue: proposalServiceMock },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock,
        },
        {
          provide: ReviewSubmissionService,
          useValue: reviewSubmissionServiceMock,
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
