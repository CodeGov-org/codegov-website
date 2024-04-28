import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewDetailsFormComponent } from './review-details-form.component';

describe('ReviewDetailsFormComponent', () => {
  let component: ReviewDetailsFormComponent;
  let fixture: ComponentFixture<ReviewDetailsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewDetailsFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewDetailsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
