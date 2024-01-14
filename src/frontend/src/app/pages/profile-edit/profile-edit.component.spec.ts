import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ProfileService } from '@core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '@core/state/profile/profile.service.mock';
import { ProfileEditComponent } from './profile-edit.component';

describe('ProfileViewComponent', () => {
  let component: ProfileEditComponent;
  let fixture: ComponentFixture<ProfileEditComponent>;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    profileServiceMock = profileServiceMockFactory();
    profileServiceMock.userProfile$ = of(null);

    await TestBed.configureTestingModule({
      imports: [ProfileEditComponent, RouterTestingModule],
      providers: [{ provide: ProfileService, useValue: profileServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
