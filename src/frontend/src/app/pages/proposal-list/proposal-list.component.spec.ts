import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';

import { ProfileService, ProposalService } from '~core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '~core/state/profile/profile.service.mock';
import {
  ProposalServiceMock,
  proposalServiceMockFactory,
} from '~core/state/proposal/proposal.service.mock';
import { ProposalListComponent } from './proposal-list.component';

describe('ProposalListComponent', () => {
  let component: ProposalListComponent;
  let fixture: ComponentFixture<ProposalListComponent>;
  let proposalServiceMock: ProposalServiceMock;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    proposalServiceMock.currentProposalList$ = of([]);
    profileServiceMock = profileServiceMockFactory();
    profileServiceMock.isReviewer$ = of(true);

    await TestBed.configureTestingModule({
      imports: [ProposalListComponent, RouterModule],
      providers: [
        { provide: ProposalService, useValue: proposalServiceMock },
        { provide: ProfileService, useValue: profileServiceMock },
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
