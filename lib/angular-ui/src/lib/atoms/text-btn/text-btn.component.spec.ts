import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextBtnComponent } from './text-btn.component';

describe('TextBtnComponent', () => {
  let component: TextBtnComponent;
  let fixture: ComponentFixture<TextBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
