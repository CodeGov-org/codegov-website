import {
  AttachInternals,
  Component,
  ComponentInterface,
  Host,
  Method,
  Prop,
  State,
  Watch,
  h,
} from '@stencil/core';

@Component({
  tag: 'cg-text-area',
  styleUrl: 'text-area.scss',
  formAssociated: true,
  scoped: true,
})
export class TextArea implements ComponentInterface {
  @Prop({ reflect: true })
  public value?: string;

  @Prop({ reflect: true })
  public placeholder?: string;

  @Prop({ reflect: true })
  public disabled?: boolean;

  @Prop({ reflect: true })
  public readonly?: boolean;

  @State()
  private isFocused = false;

  @AttachInternals()
  private internals!: ElementInternals;

  private inputElem!: HTMLTextAreaElement;

  @Watch('value')
  public valueChanged(): void {
    this.setTextAreaHeight();
  }

  @Method()
  public async select(): Promise<void> {
    this.inputElem.select();
  }

  public componentWillLoad() {
    this.internals.setFormValue(this.value ?? null);
  }

  public componentDidLoad() {
    this.setTextAreaHeight();
  }

  public render() {
    return (
      <Host class="text-area">
        <cg-focus-ring isFocused={this.isFocused} />

        <textarea
          class="text-area__input"
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

  private setInputElem(elem?: HTMLTextAreaElement): void {
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

  private setTextAreaHeight(): void {
    this.inputElem.style.height = 'auto';
    this.inputElem.style.height = `${this.inputElem.scrollHeight}px`;
  }
}
