import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenProposalDetailsComponent } from './open-proposal-details.component';

describe('OpenProposalDetailsComponent', () => {
  let component: OpenProposalDetailsComponent;
  let fixture: ComponentFixture<OpenProposalDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenProposalDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenProposalDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
