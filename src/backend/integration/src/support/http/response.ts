import { Response } from '@dfinity/response-verification';
import { HttpResponse } from '@cg/backend';

export const mapFromCanisterResponse = (response: HttpResponse): Response => {
  return {
    statusCode: response.status_code,
    headers: response.headers,
    body: Uint8Array.from(response.body),
  };
};

export const filterCertificateHeaders = (response: Response): Response => {
  return {
    ...response,
    headers: response.headers.filter(
      ([key]) =>
        key.toLowerCase() !== 'ic-certificateexpression' &&
        key.toLowerCase() !== 'ic-certificate',
    ),
  };
};
