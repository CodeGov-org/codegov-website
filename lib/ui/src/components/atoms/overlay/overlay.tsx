import {
  Component,
  ComponentInterface,
  Element,
  Host,
  Prop,
  Watch,
  h,
} from '@stencil/core';
import { animation, reverseAnimation } from '../../../animations';

const overlayAnimation: PropertyIndexedKeyframes = {
  opacity: ['0', '1'],
};

@Component({
  tag: 'cg-overlay',
  styleUrl: 'overlay.scss',
  scoped: true,
})
export class OverlayComponent implements ComponentInterface {
  @Prop()
  public isOpen = false;

  @Element()
  public host!: HTMLElement;

  @Watch('isOpen')
  public async onIsOpenChanged(isOpen: boolean): Promise<void> {
    if (isOpen) {
      await this.openAnimation();
    } else {
      await this.closeAnimation();
    }
  }

  public render() {
    return (
      <Host class="overlay">
        <slot />
      </Host>
    );
  }

  private async openAnimation(): Promise<void> {
    this.host.style.display = 'block';
    this.host.hidden = false;

    await this.host.animate(overlayAnimation, animation).finished;

    this.host.style.opacity = '1';
  }

  private async closeAnimation(): Promise<void> {
    await this.host.animate(overlayAnimation, reverseAnimation).finished;

    this.host.style.display = 'none';
    this.host.hidden = true;
    this.host.style.opacity = '0';
  }
}
