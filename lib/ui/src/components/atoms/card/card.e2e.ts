import { expect } from '@playwright/test';
import { test } from '@stencil/playwright';

test.describe('cg-card', () => {
  const title = 'Card title';
  const content = 'Card content';

  const compLoc = 'cg-card';
  const cardTitleLoc = '[slot="cardTitle"]';
  const cardContentLoc = '[slot="cardContent"]';

  test(`should render title & content`, async ({ page }) => {
    await page.setContent(`
      <cg-card>
        <div slot="cardTitle">${title}</div>
        <div slot="cardContent">${content}</div>
      </cg-card>
    `);

    const component = page.locator(compLoc);
    const cardTitle = component.locator(cardTitleLoc);
    const cardContent = component.locator(cardContentLoc);

    await expect(cardTitle).toHaveText(title);
    await expect(cardContent).toHaveText(content);
  });

  test(`should render title only`, async ({ page }) => {
    await page.setContent(`
      <cg-card>
        <div slot="cardTitle">${title}</div>
      </cg-card>
    `);

    const component = page.locator(compLoc);
    const cardTitle = component.locator(cardTitleLoc);
    const cardContent = component.locator(cardContentLoc);

    await expect(cardTitle).toHaveText(title);
    await expect(cardContent).not.toBeVisible();
  });

  test(`should render content only`, async ({ page }) => {
    await page.setContent(`
      <cg-card>
        <div slot="cardContent">${content}</div>
      </cg-card>
    `);

    const component = page.locator(compLoc);
    const cardTitle = component.locator(cardTitleLoc);
    const cardContent = component.locator(cardContentLoc);

    await expect(cardTitle).not.toBeVisible();
    await expect(cardContent).toHaveText(content);
  });
});
