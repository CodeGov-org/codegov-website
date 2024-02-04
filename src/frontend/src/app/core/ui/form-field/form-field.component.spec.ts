import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlContainer } from '@angular/forms';
import { of } from 'rxjs';

import { InputDirective } from '../input';
import {
  AbstractControlMock,
  ControlContainerMock,
  controlContainerMockFactory,
  abstractControlMockFactory,
  defineProp,
} from '~testing';
import { FormFieldComponent } from './form-field.component';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [FormFieldComponent, InputDirective],
  template: `
    <app-form-field>
      <input appInput formControlName="test" />
    </app-form-field>
  `,
})
class TestComponent {}

describe('FormFieldComponent', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;

  let controlContainerMock: ControlContainerMock;
  let formGroupMock: AbstractControlMock;
  let formControlMock: AbstractControlMock;

  beforeEach(async () => {
    formControlMock = abstractControlMockFactory();
    defineProp(formControlMock, 'statusChanges', of());

    formGroupMock = abstractControlMockFactory();
    formGroupMock.get.and.returnValue(formControlMock);

    controlContainerMock = controlContainerMockFactory();
    defineProp(controlContainerMock, 'control', formGroupMock);

    await TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        { provide: ControlContainer, useValue: controlContainerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
