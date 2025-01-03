import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { UserAuthService } from '~core/services';
import {
  UserAuthServiceMock,
  userAuthServiceMockFactory,
} from '~core/services/user-auth-service-mock';
import { ProfileService } from '~core/state';
import {
  ProfileServiceMock,
  profileServiceMockFactory,
} from '~core/state/profile/profile.service.mock';
import { AppComponent } from './app.component';
import { defineProp } from './testing/test-utils';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let userAuthServiceMock: UserAuthServiceMock;
  let profileServiceMock: ProfileServiceMock;

  beforeEach(async () => {
    userAuthServiceMock = userAuthServiceMockFactory();
    defineProp(userAuthServiceMock, 'isAuthenticated$', of(true));

    profileServiceMock = profileServiceMockFactory();
    profileServiceMock.loadCurrentUserProfile.and.returnValue(
      Promise.resolve(),
    );

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: UserAuthService,
          useValue: userAuthServiceMock,
        },
        {
          provide: ProfileService,
          useValue: profileServiceMock,
        },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
