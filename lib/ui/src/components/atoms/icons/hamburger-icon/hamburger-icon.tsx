import { Component, ComponentInterface, h } from '@stencil/core';

@Component({
  tag: 'cg-hamburger-icon',
  scoped: true,
})
export class HamburgerIconComponent implements ComponentInterface {
  public render() {
    return (
      <svg class="icon" viewBox="2 2 12 12">
        <path
          fill-rule="evenodd"
          d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"
        />
      </svg>
    );
  }
}
