import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseIconComponent } from './close-icon.component';

describe('CloseIconComponent', () => {
  let component: CloseIconComponent;
  let fixture: ComponentFixture<CloseIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloseIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CloseIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
