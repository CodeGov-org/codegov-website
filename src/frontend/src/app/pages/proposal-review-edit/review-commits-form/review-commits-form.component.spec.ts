import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewCommitsFormComponent } from './review-commits-form.component';

describe('ReviewCommitsFormComponent', () => {
  let component: ReviewCommitsFormComponent;
  let fixture: ComponentFixture<ReviewCommitsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewCommitsFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewCommitsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
