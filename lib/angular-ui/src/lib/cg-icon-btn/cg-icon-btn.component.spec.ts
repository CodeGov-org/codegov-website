import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CgIconBtnComponent } from './cg-icon-btn.component';

describe('CgIconBtnComponent', () => {
  let component: CgIconBtnComponent;
  let fixture: ComponentFixture<CgIconBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CgIconBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CgIconBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
