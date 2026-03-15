import type { Page } from '@playwright/test';

/** IndexedDB database name used by the app (Dexie). */
const DB_NAME = 'lat-long-db';

/**
 * Clears the app's IndexedDB so tests start with a clean state.
 * Navigates to base URL, deletes the DB, then reloads.
 */
export async function clearDb(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate((name) => indexedDB.deleteDatabase(name), DB_NAME);
  await page.reload();
}
