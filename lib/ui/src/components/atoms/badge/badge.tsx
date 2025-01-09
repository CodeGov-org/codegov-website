import { Component, ComponentInterface, Host, Prop, h } from '@stencil/core';
import { Theme } from '../../../types';
import { coerceTheme } from '../../../coercion';

@Component({
  tag: 'cg-badge',
  styleUrl: 'badge.scss',
  scoped: true,
})
export class BadgeComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public get theme(): Theme {
    return this.#theme;
  }
  public set theme(value: Theme) {
    this.#theme = coerceTheme(value);
  }
  #theme: Theme = 'primary';

  public render() {
    return (
      <Host class={`badge badge--${this.theme}`}>
        <slot />
      </Host>
    );
  }
}
