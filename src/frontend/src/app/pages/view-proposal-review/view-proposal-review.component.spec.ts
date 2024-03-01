import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewProposalReviewComponent } from './view-proposal-review.component';

describe('ViewProposalReviewComponent', () => {
  let component: ViewProposalReviewComponent;
  let fixture: ComponentFixture<ViewProposalReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewProposalReviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewProposalReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
