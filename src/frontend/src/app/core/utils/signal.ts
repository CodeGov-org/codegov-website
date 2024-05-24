import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subscribable } from 'rxjs';

export function toSyncSignal<T>(
  source: Observable<T> | Subscribable<T>,
): Signal<T> {
  return toSignal(source, { requireSync: true });
}
