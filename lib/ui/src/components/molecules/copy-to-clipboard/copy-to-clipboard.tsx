import { Component, Host, Prop, State, h } from '@stencil/core';

@Component({
  tag: 'cg-copy-to-clipboard',
  styleUrl: 'copy-to-clipboard.scss',
  scoped: true,
})
export class CopyToClipboardComponent {
  @Prop()
  public value!: string;

  @State()
  private isCopied = false;

  private timeoutId: number | undefined;

  public render() {
    return (
      <Host class="copy-to-clipboard" aria-live="polite">
        <cg-text-input
          class="copy-to-clipboard__input"
          value={this.value}
          readonly
          ref={elem => this.setInputElem(elem)}
        />

        <cg-text-btn onClick={() => this.onClicked()}>
          {this.isCopied ? (
            <span class="copy-to-clipboard__btn-content">
              <cg-clipboard-check-icon
                aria-hidden="true"
                class="copy-to-clipboard__btn-icon"
              />
              <span>Copied!</span>
            </span>
          ) : (
            <span class="copy-to-clipboard__btn-content">
              <cg-clipboard-icon
                aria-hidden="true"
                class="copy-to-clipboard__btn-icon"
              />
              <span>Copy</span>
            </span>
          )}
        </cg-text-btn>
      </Host>
    );
  }

  private inputElem!: HTMLCgTextInputElement;

  private setInputElem(elem?: HTMLCgTextInputElement): void {
    if (!elem) {
      throw new Error('Input element not found');
    }

    if (elem !== this.inputElem) {
      this.inputElem = elem;
    }
  }

  private async onClicked(): Promise<void> {
    await this.inputElem.select();
    document.execCommand('copy');
    this.isCopied = true;

    window.clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(() => {
      this.resetBtn();
      this.timeoutId = undefined;
    }, 2_000);
  }

  private resetBtn(): void {
    this.isCopied = false;
  }
}
