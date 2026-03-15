import { test, expect } from '@playwright/test';
import { clearDb } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearDb(page);
});

test('transform a coordinate to a different CRS creates a new card', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add project').click();
  await page.getByLabel('Project name').fill('Transform Test');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: 'Add coordinate' }).click();
  await page.getByLabel('Longitude').fill('135.5');
  await page.getByLabel('Latitude').fill('-30.2');
  await page.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByText('135.5')).toBeVisible();
  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Transform' }).click();

  await expect(page.getByRole('dialog', { name: 'Transform to CRS' })).toBeVisible();
  await page.getByLabel('Target CRS').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await page.getByRole('dialog', { name: 'Transform to CRS' }).getByRole('button', { name: 'Transform' }).click();

  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('Transform', { exact: true }).first()).toBeVisible();
});
