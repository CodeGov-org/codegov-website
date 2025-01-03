import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { filterNotNil } from './nil';

export function routeParamSignal(name: string): Signal<string | undefined> {
  const route = inject(ActivatedRoute);

  return toSignal(
    route.paramMap.pipe(
      map(params => params.get(name)),
      filterNotNil(),
    ),
  );
}
