import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HamburgerMenuIconComponent } from './hamburger-menu-icon.component';

describe('HamburgerMenuIconComponent', () => {
  let component: HamburgerMenuIconComponent;
  let fixture: ComponentFixture<HamburgerMenuIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HamburgerMenuIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HamburgerMenuIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
