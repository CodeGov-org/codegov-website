import { Request } from '@dfinity/response-verification';
import type { HttpRequest } from '@cg/backend';

export const CERTIFICATE_VERSION = 2;

export const mapToCanisterRequest = (request: Request): HttpRequest => {
  return {
    url: request.url.toString(),
    method: request.method.toString(),
    headers: request.headers,
    body: request.body,
    certificate_version: [CERTIFICATE_VERSION],
  };
};
