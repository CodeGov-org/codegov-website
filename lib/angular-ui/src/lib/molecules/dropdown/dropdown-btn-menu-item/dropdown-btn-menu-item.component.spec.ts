import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownBtnMenuItemComponent } from './dropdown-btn-menu-item.component';

describe('DropdownBtnMenuItemComponent', () => {
  let component: DropdownBtnMenuItemComponent;
  let fixture: ComponentFixture<DropdownBtnMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownBtnMenuItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownBtnMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
