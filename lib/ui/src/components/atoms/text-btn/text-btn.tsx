import { Component, ComponentInterface, Prop, State, h } from '@stencil/core';
import { AriaHasPopup, ButtonType, Theme } from '../../../types';

@Component({
  tag: 'cg-text-btn',
  styleUrl: 'text-btn.scss',
  scoped: true,
})
export class TextBtnComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public type: ButtonType = 'button';

  @Prop({ reflect: true })
  public theme?: Theme;

  @Prop({ reflect: true })
  public disabled?: boolean;

  @Prop({ reflect: true, attribute: 'aria-haspopup' })
  public ariaHasPopup?: AriaHasPopup;

  @Prop({ reflect: true, attribute: 'aria-expanded' })
  public ariaExpanded?: boolean;

  @Prop({ reflect: true, attribute: 'aria-controls' })
  public ariaControls?: string;

  @State()
  private isFocused = false;

  public render() {
    return (
      <button
        class={{
          'text-btn': true,
          'text-btn--primary': this.theme === 'primary',
          'text-btn--success': this.theme === 'success',
          'text-btn--error': this.theme === 'error',
        }}
        type={this.type}
        disabled={this.disabled}
        aria-haspopup={this.ariaHasPopup}
        aria-expanded={this.ariaExpanded}
        aria-controls={this.ariaControls}
        onFocus={() => this.onFocused()}
        onBlur={() => this.onBlurred()}
      >
        <cg-focus-ring isFocused={this.isFocused} theme={this.theme} />

        <slot />
      </button>
    );
  }

  private onFocused(): void {
    this.isFocused = true;
  }

  private onBlurred(): void {
    this.isFocused = false;
  }
}
