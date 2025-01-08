import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HamburgerIconComponent } from './hamburger-icon.component';

describe('HamburgerIconComponent', () => {
  let component: HamburgerIconComponent;
  let fixture: ComponentFixture<HamburgerIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HamburgerIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HamburgerIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
