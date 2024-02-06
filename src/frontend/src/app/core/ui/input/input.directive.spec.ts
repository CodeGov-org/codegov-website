import {
  ControlContainerMock,
  ElementRefMock,
  controlContainerMockFactory,
} from '~testing';
import { InputDirective } from './input.directive';

describe('InputDirective', () => {
  let elementRefMock: ElementRefMock;
  let controlContainerMock: ControlContainerMock;
  let directive: InputDirective;

  beforeEach(() => {
    elementRefMock = { nativeElement: null };
    controlContainerMock = controlContainerMockFactory();
    directive = new InputDirective(elementRefMock, controlContainerMock);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
