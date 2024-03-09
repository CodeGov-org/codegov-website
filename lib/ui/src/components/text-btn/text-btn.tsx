import { Component, State, h } from '@stencil/core';

@Component({
  tag: 'cg-text-btn',
  styleUrl: 'text-btn.scss',
  scoped: true,
})
export class TextBtnComponent {
  public onFocused(): void {
    this.isFocused = true;
  }

  public onBlurred(): void {
    this.isFocused = false;
  }

  @State()
  public isFocused = false;

  public render() {
    return (
      <button
        class="text-btn"
        onFocus={() => this.onFocused()}
        onBlur={() => this.onBlurred()}
      >
        <cg-focus-ring isFocused={this.isFocused} />

        <slot />
      </button>
    );
  }
}
