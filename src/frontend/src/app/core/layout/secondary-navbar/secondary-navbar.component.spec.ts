import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import {
  ActivatedRouteMock,
  activatedRouteMockFactory,
} from 'src/app/testing/activated-route-mock';

import { UserAuthService } from '~core/services';
import {
  UserAuthServiceMock,
  userAuthServiceMockFactory,
} from '~core/services/user-auth-service-mock';
import { defineProp } from '~testing';
import { SecondaryNavbarComponent } from './secondary-navbar.component';

describe('SecondaryNavbarComponent', () => {
  let component: SecondaryNavbarComponent;
  let fixture: ComponentFixture<SecondaryNavbarComponent>;
  let userAuthServiceMock: UserAuthServiceMock;
  let activatedRouteMock: ActivatedRouteMock;

  beforeEach(async () => {
    userAuthServiceMock = userAuthServiceMockFactory();
    defineProp(userAuthServiceMock, 'isAuthenticated$', of(true));

    activatedRouteMock = activatedRouteMockFactory();

    await TestBed.configureTestingModule({
      imports: [SecondaryNavbarComponent],
      providers: [
        {
          provide: UserAuthService,
          useValue: userAuthServiceMock,
        },
        {
          provide: ActivatedRoute,
          useValue: activatedRouteMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SecondaryNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
