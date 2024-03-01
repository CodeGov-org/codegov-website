import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProposalService } from '~core/state';
import {
  ProposalServiceMock,
  proposalServiceMockFactory,
} from '~core/state/proposal/proposal.service.mock';
import { OpenProposalListComponent } from './open-proposal-list.component';

describe('OpenProposalListComponent', () => {
  let component: OpenProposalListComponent;
  let fixture: ComponentFixture<OpenProposalListComponent>;
  let proposalServiceMock: ProposalServiceMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    proposalServiceMock.openProposalList$ = of([]);

    await TestBed.configureTestingModule({
      imports: [OpenProposalListComponent],
      providers: [{ provide: ProposalService, useValue: proposalServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenProposalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
