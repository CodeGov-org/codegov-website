import { AbstractControl, ControlContainer } from '@angular/forms';

export type ControlContainerMock = jasmine.SpyObj<ControlContainer>;

export function controlContainerMockFactory(): ControlContainerMock {
  return jasmine.createSpyObj<ControlContainer>('ControlContainer', ['reset']);
}

export type AbstractControlMock = jasmine.SpyObj<AbstractControl>;

export function abstractControlMockFactory(): AbstractControlMock {
  return jasmine.createSpyObj<AbstractControl>('AbstractControl', [
    'get',
    'setErrors',
    'setValue',
  ]);
}
