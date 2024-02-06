import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PrimaryNavbarComponent } from './primary-navbar.component';

describe('PrimaryNavbarComponent', () => {
  let component: PrimaryNavbarComponent;
  let fixture: ComponentFixture<PrimaryNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryNavbarComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PrimaryNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
