import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
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
import { defineProp } from '~testing';
import { ProposalListComponent } from './proposal-list.component';

describe('ProposalListComponent', () => {
  let component: ProposalListComponent;
  let fixture: ComponentFixture<ProposalListComponent>;
  let proposalServiceMock: ProposalServiceMock;
  let profileServiceMock: ProfileServiceMock;
  let reviewServiceMock: ReviewServiceMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    defineProp(proposalServiceMock, 'currentProposalList$', of([]));

    profileServiceMock = profileServiceMockFactory();
    defineProp(profileServiceMock, 'isCurrentUserReviewer$', of(true));
    defineProp(profileServiceMock, 'currentUserProfile$', of(null));

    reviewServiceMock = reviewServiceMockFactory();
    defineProp(reviewServiceMock, 'userReviewList$', of([]));

    await TestBed.configureTestingModule({
      imports: [ProposalListComponent, RouterModule],
      providers: [
        { provide: ProposalService, useValue: proposalServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: ReviewService, useValue: reviewServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
