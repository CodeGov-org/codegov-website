import { Component, ComponentInterface, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'cg-link-text-btn',
  styleUrl: 'link-text-btn.scss',
  scoped: true,
})
export class TextBtnComponent implements ComponentInterface {
  @Prop()
  public href!: string;

  @Prop()
  public isExternal? = false;

  @State()
  private isFocused = false;

  public render() {
    return (
      <a
        class="link-text-btn"
        href={this.href}
        onFocus={() => this.onFocused()}
        onBlur={() => this.onBlurred()}
        target={this.isExternal ? '_blank' : undefined}
        rel={this.isExternal ? 'nofollow noreferrer' : undefined}
      >
        <cg-focus-ring isFocused={this.isFocused} />

        <slot />
      </a>
    );
  }

  private onFocused(): void {
    this.isFocused = true;
  }

  private onBlurred(): void {
    this.isFocused = false;
  }
}
