import { Component, h } from '@stencil/core';

@Component({
  tag: 'cg-chevron-icon',
})
export class ChevronIconComponent {
  public render() {
    return (
      <svg class="icon" viewBox="0 0 16 16">
        <path
          fill-rule="evenodd"
          d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"
        />
      </svg>
    );
  }
}
