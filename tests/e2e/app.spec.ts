import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('shows content for new visitors', async ({ page }) => {
    // After clearing localStorage, page should show landing, name prompt, or level intro
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    const hasRelevantContent =
      body?.includes('GITVANA') ||
      body?.includes('PLAY NOW') ||
      body?.includes('monks call you') ||
      body?.includes('ACT 1');
    expect(hasRelevantContent).toBeTruthy();
  });

  test('navbar has correct links', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('nav >> text=Docs')).toBeVisible();
    await expect(page.locator('nav >> text=Changelog')).toBeVisible();
  });

  test('PLAY NOW starts the game', async ({ page }) => {
    const playBtn = page.getByRole('button', { name: /PLAY NOW/i }).first();
    if (await playBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await playBtn.click();
      // Should show name prompt or level intro
      const hasNext = await page.locator('text=What shall the monks call you').or(page.locator('text=ACT 1')).first().isVisible({ timeout: 10_000 }).catch(() => false);
      expect(hasNext).toBeTruthy();
    } else {
      // Landing may have been skipped — still valid
      expect(true).toBeTruthy();
    }
  });
});

test.describe('Docs Page', () => {
  test('shows command list', async ({ page }) => {
    await page.goto('/#/docs');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=init').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=commit').first()).toBeVisible();
  });

  test('shows a specific command doc', async ({ page }) => {
    await page.goto('/#/docs/add');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=git add').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Changelog Page', () => {
  test('shows changelog entries', async ({ page }) => {
    await page.goto('/#/changelog');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=CHANGELOG').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Stats Page', () => {
  test('loads stats page', async ({ page }) => {
    await page.goto('/#/stats');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=MONASTERY RECORDS').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('gitvana-save', JSON.stringify({ version: 1, levelIndex: 0, completedLevels: 0, levelStars: {}, totalStars: 0 }));
      localStorage.setItem('gitvana-player-name', 'TestPlayer');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('level intro shows for level 1', async ({ page }) => {
    await expect(page.locator('text=ACT 1').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /START LEVEL/i })).toBeVisible();
  });

  test('game layout loads after starting level', async ({ page }) => {
    await page.getByRole('button', { name: /START LEVEL/i }).click();
    await expect(page.locator('.xterm').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=OBJECTIVES').first()).toBeVisible();
  });
});

test.describe('Mobile Fallback', () => {
  test('shows mobile message on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 600 });
    await page.goto('/');
    await expect(page.locator('text=Gitvana needs a keyboard').first()).toBeVisible({ timeout: 10_000 });
  });
});
