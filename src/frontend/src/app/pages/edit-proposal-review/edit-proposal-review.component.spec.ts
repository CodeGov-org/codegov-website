import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProposalReviewComponent } from './edit-proposal-review.component';

describe('EditProposalReviewComponent', () => {
  let component: EditProposalReviewComponent;
  let fixture: ComponentFixture<EditProposalReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProposalReviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditProposalReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
