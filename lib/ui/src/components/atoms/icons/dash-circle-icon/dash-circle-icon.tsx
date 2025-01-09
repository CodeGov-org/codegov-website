import { Component, ComponentInterface, h } from '@stencil/core';

@Component({
  tag: 'cg-dash-circle-icon',
  scoped: true,
})
export class DashCircleIconComponent implements ComponentInterface {
  public render() {
    return (
      <svg class="icon" viewBox="-0.5 -0.5 17 17">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
        <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8" />
      </svg>
    );
  }
}
