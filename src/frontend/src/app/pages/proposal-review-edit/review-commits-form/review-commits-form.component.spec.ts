import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { defineProp } from '../../../testing';
import { ReviewSubmissionService } from '~core/state';
import {
  ReviewSubmissionServiceMock,
  reviewSubmissionServiceMockFactory,
} from '~core/state/review-submission/review-submission.service.mock';
import { ReviewCommitsFormComponent } from './review-commits-form.component';

describe('ReviewCommitsFormComponent', () => {
  let component: ReviewCommitsFormComponent;
  let fixture: ComponentFixture<ReviewCommitsFormComponent>;
  let reviewSubmissionServiceMock: ReviewSubmissionServiceMock;

  beforeEach(async () => {
    reviewSubmissionServiceMock = reviewSubmissionServiceMockFactory();
    defineProp(reviewSubmissionServiceMock, 'commits$', of(null));

    await TestBed.configureTestingModule({
      imports: [ReviewCommitsFormComponent],
      providers: [
        {
          provide: ReviewSubmissionService,
          useValue: reviewSubmissionServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewCommitsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
