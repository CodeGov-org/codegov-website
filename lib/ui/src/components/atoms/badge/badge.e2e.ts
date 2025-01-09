import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('cg-badge', () => {
  const content = 'Badge content';
  const compLoc = 'cg-badge';

  test('should render content with default theme', async ({ page }) => {
    await page.setContent(`
      <cg-badge>
        ${content}
      </cg-badge>
    `);

    const component = page.locator(compLoc);
    await expect(component).toHaveText(content);
    await expect(component).toHaveClass(/badge--primary/);
  });

  ['primary', 'success', 'error'].forEach(theme => {
    test(`should render content with ${theme} theme`, async ({ page }) => {
      await page.setContent(`
        <cg-badge theme="${theme}">
          ${content}
        </cg-badge>
      `);

      const component = page.locator(compLoc);
      await expect(component).toHaveText(content);
      await expect(component).toHaveClass(new RegExp(`badge--${theme}`));
    });
  });

  test('should throw error for an invalid theme', async ({ page }) => {
    let errorThrown = false;
    page.on('pageerror', error => {
      if (error.message === 'Invalid theme: "garbage"') {
        errorThrown = true;
      }
    });

    await page.setContent(`
      <cg-badge theme="garbage">
        ${content}
      </cg-badge>
    `);

    expect(errorThrown).toBe(true);
  });
});
