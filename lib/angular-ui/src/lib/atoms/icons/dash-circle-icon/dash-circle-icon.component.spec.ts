import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashCircleIconComponent } from './dash-circle-icon.component';

describe('DashCircleIconComponent', () => {
  let component: DashCircleIconComponent;
  let fixture: ComponentFixture<DashCircleIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashCircleIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashCircleIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
