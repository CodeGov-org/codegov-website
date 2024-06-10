import { TestBed } from '@angular/core/testing';

import { ReviewApiService } from '~core/api';
import {
  ReviewApiServiceMock,
  reviewApiServiceMockFactory,
} from '~core/api/review/review-api.service.mock';
import { ReviewService } from './review.service';

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewApiServiceMock: ReviewApiServiceMock;

  beforeEach(() => {
    reviewApiServiceMock = reviewApiServiceMockFactory();

    TestBed.configureTestingModule({
      providers: [
        { provide: ReviewApiService, useValue: reviewApiServiceMock },
      ],
    });

    service = TestBed.inject(ReviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
