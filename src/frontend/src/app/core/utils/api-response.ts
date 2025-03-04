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

export class ApiError extends Error {
  public readonly code: number;
  public readonly message: string;

  constructor(err: Err) {
    super(`${err.code}: ${err.message}`);

    this.code = err.code;
    this.message = err.message;
  }
}

export function handleErr<T>(res: ApiResponse<T>): T {
  if (isErr(res)) {
    throw new ApiError(res.err);
  }

  return res.ok;
}
