import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyColComponent } from './key-col.component';

describe('KeyColComponent', () => {
  let component: KeyColComponent;
  let fixture: ComponentFixture<KeyColComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyColComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyColComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
