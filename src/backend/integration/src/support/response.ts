import { type Err } from '@cg/backend';

export interface ApiSuccessResponse<T> {
  ok: T;
}

export interface ApiErrorResponse {
  err: Err;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function extractErrResponse<T>(response: ApiResponse<T>): Err {
  if ('err' in response) {
    return response.err;
  }

  const err = new Error('Expected `err` response', { cause: response });
  console.error(err);
  throw err;
}

export type OkResponse<T> = T extends ApiSuccessResponse<infer U> ? U : never;

export function extractOkResponse<T>(response: ApiResponse<T>): T {
  if ('ok' in response) {
    return response.ok;
  }

  const err = new Error('Expected `ok` response', { cause: response });
  console.error(err);
  throw err;
}
