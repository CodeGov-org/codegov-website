import { Component, ComponentInterface, Host, Prop, h } from '@stencil/core';
import { Theme } from '../../../types';
import { coerceTheme } from '../../../coercion';

@Component({
  tag: 'cg-focus-ring',
  styleUrl: 'focus-ring.scss',
  scoped: true,
})
export class FocusRingComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public get theme(): Theme {
    return this.#theme;
  }
  public set theme(value: Theme) {
    this.#theme = coerceTheme(value);
  }
  #theme: Theme = 'primary';

  @Prop({ reflect: true })
  public isFocused: boolean = false;

  public render() {
    return (
      <Host
        class={{
          'focus-ring': true,
          'focus-ring--visible': this.isFocused,
          [`focus-ring--${this.theme}`]: true,
        }}
      />
    );
  }
}
