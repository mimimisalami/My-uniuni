import { test, expect, type Page } from '@playwright/test';

async function enter(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter My Universe' }).click();
  await expect(page.getByRole('heading', { name: 'The Celestial Hub', exact: true })).toBeVisible();
}

async function travel(page: Page, name: string) {
  await page.getByRole('button', { name: 'Atlas / Quick travel' }).click();
  await page.locator('.destination').filter({ hasText: name }).click();
  await expect(page.locator('#world-name')).toHaveText(name);
  await expect(page.locator('.transition')).toBeHidden();
}

test('3D scene, portals, keyboard movement and interaction', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await enter(page);
  await expect(page.locator('.graphics-error')).toBeHidden();
  const graphics = await page.locator('#universe').evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2');
    return { width: canvas.width, height: canvas.height, context: !!gl, error: gl?.getError() };
  });
  expect(graphics.context).toBe(true);
  expect(graphics.width).toBeGreaterThan(0);
  expect(graphics.error).toBe(0);
  await page.getByRole('button', { name: 'Go to The Observatory', exact: true }).click();
  await expect(page.locator('#world-name')).toHaveText('The Observatory');
  await expect(page.locator('.transition')).toBeHidden();
  await page.keyboard.down('w');
  await expect(page.locator('.interact-button')).toBeVisible({ timeout: 25_000 });
  await page.keyboard.up('w');
  await page.keyboard.press('e');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Follow a thought.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Back to Hub' }).click();
  await expect(page.locator('#world-name')).toHaveText('The Celestial Hub');
  expect(errors).toEqual([]);
});

