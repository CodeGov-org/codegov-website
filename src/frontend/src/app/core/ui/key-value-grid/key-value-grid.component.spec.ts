import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyValueGridComponent } from './key-value-grid.component';

describe('KeyValueGridComponent', () => {
  let component: KeyValueGridComponent;
  let fixture: ComponentFixture<KeyValueGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyValueGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyValueGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
