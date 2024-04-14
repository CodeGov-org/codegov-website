import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { UserAuthService } from '~core/services';
import {
  UserAuthServiceMock,
  userAuthServiceMockFactory,
} from '~core/services/user-auth-service-mock';
import { AppComponent } from './app.component';
import { defineProp } from './testing/test-utils';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let userAuthServiceMock: UserAuthServiceMock;

  beforeEach(async () => {
    userAuthServiceMock = userAuthServiceMockFactory();
    defineProp(userAuthServiceMock, 'isAuthenticated$', of(true));

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: UserAuthService,
          useValue: userAuthServiceMock,
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
