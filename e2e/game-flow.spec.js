import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/memory-game');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('plays a complete round from setup through results', async ({ page }) => {
  await page.getByRole('button', { name: 'Easy' }).click();
  await page.getByRole('button', { name: /Start game/ }).click();

  await expect(page.getByRole('status').filter({ hasText: /Ready|Set|Remember/ })).toBeVisible();
  await expect(page.locator('.game-stats').getByText(/Time: 0s/)).toBeVisible();
  await expect(page.locator('.preview-countdown')).toBeHidden({ timeout: 7_000 });

  const pairs = await page.locator('.card').evaluateAll(cards => {
    const grouped = {};
    cards.forEach(card => {
      const value = card.querySelector('.card-back')?.textContent;
      grouped[value] ||= [];
      grouped[value].push(card.dataset.cardId);
    });
    return Object.values(grouped);
  });

  for (const [index, [first, second]] of pairs.entries()) {
    await page.locator(`[data-card-id="${first}"]`).click();
    await page.waitForTimeout(100);
    await page.locator(`[data-card-id="${second}"]`).click();
    if (index < pairs.length - 1) {
      await expect(page.locator(`[data-card-id="${first}"]`)).toHaveClass(/matched/, { timeout: 3_000 });
    }
    await page.waitForTimeout(200);
  }

  await expect(page.getByText('Memory mastered')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('.grade-ring')).toContainText(/[SABC]/);
  await expect(page.locator('.score-breakdown')).toBeVisible();
  await page.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.preview-countdown')).toBeVisible();
});

test('quest progress advances once for a successful match', async ({ page }) => {
  await page.getByRole('button', { name: 'Easy' }).click();
  await page.getByRole('button', { name: /Start game/ }).click();
  await expect(page.locator('.preview-countdown')).toBeHidden({ timeout: 7_000 });

  const pair = await page.locator('.card').evaluateAll(cards => {
    const first = cards[0];
    const value = first.querySelector('.card-back')?.textContent;
    const second = cards.find(card => card !== first && card.querySelector('.card-back')?.textContent === value);
    return [first.dataset.cardId, second.dataset.cardId];
  });
  await page.locator(`[data-card-id="${pair[0]}"]`).click();
  await page.waitForTimeout(100);
  await page.locator(`[data-card-id="${pair[1]}"]`).click();
  await expect(page.locator(`[data-card-id="${pair[0]}"]`)).toHaveClass(/matched/);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('memoryGame_quests_v1')));
  const matchProgress = Object.entries(stored.progress).filter(([key]) => key.includes(':matches'));
  for (const [, progress] of matchProgress) expect(progress.value).toBe(1);
});

test('interactive controls have names and keyboard focus is visible', async ({ page }) => {
  const buttons = page.getByRole('button');
  for (let index = 0; index < await buttons.count(); index += 1) {
    await expect(buttons.nth(index)).not.toHaveAccessibleName('');
  }
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});

test('mobile setup and game board do not overflow horizontally', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile-only layout check');
  const setupOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(setupOverflow).toBe(false);
  await page.getByRole('button', { name: 'Easy' }).click();
  await page.getByRole('button', { name: /Start game/ }).click();
  const gameOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(gameOverflow).toBe(false);
});
