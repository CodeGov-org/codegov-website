import { Component, Host, State, h } from '@stencil/core';
import { quickAnimation } from '../../animations';

@Component({
  tag: 'cg-collapsible',
  styleUrl: 'collapsible.scss',
  scoped: true,
})
export class CollapsibleComponent {
  @State()
  public isOpen = false;

  private contentElem!: HTMLDivElement;

  public async onTriggerClicked(): Promise<void> {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      await this.openAnimation();
    } else {
      await this.closeAnimation();
    }
  }

  public render() {
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

  private setContentElem(elem?: HTMLDivElement): void {
    if (!elem) {
      throw new Error('Content element not found');
    }

    if (elem !== this.contentElem) {
      this.contentElem = elem;

      this.contentElem.style.display = 'none';
      this.contentElem.hidden = true;
      this.contentElem.style.maxHeight = '0';
    }
  }

  private async openAnimation(): Promise<void> {
    this.contentElem.style.display = 'block';
    this.contentElem.hidden = false;

    await this.contentElem.animate(
      {
        maxHeight: ['0', `${this.contentElem.scrollHeight}px`],
      },
      quickAnimation,
    ).finished;

    this.contentElem.style.maxHeight = `${this.contentElem.scrollHeight}px`;
  }

  private async closeAnimation(): Promise<void> {
    await this.contentElem.animate(
      {
        maxHeight: [`${this.contentElem.scrollHeight}px`, '0'],
      },
      quickAnimation,
    ).finished;

    this.contentElem.style.display = 'none';
    this.contentElem.hidden = true;
    this.contentElem.style.maxHeight = '0';
  }
}
