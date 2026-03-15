import { test, expect } from '@playwright/test';
import { clearDb } from './helpers';

test.beforeEach(async ({ page }) => {
  await clearDb(page);
});

test('app loads and shows the main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Coordinate Helper' })).toBeVisible();
});

test('empty state shows add project prompt', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('No projects yet. Add one to get started.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add project' }).first()).toBeVisible();
});

test('create a project and it appears in the list', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add project').click();
  await expect(page.getByRole('dialog', { name: 'New project' })).toBeVisible();
  await page.getByLabel('Project name').fill('Survey 2025');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('No coordinates yet. Add one to get started.')).toBeVisible();
  await page.getByLabel('Exit project').click();
  await expect(page.getByRole('heading', { name: 'Survey 2025', level: 3 })).toBeVisible();
});

test('delete a project removes it from the list', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Add project').click();
  await page.getByLabel('Project name').fill('To Delete');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByLabel('Exit project').click();
  await expect(page.getByRole('heading', { name: 'To Delete', level: 3 })).toBeVisible();

  await page.getByRole('button', { name: 'Project actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByRole('dialog', { name: 'Delete project' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByRole('heading', { name: 'To Delete', level: 3 })).not.toBeVisible();
  await expect(page.getByText('No projects yet. Add one to get started.')).toBeVisible();
});
