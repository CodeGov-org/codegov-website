import {
  Component,
  ComponentInterface,
  Element,
  Host,
  Listen,
  Method,
  Prop,
  State,
  h,
} from '@stencil/core';
import { quickAnimation, quickReverseAnimation } from '../../../animations';

let menuId = 0;
let triggerId = 0;

const menuContainerAnimation: PropertyIndexedKeyframes = {
  opacity: ['0', '1'],
};

@Component({
  tag: 'cg-dropdown',
  styleUrl: 'dropdown.scss',
  scoped: true,
})
export class DropdownComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public anchorAlign: 'left' | 'right' = 'left';

  @Element()
  private host!: Element;

  @State()
  private isOpen = false;

  private menuId = `menu-${menuId++}`;
  private triggerId = `trigger-${triggerId++}`;
  private triggerElem!: HTMLCgDropdownTriggerElement;
  private menuElem!: HTMLCgDropdownMenuElement;
  private menuContainerElem!: HTMLDivElement;

  @Listen('click', { target: 'document' })
  public onClickOutside(event: Event): void {
    if (this.isOpen && !this.host.contains(event.target as Node)) {
      this.close();
    }
  }

  @Listen('menuItemClick')
  public onMenuItemClick(): void {
    this.close();
  }

  @Listen('dropdownTriggerClick')
  public onTriggerClicked(): void {
    this.toggle();
  }

  @Method()
  public async toggle(): Promise<void> {
    this.setIsOpen(!this.isOpen);
  }

  @Method()
  public async open(): Promise<void> {
    this.setIsOpen(true);
  }

  @Method()
  public async close(): Promise<void> {
    this.setIsOpen(false);
  }

  public connectedCallback(): void {
    const triggerElem = this.host.querySelector<HTMLCgDropdownTriggerElement>(
      'cg-dropdown-trigger',
    );
    this.setTriggerElem(triggerElem);

    const menuElem =
      this.host.querySelector<HTMLCgDropdownMenuElement>('cg-dropdown-menu');
    this.setMenuElem(menuElem);

    this.triggerElem.menuId = this.menuId;
    this.triggerElem.triggerId = this.triggerId;

    this.menuElem.menuId = this.menuId;
    this.menuElem.triggerId = this.triggerId;
  }

  public render() {
    return (
      <Host class="dropdown">
        <slot name="dropdownTrigger" />

        <div
          class={{
            'dropdown__menu-container': true,
            'dropdown__menu-container--right': this.anchorAlign === 'right',
          }}
          ref={elem => this.setMenuContainerElem(elem)}
        >
          <slot name="dropdownMenu" />
        </div>
      </Host>
    );
  }

  private setTriggerElem(elem: HTMLCgDropdownTriggerElement | null): void {
    if (!elem) {
      throw new Error('Trigger element not found');
    }

    this.triggerElem = elem;
  }

  private setMenuElem(elem: HTMLCgDropdownMenuElement | null): void {
    if (!elem) {
      throw new Error('Menu element not found');
    }

    this.menuElem = elem;
  }

  private setMenuContainerElem(elem?: HTMLDivElement): void {
    if (!elem) {
      throw new Error('Menu container element not found');
    }

    if (elem !== this.menuContainerElem) {
      this.menuContainerElem = elem;

      this.menuContainerElem.style.display = 'none';
      this.menuContainerElem.hidden = true;
      this.menuContainerElem.style.opacity = '0';
    }
  }

  private async setIsOpen(isOpen: boolean): Promise<void> {
    this.isOpen = isOpen;
    this.triggerElem.isOpen = isOpen;

    if (isOpen) {
      await this.openAnimation();
    } else {
      await this.closeAnimation();
    }
  }

  private async openAnimation(): Promise<void> {
    this.menuContainerElem.style.display = 'block';
    this.menuContainerElem.hidden = false;

    await this.menuContainerElem.animate(menuContainerAnimation, quickAnimation)
      .finished;

    this.menuContainerElem.style.opacity = '1';
  }

  private async closeAnimation(): Promise<void> {
    await this.menuContainerElem.animate(
      menuContainerAnimation,
      quickReverseAnimation,
    ).finished;

    this.menuContainerElem.style.display = 'none';
    this.menuContainerElem.hidden = true;
    this.menuContainerElem.style.opacity = '0';
  }
}
