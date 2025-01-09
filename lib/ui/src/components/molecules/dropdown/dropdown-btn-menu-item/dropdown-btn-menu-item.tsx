import {
  Component,
  ComponentInterface,
  Event,
  EventEmitter,
  Listen,
  State,
  h,
} from '@stencil/core';

@Component({
  tag: 'cg-dropdown-btn-menu-item',
  styleUrl: 'dropdown-btn-menu-item.scss',
  scoped: true,
})
export class DropdownLinkMenuItemComponent implements ComponentInterface {
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
      <button
        class="dropdown-btn-menu-item"
        type="button"
        onFocus={() => this.onFocused()}
        onBlur={() => this.onBlurred()}
      >
        <cg-focus-ring isFocused={this.isFocused} />

        <slot />
      </button>
    );
  }

  private onFocused(): void {
    this.isFocused = true;
  }

  private onBlurred(): void {
    this.isFocused = false;
  }
}
