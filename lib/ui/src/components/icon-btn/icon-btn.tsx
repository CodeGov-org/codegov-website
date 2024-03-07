import { Component, ComponentInterface, Prop, State, h } from '@stencil/core';

export interface IconBtnProps {
  label: string;
}

@Component({
  tag: 'cg-icon-btn',
  styleUrl: 'icon-btn.scss',
  scoped: true,
})
export class IconBtnComponent implements IconBtnProps, ComponentInterface {
  @Prop()
  public label!: string;

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
        class="icon-btn"
        aria-label={this.label}
        onFocus={() => this.onFocused()}
        onBlur={() => this.onBlurred()}
      >
        <span
          class={{
            'icon-btn__focus-outline': true,
            'icon-btn__focus-outline--visible': this.isFocused,
          }}
        />

        <slot />
      </button>
    );
  }
}
