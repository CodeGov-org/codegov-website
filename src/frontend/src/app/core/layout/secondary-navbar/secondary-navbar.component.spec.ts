import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  UserAuthServiceMock,
  userAuthServiceMockFactory,
  UserAuthService,
} from '~core/services';
import { SecondaryNavbarComponent } from './secondary-navbar.component';

describe('SecondaryNavbarComponent', () => {
  let component: SecondaryNavbarComponent;
  let fixture: ComponentFixture<SecondaryNavbarComponent>;
  let userAuthServiceMock: UserAuthServiceMock;

  beforeEach(async () => {
    userAuthServiceMock = userAuthServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [SecondaryNavbarComponent],
      providers: [
        {
          provide: UserAuthService,
          useValue: userAuthServiceMock,
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
