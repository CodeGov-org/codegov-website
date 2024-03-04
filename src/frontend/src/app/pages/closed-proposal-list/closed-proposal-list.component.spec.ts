import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProposalService } from '~core/state';
import {
  ProposalServiceMock,
  proposalServiceMockFactory,
} from '~core/state/proposal/proposal.service.mock';
import { ClosedProposalListComponent } from './closed-proposal-list.component';

describe('ClosedProposalListComponent', () => {
  let component: ClosedProposalListComponent;
  let fixture: ComponentFixture<ClosedProposalListComponent>;
  let proposalServiceMock: ProposalServiceMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    proposalServiceMock.openProposalList$ = of([]);

    await TestBed.configureTestingModule({
      imports: [ClosedProposalListComponent],
      providers: [{ provide: ProposalService, useValue: proposalServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClosedProposalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
