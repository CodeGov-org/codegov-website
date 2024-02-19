import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlContainer } from '@angular/forms';

import { ControlContainerMock, controlContainerMockFactory } from '~testing';
import { FormValidationInfoComponent } from './form-validation-info.component';

describe('FormValidationInfoComponent', () => {
  let component: FormValidationInfoComponent;
  let fixture: ComponentFixture<FormValidationInfoComponent>;

  let controlContainerMock: ControlContainerMock;

  beforeEach(async () => {
    controlContainerMock = controlContainerMockFactory();

    await TestBed.configureTestingModule({
      imports: [FormValidationInfoComponent],
      providers: [
        { provide: ControlContainer, useValue: controlContainerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormValidationInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
