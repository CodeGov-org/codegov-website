import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';

import { filterNotNil } from './nil';

export function routeParam(name: string): Observable<string> {
  const route = inject(ActivatedRoute);

  return route.paramMap.pipe(
    map(params => params.get(name)),
    filterNotNil(),
    takeUntilDestroyed(),
  );
}
