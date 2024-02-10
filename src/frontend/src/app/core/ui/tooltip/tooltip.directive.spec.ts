import {
  ElementRefMock,
  overlayMockFactory,
  overlayPositionBuilderFactory,
} from '~testing';
import { TooltipDirective } from './tooltip.directive';

describe('TooltipDirective', () => {
  let elementRefMock: ElementRefMock;
  const overlayPositionBuilderMock = overlayPositionBuilderFactory();
  const overlayMock = overlayMockFactory();

  it('should create an instance', () => {
    const directive = new TooltipDirective(
      overlayPositionBuilderMock,
      elementRefMock,
      overlayMock,
    );
    expect(directive).toBeTruthy();
  });
});
