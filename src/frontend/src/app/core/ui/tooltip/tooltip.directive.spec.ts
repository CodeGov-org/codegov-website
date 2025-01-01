import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `<div appTooltip="test">Test</div>`,
})
class TestComponent {}

describe('TooltipDirective', () => {
  let hostComponent: TestComponent;
  let directive: TooltipDirective;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    hostComponent = fixture.componentInstance;
    directive = fixture.debugElement
      .query(By.directive(TooltipDirective))
      .injector.get(TooltipDirective);
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(hostComponent).toBeTruthy();
    expect(directive).toBeTruthy();
  });
});
