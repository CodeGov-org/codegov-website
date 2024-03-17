import { Component, ComponentInterface, Host, h } from '@stencil/core';

@Component({
  tag: 'cg-card',
  styleUrl: 'card.scss',
  scoped: true,
})
export class CardComponent implements ComponentInterface {
  public render() {
    return (
      <Host class="card">
        <div class="card__title">
          <slot name="cardTitle" />
        </div>

        <slot name="cardContent" />
      </Host>
    );
  }
}