test('wardrobe preview applies three different outfits and survives reload', async ({ page }) => {
  await enter(page);
  for (const [label, id] of [['Techwear', 'techwear'], ['Mythic Minimal', 'mythic'], ['Modern Tailored', 'tailored']]) {
    // The direct-access label is intentionally available without walking.
    await page.getByRole('button', { name: 'Go to Wardrobe Atelier' }).click();
    await page.locator(`[data-outfit="${id}"]`).click();
    await expect(page.locator(`[data-outfit="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#avatar-preview')).toBeVisible();
    await page.getByRole('button', { name: 'Apply look' }).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('aether-demo-v1')!));
    expect(saved.outfit).toBe(id);
  }
  await page.reload();
  await page.getByRole('button', { name: 'Enter My Universe' }).click();
  await page.getByRole('button', { name: 'Go to Wardrobe Atelier' }).click();
  await expect(page.locator('[data-outfit="tailored"]')).toHaveAttribute('aria-pressed', 'true');
});

test('notes → inbox → task, board persistence, timer and intentional reset', async ({ page }) => {
  await enter(page);
  await travel(page, 'The Observatory');
  await page.locator('.work-button').click();
  const note = 'Explore a better morning routine <script>alert(1)</script>';
  await page.getByLabel('YOUR FIELD NOTES').fill(note);
  await page.getByRole('button', { name: 'Start focus', exact: true }).click();
  await expect(page.locator('#timer-value')).not.toHaveText('25:00');
  await page.getByRole('button', { name: 'Pause focus', exact: true }).click();
  const paused = await page.locator('#timer-value').textContent();
  await page.waitForTimeout(1100);
  await expect(page.locator('#timer-value')).toHaveText(paused!);
  await page.getByRole('button', { name: 'Resume focus', exact: true }).click();
  await page.getByRole('button', { name: 'Send to Idea Inbox' }).click();
  await page.getByRole('button', { name: 'Send to Idea Inbox' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('aether-demo-v1')!).ideas.length)).toBe(1);
  await page.getByRole('button', { name: 'Visit the Atelier' }).click();
  await expect(page.locator('#world-name')).toHaveText('The Atelier');
  await expect(page.locator('.transition')).toBeHidden();
  await page.locator('.work-button').click();
  await expect(page.locator('.idea-row p')).toHaveText(note);
  await page.getByRole('button', { name: 'Make it a task' }).click();
  await expect(page.locator('#tasks-todo .task-card')).toHaveCount(1);
  await expect(page.locator('#idea-count')).toHaveText('0');
  await page.locator('#tasks-todo select').selectOption('progress');
  await expect(page.locator('#tasks-progress .task-card')).toHaveCount(1);
  await page.locator('#tasks-progress select').selectOption('done');
  await page.getByRole('textbox', { name: 'New task' }).fill('Build a small habit');
  await page.getByRole('button', { name: 'Add task', exact: false }).click();
  await expect(page.locator('#count-todo')).toHaveText('1');
  await page.reload();
  await page.getByRole('button', { name: 'Enter My Universe' }).click();
  await travel(page, 'The Atelier');
  await page.locator('.work-button').click();
  await expect(page.locator('#tasks-done .task-card p')).toHaveText(note);
  await expect(page.locator('#tasks-todo .task-card p')).toHaveText('Build a small habit');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await travel(page, 'The Observatory');
  await page.locator('.work-button').click();
  await expect(page.getByLabel('YOUR FIELD NOTES')).toHaveValue(note);
  await expect(page.locator('#timer-toggle')).toHaveText('Pause focus');
  await expect(page.locator('#timer-value')).not.toHaveText('25:00');
  await page.getByRole('button', { name: 'Reset to 25 minutes' }).click();
  await expect(page.locator('#timer-value')).toHaveText('25:00');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Open controls and help' }).click();
  await page.getByRole('button', { name: 'Reset local demo data' }).click();
  await page.getByRole('button', { name: 'Keep my universe' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('aether-demo-v1')!).tasks.length)).toBe(2);
  await page.getByRole('button', { name: 'Reset local demo data' }).click();
  await page.getByRole('button', { name: 'Reset demo data', exact: true }).click();
  const reset = await page.evaluate(() => JSON.parse(localStorage.getItem('aether-demo-v1')!));
  expect(reset.note).toBe(''); expect(reset.tasks).toEqual([]); expect(reset.ideas).toEqual([]);
  expect(reset.timer).toEqual({ remaining: 1500, endAt: null });
});

test.describe('mobile touch experience', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('touch movement, navigation, responsive tools and keyboard dialog focus', async ({ page }) => {
    await enter(page);
    const up = page.getByRole('button', { name: 'Move forward', exact: true });
    await expect(up).toBeVisible();
    const marker = page.locator('[aria-label="Go to The Observatory"]');
    await expect.poll(() => marker.evaluate((el: HTMLElement) => el.style.top)).not.toBe('');
    const before = await marker.evaluate((el: HTMLElement) => parseFloat(el.style.top));
    const button = await up.boundingBox();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: button!.x + 20, y: button!.y + 15 }] });
    await expect.poll(async () => Math.abs(await marker.evaluate((el: HTMLElement) => parseFloat(el.style.top)) - before)).toBeGreaterThan(3);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(up).not.toHaveClass(/pressed/);
    await travel(page, 'The Observatory');
    await page.locator('.work-button').click();
    await page.getByLabel('YOUR FIELD NOTES').fill('An idea on a small screen');
    await page.getByRole('button', { name: 'Send to Idea Inbox' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    const overflow = await page.getByRole('dialog').evaluate(el => el.scrollWidth > el.clientWidth);
    expect(overflow).toBe(false);
    await page.getByRole('button', { name: 'Visit the Atelier' }).click();
    await expect(page.locator('#world-name')).toHaveText('The Atelier');
    await expect(page.locator('.transition')).toBeHidden();
    await page.locator('.work-button').click();
    await page.getByRole('button', { name: 'Make it a task' }).click();
    await expect(page.locator('#tasks-todo .task-card p')).toHaveText('An idea on a small screen');
    expect(await page.getByRole('dialog').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.getByRole('button', { name: 'Open controls and help' }).click();
    await page.getByRole('button', { name: 'Close dialog' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Reset local demo data' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  });
});
