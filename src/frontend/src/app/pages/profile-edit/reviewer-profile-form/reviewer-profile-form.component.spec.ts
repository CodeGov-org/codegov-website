import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileService } from '~core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '~core/state/profile/profile.service.mock';
import { ReviewerProfileFormComponent } from './reviewer-profile-form.component';

describe('ReviewerProfileFormComponent', () => {
  let component: ReviewerProfileFormComponent;
  let fixture: ComponentFixture<ReviewerProfileFormComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    profileServiceMock = profileServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [ReviewerProfileFormComponent],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerProfileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
