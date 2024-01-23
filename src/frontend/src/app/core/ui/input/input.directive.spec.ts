import { ElementRefMock } from '~testing';
import { InputDirective } from './input.directive';

describe('InputDirective', () => {
  let elementRefMock: ElementRefMock;
  let directive: InputDirective;

  beforeEach(() => {
    elementRefMock = { nativeElement: null };
    directive = new InputDirective(elementRefMock);
  });

  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
