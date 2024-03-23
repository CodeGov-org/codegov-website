import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownTriggerComponent } from './dropdown-trigger.component';

describe('DropdownTriggerComponent', () => {
  let component: DropdownTriggerComponent;
  let fixture: ComponentFixture<DropdownTriggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownTriggerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DropdownTriggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
