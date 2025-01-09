import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipboardCheckIconComponent } from './clipboard-check-icon.component';

describe('ClipboardCheckIconComponent', () => {
  let component: ClipboardCheckIconComponent;
  let fixture: ComponentFixture<ClipboardCheckIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClipboardCheckIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClipboardCheckIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
