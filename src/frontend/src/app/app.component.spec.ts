import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { UserAuthService } from '~core/services';
import {
  UserAuthServiceMock,
  userAuthServiceMockFactory,
} from '~core/services/user-auth-service-mock';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let userAuthServiceMock: UserAuthServiceMock;

  beforeEach(async () => {
    userAuthServiceMock = userAuthServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        {
          provide: UserAuthService,
          useValue: userAuthServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
