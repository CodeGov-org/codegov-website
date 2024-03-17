import {
  Component,
  Event,
  EventEmitter,
  Listen,
  Prop,
  State,
  h,
} from '@stencil/core';

@Component({
  tag: 'cg-dropdown-link-menu-item',
  styleUrl: 'dropdown-link-menu-item.scss',
  scoped: true,
})
export class DropdownLinkMenuItemComponent {
  @Prop()
  public href!: string;

  @Prop()
  public isExternal? = false;

  @Event()
  public menuItemClick!: EventEmitter<void>;

  @State()
  private isFocused = false;

  @Listen('click')
  public onClick(): void {
    this.menuItemClick.emit();
  }

  public render() {
    return (
      <a
        class="dropdown-link-menu-item"
        role="menuitem"
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
