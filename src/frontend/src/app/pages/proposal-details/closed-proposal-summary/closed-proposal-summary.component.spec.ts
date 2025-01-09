import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '../../../core/state/profile/profile.service.mock';
import { ProfileService } from '~core/state';
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

  let activatedRouteMock: ActivatedRouteMock;
  let reviewServiceMock: ReviewServiceMock;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    activatedRouteMock = activatedRouteMockFactory();
    activatedRouteMock.params = of([{ proposalId: 1 }]);

    reviewServiceMock = reviewServiceMockFactory();
    defineProp(reviewServiceMock, 'reviews$', of([]));

    profileServiceMock = profileServiceMockFactory();
    defineProp(profileServiceMock, 'reviewers$', of({}));

    await TestBed.configureTestingModule({
      imports: [ClosedProposalSummaryComponent],
      providers: [
        { provide: ReviewService, useValue: reviewServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClosedProposalSummaryComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
