import { Component, ComponentInterface, h } from '@stencil/core';

@Component({
  tag: 'cg-logo-icon',
  scoped: true,
})
export class LogoIconComponent implements ComponentInterface {
  public render() {
    return (
      <svg class="icon" viewBox="0 0 400 400">
        <path
          fill="#00aeef"
          d="M200 0C89.54 0 0 89.54 0 200s89.54 200 200 200 200-89.54 200-200S310.46 0 200 0Zm-.38 377.31c-97.87 0-177.22-79.34-177.22-177.22S101.74 22.88 199.62 22.88c78.38 0 144.87 50.89 168.25 121.43h-77.72c-18.73-30.33-52.27-50.54-90.53-50.54-58.72 0-106.33 47.61-106.33 106.33s47.61 106.33 106.33 106.33c38.34 0 71.93-20.29 90.64-50.72h77.66c-23.32 70.63-89.86 121.61-168.3 121.61Zm0-141.77c-19.57 0-35.44-15.87-35.44-35.44s15.87-35.44 35.44-35.44h173.66c2.33 11.45 3.55 23.3 3.55 35.44s-1.23 23.99-3.55 35.44H199.62Z"
        />
      </svg>
    );
  }
}
