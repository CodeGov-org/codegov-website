import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IcAuthService } from '@hadronous/ic-angular';
import { IcAuthServiceMock, icAuthServiceMockFactory } from '@testing';
import { SecondaryNavbarComponent } from './secondary-navbar.component';

describe('SecondaryNavbarComponent', () => {
  let component: SecondaryNavbarComponent;
  let fixture: ComponentFixture<SecondaryNavbarComponent>;
  let icAuthServiceMock: IcAuthServiceMock;

  beforeEach(async () => {
    icAuthServiceMock = icAuthServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [SecondaryNavbarComponent],
      providers: [
        {
          provide: IcAuthService,
          useValue: icAuthServiceMock,
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
