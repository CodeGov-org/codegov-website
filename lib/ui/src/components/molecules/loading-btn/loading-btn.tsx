import { Component, ComponentInterface, Host, Prop, h } from '@stencil/core';
import { ButtonType, Theme } from '../../../types';

@Component({
  tag: 'cg-loading-btn',
  styleUrl: 'loading-btn.scss',
  scoped: true,
})
export class LoadingBtnComponent implements ComponentInterface {
  @Prop({ reflect: true })
  public type: ButtonType = 'button';

  @Prop({ reflect: true })
  public theme?: Theme;

  @Prop({ reflect: true })
  public isLoading?: boolean;

  @Prop({ reflect: true })
  public disabled?: boolean;

  public render() {
    return (
      <Host>
        <cg-text-btn
          type={this.type}
          theme={this.theme}
          disabled={this.disabled || this.isLoading}
        >
          {this.isLoading && (
            <cg-loading-icon
              aria-label="Loading"
              class="loading-btn__icon icon-xxl"
            />
          )}

          <div
            aria-hidden={this.isLoading}
            class={{
              'loading-btn__text--transparent': this.isLoading ?? false,
            }}
          >
            <slot />
          </div>
        </cg-text-btn>
      </Host>
    );
  }
}
