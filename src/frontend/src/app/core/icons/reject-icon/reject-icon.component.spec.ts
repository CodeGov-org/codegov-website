import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectIconComponent } from './reject-icon.component';

describe('RejectIconComponent', () => {
  let component: RejectIconComponent;
  let fixture: ComponentFixture<RejectIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejectIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RejectIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
