import { Component, ComponentInterface, Prop, State, h } from '@stencil/core';
import { AriaHasPopup, ButtonType } from '../../../types';

@Component({
  tag: 'cg-icon-btn',
  styleUrl: 'icon-btn.scss',
  scoped: true,
})
export class IconBtnComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public type: ButtonType = 'button';

  @Prop({ reflect: true })
  public disabled?: boolean;

  @Prop({ reflect: true, attribute: 'aria-label' })
  public ariaLabel!: string;

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
        class="icon-btn"
        type={this.type}
        disabled={this.disabled}
        aria-label={this.ariaLabel}
        aria-haspopup={this.ariaHasPopup}
        aria-expanded={this.ariaExpanded}
        aria-controls={this.ariaControls}
        onFocus={() => this.onFocused()}
        onBlur={() => this.onBlurred()}
      >
        <cg-focus-ring isFocused={this.isFocused} />

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
