import { Component, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'cg-focus-ring',
  styleUrl: 'focus-ring.scss',
  scoped: true,
})
export class FocusRingComponent {
  @Prop()
  public isFocused = false;

  public render() {
    return (
      <Host
        class={{
          'focus-ring': true,
          'focus-ring--visible': this.isFocused,
        }}
      />
    );
  }
}
