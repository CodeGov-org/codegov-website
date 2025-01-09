import { Component, ComponentInterface, Prop, State, h } from '@stencil/core';

let id = 0;

@Component({
  tag: 'cg-radio-input',
  styleUrl: 'radio-input.scss',
  scoped: true,
})
export class RadioInput implements ComponentInterface {
  @Prop({ reflect: true })
  public value?: string | number | string[] | undefined;

  @Prop({ reflect: true })
  public checked?: boolean;

  @Prop({ reflect: true })
  public name?: string;

  @Prop({ reflect: true })
  public disabled?: boolean;

  @State()
  private isFocused = false;

  private radioId = `radio-${id++}`;

  public render() {
    return (
      <label
        htmlFor={this.radioId}
        class={{
          'radio-input__label': true,
          'radio-input__label--disabled': this.disabled ?? false,
        }}
      >
        <span class="radio-input__input-container">
          <span class="radio-input__focus-ring-container">
            <cg-focus-ring isFocused={this.isFocused} />
          </span>

          <input
            type="radio"
            class="radio-input__input"
            value={this.value}
            checked={this.checked}
            id={this.radioId}
            name={this.name}
            disabled={this.disabled}
            onFocus={() => this.onFocused()}
            onBlur={() => this.onBlurred()}
          />
        </span>

        <span
          class={{
            'radio-input__content': true,
            'radio-input__content--disabled': this.disabled ?? false,
          }}
        >
          <slot />
        </span>
      </label>
    );
  }

  private onFocused(): void {
    this.isFocused = true;
  }

  private onBlurred(): void {
    this.isFocused = false;
  }
}
