import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueColComponent } from './value-col.component';

describe('ValueColComponent', () => {
  let component: ValueColComponent;
  let fixture: ComponentFixture<ValueColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValueColComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ValueColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
