import { type Err } from '@cg/backend';

interface ApiSuccessResponse<T> {
  ok: T;
}

interface ApiErrorResponse {
  err: Err;
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const extractOkResponse = <T>(response: ApiResponse<T>): T => {
  if ('ok' in response) {
    return response.ok;
  }

  const err = new Error(
    `Expected \`ok\` response, got \`${JSON.stringify(response)}\``,
  );
  console.error(err);
  throw err;
};
