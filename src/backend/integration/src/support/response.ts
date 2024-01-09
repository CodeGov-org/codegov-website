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

  throw new Error('Expected `err` response', { cause: response });
}

export type OkResponse<T> = T extends ApiSuccessResponse<infer U> ? U : never;

export function extractOkResponse<T>(response: ApiResponse<T>): T {
  if ('ok' in response) {
    return response.ok;
  }

  throw new Error('Expected `ok` response', { cause: response });
}
