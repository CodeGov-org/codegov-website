import { Err } from '@cg/backend';

export interface ApiOkResponse<T> {
  ok: T;
}

export interface ApiErrResponse {
  err: Err;
}

export type ApiResponse<T> = ApiOkResponse<T> | ApiErrResponse;

export function isOk<T>(res: ApiResponse<T>): res is ApiOkResponse<T> {
  return 'ok' in res;
}

export function isErr<T>(res: ApiResponse<T>): res is ApiErrResponse {
  return 'err' in res;
}
