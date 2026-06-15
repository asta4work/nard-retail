import { expect, test } from '@playwright/test';

const authenticatedUser = {
  id: 1,
  name: 'Responsive Test',
  email: 'responsive@example.com',
  role: 'admin',
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem('access_token', 'responsive-test-token');
    localStorage.setItem('user', JSON.stringify(user));
  }, authenticatedUser);
});

for (const width of [360, 768]) {
  test(`authenticated shell fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/cart');

    const main = page.locator('main.authenticated');
    const menuToggle = page.locator('.menu-toggle');
    const sidebar = page.locator('.sidebar');

    await expect(main).toBeVisible();
    await expect(menuToggle).toBeVisible();

    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      mainLeft: document.querySelector('main')?.getBoundingClientRect().left,
      mainWidth: document.querySelector('main')?.getBoundingClientRect().width,
    }));

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.mainLeft).toBe(0);
    expect(layout.mainWidth).toBe(layout.viewportWidth);

    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(sidebar).toHaveClass(/open/);
    await expect(page.locator('.nav-backdrop')).toBeVisible();

    await page.locator('.nav-backdrop').evaluate((backdrop: HTMLButtonElement) => backdrop.click());
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
}
