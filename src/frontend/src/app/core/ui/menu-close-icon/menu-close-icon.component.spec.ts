import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCloseIconComponent } from './menu-close-icon.component';

describe('MenuCloseIconComponent', () => {
  let component: MenuCloseIconComponent;
  let fixture: ComponentFixture<MenuCloseIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuCloseIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuCloseIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
