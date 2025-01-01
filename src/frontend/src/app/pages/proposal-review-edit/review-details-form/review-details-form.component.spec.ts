import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { defineProp } from '../../../testing';
import { ReviewSubmissionService } from '~core/state';
import {
  ReviewSubmissionServiceMock,
  reviewSubmissionServiceMockFactory,
} from '~core/state/review-submission/review-submission.service.mock';
import { ReviewDetailsFormComponent } from './review-details-form.component';

describe('ReviewDetailsFormComponent', () => {
  let component: ReviewDetailsFormComponent;
  let fixture: ComponentFixture<ReviewDetailsFormComponent>;
  let reviewSubmissionServiceMock: ReviewSubmissionServiceMock;

  beforeEach(async () => {
    reviewSubmissionServiceMock = reviewSubmissionServiceMockFactory();
    defineProp(reviewSubmissionServiceMock, 'review$', of(null));

    await TestBed.configureTestingModule({
      imports: [ReviewDetailsFormComponent],
      providers: [
        {
          provide: ReviewSubmissionService,
          useValue: reviewSubmissionServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewDetailsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
