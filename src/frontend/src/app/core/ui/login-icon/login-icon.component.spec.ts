import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginIconComponent } from './login-icon.component';

describe('LoginIconComponent', () => {
  let component: LoginIconComponent;
  let fixture: ComponentFixture<LoginIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
