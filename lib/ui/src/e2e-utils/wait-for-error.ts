import { Page } from '@playwright/test';

export async function waitForError<T extends Promise<void>>(
  page: Page,
  errorMessage: string,
  doFn: T,
): Promise<Error> {
  const [error] = await Promise.all([
    page.waitForEvent('pageerror', error => error.message === errorMessage),
    doFn,
  ]);

  return error;
}
