import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosedProposalListComponent } from './closed-proposal-list.component';

describe('ClosedProposalListComponent', () => {
  let component: ClosedProposalListComponent;
  let fixture: ComponentFixture<ClosedProposalListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClosedProposalListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClosedProposalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
