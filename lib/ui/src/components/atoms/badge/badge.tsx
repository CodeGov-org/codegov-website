import { Component, ComponentInterface, Host, Prop, h } from '@stencil/core';
import { Theme } from '../../../types';

@Component({
  tag: 'cg-badge',
  styleUrl: 'badge.scss',
  scoped: true,
})
export class BadgeComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public theme: Theme = 'primary';

  public render() {
    return (
      <Host class={`badge badge--${this.theme}`}>
        <slot />
      </Host>
    );
  }
}
