import { Component, ComponentInterface, h } from '@stencil/core';

@Component({
  tag: 'cg-loading-icon',
  scoped: true,
})
export class LoadingIconComponent implements ComponentInterface {
  public render() {
    return (
      <svg class="icon" viewBox="10 10 80 80">
        <circle
          cx="50"
          cy="50"
          r="32"
          stroke="currentColor"
          stroke-dasharray="50.26548245743669 50.26548245743669"
          stroke-linecap="round"
          stroke-width="10px"
          fill="none"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            repeatCount="indefinite"
            dur="1.5384615384615383s"
            keyTimes="0;1"
            values="0 50 50;360 50 50"
          ></animateTransform>
        </circle>
      </svg>
    );
  }
}
