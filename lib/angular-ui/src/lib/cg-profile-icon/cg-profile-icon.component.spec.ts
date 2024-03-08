import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CgProfileIconComponent } from './cg-profile-icon.component';

describe('CgProfileIconComponent', () => {
  let component: CgProfileIconComponent;
  let fixture: ComponentFixture<CgProfileIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CgProfileIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CgProfileIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
