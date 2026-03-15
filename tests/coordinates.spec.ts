import { test, expect } from '@playwright/test';
import { clearDb } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearDb(page);
});

test('opening a project shows empty coordinate list', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add project').click();
  await page.getByLabel('Project name').fill('My Project');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('No coordinates yet. Add one to get started.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add' }).first()).toBeVisible();
});

test('add coordinate via manual X/Y and it appears', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add project').click();
  await page.getByLabel('Project name').fill('Data');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: 'Add coordinate' }).click();
  const addCoordDialog = page.getByRole('dialog', { name: 'Add coordinate' });
  await expect(addCoordDialog).toBeVisible();
  await page.getByLabel('Longitude').fill('135.5');
  await page.getByLabel('Latitude').fill('-30.2');
  await addCoordDialog.getByRole('button', { name: 'Add' }).click();

  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('135.5')).toBeVisible();
  await expect(page.getByText('-30.2')).toBeVisible();
});

test('delete a coordinate removes the card', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add project').click();
  await page.getByLabel('Project name').fill('Data');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: 'Add coordinate' }).click();
  await page.getByLabel('Longitude').fill('100');
  await page.getByLabel('Latitude').fill('50');
  await page.getByRole('dialog', { name: 'Add coordinate' }).getByRole('button', { name: 'Add' }).click();

  await expect(page.getByText('100')).toBeVisible();
  await page.getByRole('button', { name: 'Actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByRole('dialog', { name: 'Delete coordinate' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('100')).not.toBeVisible();
  await expect(page.getByText('No coordinates yet. Add one to get started.')).toBeVisible();
});
