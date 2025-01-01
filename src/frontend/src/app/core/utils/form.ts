import {
  BehaviorSubject,
  Observable,
  SchedulerLike,
  UnaryFunction,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  filter,
  pipe,
  take,
  tap,
  throttle,
} from 'rxjs';

export function batchApiCall<T, U>(
  apiCall: (value: T) => Observable<U>,
  scheduler?: SchedulerLike | undefined,
): UnaryFunction<Observable<T>, Observable<U>> {
  const apiCallInProgress = new BehaviorSubject<boolean>(false);

  return pipe(
    distinctUntilChanged(),
    debounceTime(1_500, scheduler),
    throttle(() =>
      apiCallInProgress.pipe(
        filter(inProgress => !inProgress),
        take(1),
      ),
    ),
    exhaustMap(value => {
      apiCallInProgress.next(true);

      return apiCall(value).pipe(
        tap(() => {
          apiCallInProgress.next(false);
        }),
      );
    }),
  );
}

export function boolToRadio(value: boolean | null | undefined): 0 | 1 | null {
  switch (value) {
    case true: {
      return 1;
    }

    case false: {
      return 0;
    }

    default: {
      return null;
    }
  }
}

export function radioToBool(value: 0 | 1 | null | undefined): boolean | null {
  switch (value) {
    case 1: {
      return true;
    }

    case 0: {
      return false;
    }

    default: {
      return null;
    }
  }
}
