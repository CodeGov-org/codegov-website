import { Component, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'cg-link-text-btn',
  styleUrl: 'link-text-btn.scss',
  scoped: true,
})
export class TextBtnComponent {
  @Prop()
  public href!: string;

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
      <a
        class="link-text-btn"
        href={this.href}
        onFocus={() => this.onFocused()}
        onBlur={() => this.onBlurred()}
      >
        <cg-focus-ring isFocused={this.isFocused} />

        <slot />
      </a>
    );
  }
}
