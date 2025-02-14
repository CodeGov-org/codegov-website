import {
  Component,
  h,
  AttachInternals,
  State,
  Prop,
  Method,
  Host,
  ComponentInterface,
} from '@stencil/core';

@Component({
  tag: 'cg-text-input',
  styleUrl: 'text-input.scss',
  formAssociated: true,
  scoped: true,
})
export class TextInput implements ComponentInterface {
  @Prop({ reflect: true })
  public value?: string;

  @Prop({ reflect: true })
  public placeholder?: string;

  @Prop({ reflect: true })
  public readonly?: boolean;

  @Prop({ reflect: true })
  public disabled?: boolean;

  @State()
  private isFocused = false;

  @AttachInternals()
  private internals!: ElementInternals;

  private inputElem!: HTMLInputElement;

  @Method()
  public async select(): Promise<void> {
    this.inputElem.select();
  }

  public componentWillLoad() {
    this.internals.setFormValue(this.value ?? null);
  }

  public render() {
    return (
      <Host class="text-input">
        <cg-focus-ring isFocused={this.isFocused} />

        <input
          type="text"
          class="text-input__input"
          value={this.value}
          placeholder={this.placeholder}
          readOnly={this.readonly}
          disabled={this.disabled}
          ref={elem => this.setInputElem(elem)}
          onInput={event => this.handleChange(event)}
          onFocus={() => this.onFocused()}
          onBlur={() => this.onBlurred()}
        />
      </Host>
    );
  }

  private onFocused(): void {
    this.isFocused = true;
  }

  private onBlurred(): void {
    this.isFocused = false;
  }

  private setInputElem(elem?: HTMLInputElement): void {
    if (!elem) {
      throw new Error('Input element not found');
    }

    if (elem !== this.inputElem) {
      this.inputElem = elem;
    }
  }

  private handleChange(event: InputEvent): void {
    const target = event.target as HTMLInputElement | null;

    this.value = target?.value;
    this.internals.setFormValue(this.value ?? null);
  }
}
