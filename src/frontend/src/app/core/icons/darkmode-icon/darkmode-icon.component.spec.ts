import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DarkModeIconComponent } from './darkmode-icon.component';

describe('DarkModeIconComponent', () => {
  let component: DarkModeIconComponent;
  let fixture: ComponentFixture<DarkModeIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DarkModeIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DarkModeIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
