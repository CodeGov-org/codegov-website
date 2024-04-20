import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckCircleIconComponent } from './check-circle-icon.component';

describe('CheckCircleIconComponent', () => {
  let component: CheckCircleIconComponent;
  let fixture: ComponentFixture<CheckCircleIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckCircleIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckCircleIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
