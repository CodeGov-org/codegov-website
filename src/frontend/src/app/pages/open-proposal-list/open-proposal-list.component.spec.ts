import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenProposalListComponent } from './open-proposal-list.component';

describe('OpenProposalListComponent', () => {
  let component: OpenProposalListComponent;
  let fixture: ComponentFixture<OpenProposalListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenProposalListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenProposalListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
