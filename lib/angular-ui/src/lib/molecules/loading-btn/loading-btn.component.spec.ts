import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingBtnComponent } from './loading-btn.component';

describe('LoadingBtnComponent', () => {
  let component: LoadingBtnComponent;
  let fixture: ComponentFixture<LoadingBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
