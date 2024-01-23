import { ElementRefMock } from '~testing';
import { InputDirective } from './input.directive';

describe('InputDirective', () => {
  let elementRefMock: ElementRefMock;

  it('should create an instance', () => {
    const directive = new InputDirective(elementRefMock);
    expect(directive).toBeTruthy();
  });
});
