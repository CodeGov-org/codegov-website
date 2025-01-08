import { Component, ComponentInterface, Host, Prop, h } from '@stencil/core';
import { Theme } from '../../../types';

@Component({
  tag: 'cg-focus-ring',
  styleUrl: 'focus-ring.scss',
  scoped: true,
})
export class FocusRingComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public isFocused?: boolean;

  @Prop({ reflect: true })
  public theme?: Theme;

  public render() {
    return (
      <Host
        class={{
          'focus-ring': true,
          'focus-ring--visible': this.isFocused ?? false,
          'focus-ring--success': this.theme === 'success',
          'focus-ring--error': this.theme === 'error',
        }}
      />
    );
  }
}
