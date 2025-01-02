import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { InputDirective } from './input.directive';

@Component({
  imports: [InputDirective, ReactiveFormsModule],
  template: `
    <form [formGroup]="formGroup">
      <input appInput [formControlName]="'test'" />
    </form>
  `,
})
class TestComponent {
  public formGroup = new FormGroup({
    test: new FormControl(),
  });
}

describe('InputDirective', () => {
  let hostComponent: TestComponent;
  let directive: InputDirective;
  let fixture: ComponentFixture<TestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    hostComponent = fixture.componentInstance;
    directive = fixture.debugElement
      .query(By.directive(InputDirective))
      .injector.get(InputDirective);
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(hostComponent).toBeTruthy();
    expect(directive).toBeTruthy();
  });
});
