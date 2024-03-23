import { Type } from '@angular/core';

export function DefineCustomElement<T>(defineCustomElementFn: () => void) {
  return function (cls: Type<T>) {
    defineCustomElementFn();
    return cls;
  };
}
