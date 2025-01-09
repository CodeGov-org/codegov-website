import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkTextBtnComponent } from './link-text-btn.component';

describe('LinkTextBtnComponent', () => {
  let component: LinkTextBtnComponent;
  let fixture: ComponentFixture<LinkTextBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkTextBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkTextBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
