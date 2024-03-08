/* eslint-disable @typescript-eslint/no-explicit-any */

type CustomElementFn = () => void;

interface Constructor {
  new (...args: any[]): any;
  [key: string]: any;
}

export function DefineCustomElement(defineCustomElementFn: CustomElementFn) {
  return function (cls: Constructor) {
    defineCustomElementFn();
    return cls;
  };
}
