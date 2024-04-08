import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageUploaderBtnComponent } from './image-uploader-btn.component';

describe('ImageUploaderBtnComponent', () => {
  let component: ImageUploaderBtnComponent;
  let fixture: ComponentFixture<ImageUploaderBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageUploaderBtnComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageUploaderBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
