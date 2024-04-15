import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdoptIconComponent } from './adopt-icon.component';

describe('AdoptIconComponent', () => {
  let component: AdoptIconComponent;
  let fixture: ComponentFixture<AdoptIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdoptIconComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdoptIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
