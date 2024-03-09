import { Component, Host, State, h } from '@stencil/core';

const animationOptions: KeyframeAnimationOptions = {
  duration: 200,
  easing: 'ease-in-out',
};

@Component({
  tag: 'cg-collapsible',
  styleUrl: 'collapsible.scss',
  scoped: true,
})
export class CollapsibleComponent {
  @State()
  public isOpen = false;

  public onTriggerClicked(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.contentElem.hidden = false;
      this.contentElem.animate(
        {
          maxHeight: ['0', `${this.contentElem.scrollHeight}px`],
        },
        animationOptions,
      ).onfinish = () => {
        this.contentElem.style.maxHeight = `${this.contentElem.scrollHeight}px`;
      };
    } else {
      this.contentElem.animate(
        {
          maxHeight: [`${this.contentElem.scrollHeight}px`, '0'],
        },
        animationOptions,
      ).onfinish = () => {
        this.contentElem.hidden = true;
        this.contentElem.style.maxHeight = '0';
      };
    }
  }

  private setContentElem(elem?: HTMLDivElement): void {
    if (!elem) {
      throw new Error('Content element not found');
    }

    if (elem !== this.contentElem) {
      this.contentElem = elem;
      this.contentElem.style.maxHeight = '0';
      this.contentElem.hidden = true;
    }
  }
  private contentElem!: HTMLDivElement;

  render() {
    return (
      <Host class="collapsible">
        <cg-text-btn
          class="collapsible__trigger"
          onClick={() => this.onTriggerClicked()}
        >
          <div class="collapsible__trigger-content">
            <slot name="collapsibleTrigger" />

            <cg-chevron-icon
              class={{
                'collapsible__trigger-chevron': true,
                'collapsible__trigger-chevron--open': this.isOpen,
              }}
            />
          </div>
        </cg-text-btn>

        <div
          ref={elem => this.setContentElem(elem)}
          class="collapsible__content"
          aria-hidden={this.isOpen ? 'false' : 'true'}
        >
          <slot name="collapsibleContent" />
        </div>
      </Host>
    );
  }
}
