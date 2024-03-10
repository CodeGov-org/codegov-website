import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProposalService } from '~core/state';
import {
  ProposalServiceMock,
  proposalServiceMockFactory,
} from '~core/state/proposal/proposal.service.mock';
import { ProposalListComponent } from './proposal-list.component';

describe('ProposalListComponent', () => {
  let component: ProposalListComponent;
  let fixture: ComponentFixture<ProposalListComponent>;
  let proposalServiceMock: ProposalServiceMock;

  beforeEach(async () => {
    proposalServiceMock = proposalServiceMockFactory();
    proposalServiceMock.currentProposalList$ = of([]);

    await TestBed.configureTestingModule({
      imports: [ProposalListComponent],
      providers: [{ provide: ProposalService, useValue: proposalServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
