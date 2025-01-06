import {
  Component,
  ComponentInterface,
  Element,
  Event,
  EventEmitter,
  Listen,
  Prop,
  Watch,
  h,
} from '@stencil/core';

@Component({
  tag: 'cg-dropdown-trigger',
  styleUrl: 'dropdown-trigger.scss',
  scoped: true,
})
export class DropdownTriggerComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public menuId?: string;

  @Prop({ reflect: true })
  public triggerId?: string;

  @Prop({ reflect: true })
  public isOpen?: boolean;

  @Prop({ reflect: true })
  public isIconBtn?: boolean;

  @Prop({ reflect: true })
  public btnLabel?: string;

  @Watch('menuId')
  public onIdChange(): void {
    this.setBtnControls();
  }

  @Watch('triggerId')
  public onTriggerIdChange(): void {
    this.setBtnId();
  }

  @Watch('isOpen')
  public onIsOpenChange(): void {
    this.setBtnIsOpen();
  }

  @Element()
  public host!: Element;

  @Event()
  public dropdownTriggerClick!: EventEmitter<void>;

  private btnElem!: HTMLCgTextBtnElement | HTMLCgIconBtnElement;

  @Listen('click')
  public onClick(): void {
    this.dropdownTriggerClick.emit();
  }

  public render() {
    if (this.isIconBtn) {
      if (!this.btnLabel) {
        throw new Error(
          '`cg-dropdown-trigger` with `isIconBtn` must have a `btnLabel`',
        );
      }

      return (
        <cg-icon-btn
          ref={elem => this.setBtnElem(elem)}
          class="dropdown-trigger__btn"
          ariaLabel={this.btnLabel}
        >
          <slot />
        </cg-icon-btn>
      );
    }

    return (
      <cg-text-btn ref={elem => this.setBtnElem(elem)}>
        <span class="dropdown-trigger__text-btn">
          <slot />

          <cg-chevron-icon
            class={{
              'dropdown-trigger__chevron': true,
              'dropdown-trigger__chevron--open': this.isOpen ?? false,
            }}
          />
        </span>
      </cg-text-btn>
    );
  }

  private setBtnElem(
    btnElem?: HTMLCgTextBtnElement | HTMLCgIconBtnElement,
  ): void {
    if (!btnElem) {
      throw new Error(
        '`cg-dropdown-trigger` must have a `button` child element',
      );
    }

    if (btnElem !== this.btnElem) {
      this.btnElem = btnElem;
      this.setBtnAttributes();
    }
  }

  private setBtnAttributes(): void {
    this.btnElem.setAttribute('aria-haspopup', 'menu');

    this.setBtnIsOpen();
    this.setBtnId();
    this.setBtnControls();
  }

  private setBtnIsOpen(): void {
    const isOpen = this.isOpen ?? false;

    this.btnElem.setAttribute('aria-expanded', isOpen.toString());
  }

  private setBtnId(): void {
    if (this.triggerId) {
      this.btnElem.id = this.triggerId;
    }
  }

  private setBtnControls(): void {
    if (this.menuId) {
      this.btnElem.setAttribute('aria-controls', this.menuId);
    }
  }
}
