import { Err } from '@cg/backend';

export interface ApiOkResponse<T> {
  ok: T;
}

export interface ApiErrResponse {
  err: Err;
}

export type ApiResponse<T> = ApiOkResponse<T> | ApiErrResponse;

export type Ok<T> = T extends ApiOkResponse<infer U> ? U : never;

export function isOk<T>(res: ApiResponse<T>): res is ApiOkResponse<T> {
  return 'ok' in res;
}

export function isErr<T>(res: ApiResponse<T>): res is ApiErrResponse {
  return 'err' in res;
}

export function extractOkResponse<T>(res: ApiResponse<T>): T {
  if (isErr(res)) {
    throw new Error(`${res.err.code}: ${res.err.message}`);
  }

  return res.ok;
}
