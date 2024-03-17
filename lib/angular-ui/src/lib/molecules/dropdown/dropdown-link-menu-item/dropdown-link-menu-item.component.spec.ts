import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownLinkMenuItemComponent } from './dropdown-link-menu-item.component';

describe('DropdownLinkMenuItemComponent', () => {
  let component: DropdownLinkMenuItemComponent;
  let fixture: ComponentFixture<DropdownLinkMenuItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownLinkMenuItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownLinkMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
