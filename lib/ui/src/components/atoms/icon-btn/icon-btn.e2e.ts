import { test } from '@stencil/playwright';
import { expect } from '@playwright/test';
import { waitForError } from '../../../e2e-utils';

test.describe('cg-icon-btn', () => {
  const compLoc = 'cg-icon-btn';
  const iconLoc = 'cg-profile-icon';
  const focusRingLoc = 'cg-focus-ring';
  const buttonLoc = 'button';

  test('should render button with default attributes', async ({ page }) => {
    await page.setContent(`
      <cg-icon-btn aria-label="test">
        <cg-profile-icon />
      </cg-icon-btn>
    `);

    const component = page.locator(compLoc);

    await expect(component).toHaveAttribute('type', 'button');
    await expect(component).toHaveAttribute('aria-label', 'test');
    await expect(component).not.toHaveAttribute('disabled');
    await expect(component).not.toHaveAttribute('aria-haspopup');
    await expect(component).not.toHaveAttribute('aria-expanded');
    await expect(component).not.toHaveAttribute('aria-controls');

    await expect(component.locator(iconLoc)).toBeVisible();

    const focusRing = component.locator(focusRingLoc);
    const innerButton = component.locator(buttonLoc);

    await expect(focusRing).not.toHaveAttribute('is-focused');
    await innerButton.focus();
    await expect(focusRing).toHaveAttribute('is-focused');
    await innerButton.blur();
    await expect(focusRing).not.toHaveAttribute('is-focused');
  });

  test('should render button with custom attributes', async ({ page }) => {
    await page.setContent(`
      <cg-icon-btn
        type="submit"
        disabled
        aria-label="test"
        aria-haspopup="menu"
        aria-expanded
        aria-controls="menu-id"
      >
        <cg-profile-icon />
      </cg-icon-btn>
    `);

    const component = page.locator(compLoc);

    await expect(component).toHaveAttribute('type', 'submit');
    await expect(component).toHaveAttribute('aria-label', 'test');
    await expect(component).toHaveAttribute('disabled');
    await expect(component).toHaveAttribute('aria-haspopup', 'menu');
    await expect(component).toHaveAttribute('aria-expanded');
    await expect(component).toHaveAttribute('aria-controls', 'menu-id');

    await expect(component.locator(iconLoc)).toBeVisible();

    const focusRing = component.locator(focusRingLoc);
    const innerButton = component.locator(buttonLoc);

    await expect(focusRing).not.toHaveAttribute('is-focused');
    await innerButton.focus();
    await expect(focusRing).not.toHaveAttribute('is-focused');
    await innerButton.blur();
    await expect(focusRing).not.toHaveAttribute('is-focused');
  });

  test.fixme('should throw error for missing aria-label', async ({ page }) => {
    await waitForError(
      page,
      'Error: Empty string provided where a non-empty string was expected',
      page.setContent(`
        <cg-icon-btn>
          <cg-profile-icon />
        </cg-icon-btn>
      `),
    );
  });
});
