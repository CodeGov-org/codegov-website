import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnonymousProfileComponent } from './anonymous-profile.component';

describe('AnonymousProfileComponent', () => {
  let component: AnonymousProfileComponent;
  let fixture: ComponentFixture<AnonymousProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnonymousProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnonymousProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
