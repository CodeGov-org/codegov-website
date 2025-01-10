import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconBtnComponent } from './icon-btn.component';

describe('IconBtnComponent', () => {
  let component: IconBtnComponent;
  let fixture: ComponentFixture<IconBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IconBtnComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ariaLabel', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
