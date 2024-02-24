import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightModeIconComponent } from './lightmode-icon.component';

describe('LightModeIconComponent', () => {
  let component: LightModeIconComponent;
  let fixture: ComponentFixture<LightModeIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightModeIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LightModeIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
