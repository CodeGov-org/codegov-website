import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposalReviewComponent } from './proposal-review.component';

describe('ProposalReviewComponent', () => {
  let component: ProposalReviewComponent;
  let fixture: ComponentFixture<ProposalReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposalReviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
