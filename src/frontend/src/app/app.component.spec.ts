import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IcAuthService } from '@hadronous/ic-angular';

import { IcAuthServiceMock, icAuthServiceMockFactory } from '~testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let icAuthServiceMock: IcAuthServiceMock;

  beforeEach(async () => {
    icAuthServiceMock = icAuthServiceMockFactory();

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [
        {
          provide: IcAuthService,
          useValue: icAuthServiceMock,
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
