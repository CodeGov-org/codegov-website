import { DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { dialogRefMockFactory } from '~testing';
import { LoadingDialogComponent } from './loading-dialog.component';

describe('LoadingDialogComponent', () => {
  let component: LoadingDialogComponent;
  let fixture: ComponentFixture<LoadingDialogComponent>;
  const dialogRefMock = dialogRefMockFactory();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingDialogComponent],
      providers: [
        {
          provide: DialogRef,
          useValue: dialogRefMock,
        },
      ],
    }).compileComponents();

    dialogRefMock.config.data = { message: 'testmessage' };

    fixture = TestBed.createComponent(LoadingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
