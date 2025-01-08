import {
  Component,
  effect,
  EffectRef,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  input,
  InputSignal,
  NgZone,
} from '@angular/core';
import { DefineCustomElement } from './define-custom-element';

export function defineCustomElementComponent<T>(
  defineCustomElement: () => void,
) {
  @DefineCustomElement(defineCustomElement)
  class CustomElementComponent {
    public readonly ngZone = inject(NgZone);
    public readonly elementRef = inject<ElementRef<T>>(ElementRef<T>);

    public elemProxyEffect<K extends keyof T>(
      input: InputSignal<T[K]>,
      property: K,
    ): EffectRef {
      return effect(() => {
        const value = input();

        this.ngZone.runOutsideAngular(() => {
          this.elementRef.nativeElement[property] = value;
        });
      });
    }
  }

  return CustomElementComponent;
}

export function defineCustomLinkElementComponent<
  T extends { href: string; isExternal?: boolean },
>(defineCustomElement: () => void) {
  @Component({ template: '' })
  class CustomLinkElementComponent extends defineCustomElementComponent<T>(
    defineCustomElement,
  ) {
    public readonly routerLink = input<string | string[]>();
    public readonly href = input<T['href']>();
    public readonly isExternal = input<T['isExternal']>(false);

    // prevent the `href` from being followed when clicked if it's not explicitly set.
    // this happens when `routerLink` is set.
    @HostListener('click', ['$event'])
    public onClick(event: Event): void {
      if (!this.hasExplicitHref) {
        event.preventDefault();
      }
    }

    // prevent the host element from being focused.
    // this happens when `routerLink` is set.
    @HostBinding('attr.tabindex')
    public tabIndex = -1;

    public hasExplicitHref = false;

    constructor() {
      super();

      // when `routerLink` is set, proxy the value to the `href` attribute
      // for accessibility.
      effect(() => {
        const routerLink = this.routerLink();

        if (routerLink) {
          this.ngZone.runOutsideAngular(() => {
            const href =
              typeof routerLink === 'string'
                ? routerLink
                : routerLink.join('/');

            this.elementRef.nativeElement.href = href;
          });
        }
      });

      effect(() => {
        // see onClick for why this is necessary
        this.hasExplicitHref = true;
        const href = this.href();

        if (href) {
          this.ngZone.runOutsideAngular(() => {
            this.elementRef.nativeElement.href = href;
          });
        }
      });
    }

    public elemProxyEffect<K extends keyof T>(
      input: InputSignal<T[K]>,
      property: K,
    ): EffectRef {
      return effect(() => {
        const value = input();

        this.ngZone.runOutsideAngular(() => {
          this.elementRef.nativeElement[property] = value;
        });
      });
    }
  }

  return CustomLinkElementComponent;
}
