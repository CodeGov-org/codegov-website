import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileService } from '~core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '~core/state/profile/profile.service.mock';
import { ReviewerProfileComponent } from './reviewer-profile.component';

describe('ReviewerProfileComponent', () => {
  let component: ReviewerProfileComponent;
  let fixture: ComponentFixture<ReviewerProfileComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    profileServiceMock = profileServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [ReviewerProfileComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
