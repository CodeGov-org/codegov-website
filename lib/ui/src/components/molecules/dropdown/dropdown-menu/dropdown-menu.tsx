import { Component, ComponentInterface, Host, Prop, h } from '@stencil/core';

@Component({
  tag: 'cg-dropdown-menu',
  styleUrl: 'dropdown-menu.scss',
  scoped: true,
})
export class MenuComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public menuId?: string;

  @Prop({ reflect: true })
  public triggerId?: string;

  public render() {
    return (
      <Host
        class="dropdown-menu"
        role="menu"
        aria-labelledby={this.triggerId}
        id={this.menuId}
      >
        <slot />
      </Host>
    );
  }
}
