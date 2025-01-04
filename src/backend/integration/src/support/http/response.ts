import { Response } from '@dfinity/response-verification';
import { HttpResponse } from '@cg/backend';

export const mapFromCanisterResponse = (response: HttpResponse): Response => {
  return {
    statusCode: response.status_code,
    headers: response.headers.map(([key, value]) => [key.toLowerCase(), value]),
    body: Uint8Array.from(response.body),
  };
};

export const upperCaseCertificateHeaders = (response: Response): Response => {
  return {
    ...response,
    headers: response.headers.map(([key, value]) =>
      key.toLowerCase() === 'ic-certificate'
        ? ['IC-Certificate', value]
        : [key, value],
    ),
  };
};
