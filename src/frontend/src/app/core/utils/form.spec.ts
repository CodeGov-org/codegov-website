import { Observable, delay, of } from 'rxjs';

import { createTestScheduler } from '../../testing';
import { batchApiCall } from './form';

describe('batchApiCall()', () => {
  it('should debounce values', () => {
    const testScheduler = createTestScheduler();

    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;

      const changes = ' a 1500ms c 1500ms a b c a b c a b 1500ms  ';
      const expected = '  1500ms a 1500ms c - - - - - - - 1500ms b';
      const values = { a: 'a', b: 'b', c: 'c' };

      const source$ = cold(changes, values);
      const apiCall = (value: string): Observable<string> => of(value);

      const output$ = source$.pipe(batchApiCall(apiCall, testScheduler));

      expectObservable(output$).toBe(expected, values);
    });
  });

  it('should throttle values while API calls are in progress', () => {
    const testScheduler = createTestScheduler();

    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;

      const changes = ' a 1500ms a 1500ms c 1500ms     3000ms  ';
      const expected = '  1500ms   1500ms   1500ms a - 3000ms c';
      const values = { a: 'a', b: 'b', c: 'c' };

      const source$ = cold(changes, values);
      const apiCall = (value: string): Observable<string> =>
        of(value).pipe(delay(3_000));

      const output$ = source$.pipe(batchApiCall(apiCall, testScheduler));

      expectObservable(output$).toBe(expected, values);
    });
  });

  it('should filter duplicate values', () => {
    const testScheduler = createTestScheduler();

    testScheduler.run(helpers => {
      const { cold, expectObservable } = helpers;

      const changes = ' a 1500ms a 1500ms b 1500ms b 1500ms a 1500ms a        ';
      const expected = '  1500ms a 1500ms - 1500ms b 1500ms - 1500ms a 1500ms ';
      const values = { a: 'a', b: 'b' };

      const source$ = cold(changes, values);
      const apiCall = (value: string): Observable<string> => of(value);

      const output$ = source$.pipe(batchApiCall(apiCall, testScheduler));

      expectObservable(output$).toBe(expected, values);
    });
  });
});
