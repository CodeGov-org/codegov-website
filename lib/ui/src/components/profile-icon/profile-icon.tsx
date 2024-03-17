import { Component, ComponentInterface, h } from '@stencil/core';

@Component({
  tag: 'cg-profile-icon',
  scoped: true,
})
export class ProfileIconComponent implements ComponentInterface {
  public render() {
    return (
      <svg class="icon" viewBox="0 0 16 16">
        <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6" />
      </svg>
    );
  }
}
