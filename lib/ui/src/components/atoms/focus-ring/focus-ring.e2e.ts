import { test } from '@stencil/playwright';
import { expect } from '@playwright/test';

test.describe('cg-focus-ring', () => {
  const compLoc = 'cg-focus-ring';

  test('should render unfocused focus ring with default theme', async ({
    page,
  }) => {
    await page.setContent(`<cg-focus-ring />`);

    const component = page.locator(compLoc);

    await expect(component).not.toHaveClass(/focus-ring--visible/);
    await expect(component).toHaveClass(/focus-ring--primary/);
  });

  test('should render focused focus ring with default theme', async ({
    page,
  }) => {
    await page.setContent(`<cg-focus-ring is-focused />`);

    const component = page.locator(compLoc);

    await expect(component).toHaveClass(/focus-ring--visible/);
    await expect(component).toHaveClass(/focus-ring--primary/);
  });

  test('should render unfocused focus ring when isFocused is false', async ({
    page,
  }) => {
    await page.setContent(`<cg-focus-ring is-focused="false" />`);

    const component = page.locator(compLoc);

    await expect(component).not.toHaveClass(/focus-ring--visible/);
  });

  ['', 'true', 'string'].forEach(value => {
    test(`should render focused focus ring when isFocused is ${value}`, async ({
      page,
    }) => {
      await page.setContent(`<cg-focus-ring is-focused="${value}" />`);

      const component = page.locator(compLoc);

      await expect(component).toHaveClass(/focus-ring--visible/);
    });
  });

  ['primary', 'success', 'error'].forEach(theme => {
    test(`should render focus ring with ${theme} theme`, async ({ page }) => {
      await page.setContent(`<cg-focus-ring theme="${theme}" />`);

      const component = page.locator(compLoc);

      await expect(component).not.toHaveClass(/focus-ring--visible/);
      await expect(component).toHaveClass(new RegExp(`focus-ring--${theme}`));
    });

    test(`should render focused focus ring with ${theme} theme`, async ({
      page,
    }) => {
      await page.setContent(`<cg-focus-ring theme="${theme}" is-focused />`);

      const component = page.locator(compLoc);

      await expect(component).toHaveClass(/focus-ring--visible/);
      await expect(component).toHaveClass(new RegExp(`focus-ring--${theme}`));
    });
  });

  test('should throw error for an invalid theme', async ({ page }) => {
    let errorThrown = false;
    page.on('pageerror', error => {
      if (error.message === 'Invalid theme provided: "garbage"') {
        errorThrown = true;
      }
    });

    await page.setContent(`<cg-focus-ring theme="garbage" />`);

    expect(errorThrown).toBe(true);
  });
});
