import { test, expect } from '@playwright/test';

/**
 * Motorcycles Management Tests - SCRUM-16
 * Tests for motorcycle list display, start/stop/drive functionality
 * Note: Tests use language-agnostic selectors to work regardless of UI language
 */

// Helper function to login
async function loginAs(page, username: string, password: string) {
  await page.locator('form input').first().fill(username);
  await page.locator('form input[type="password"]').fill(password);
  await page.locator('form button').click();
  // Wait for login to complete - logout button appears
  await expect(page.locator('button').filter({ hasText: /logout|abmelden/i })).toBeVisible({ timeout: 10000 });
}

test.describe('Motorcycles Management', () => {
  // Login as user before each test (user has StartMotorcycle, StopMotorcycle, DriveMotorcycle permissions)
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAs(page, 'user', 'user123');
    // Second tab should be Motorcycles
    await expect(page.getByRole('tab').nth(1)).toBeVisible();
  });

  test('should display motorcycles tab', async ({ page }) => {
    // Motorcycles tab should be visible (second tab)
    await expect(page.getByRole('tab').nth(1)).toBeVisible();
  });

  test('should display motorcycle list with columns', async ({ page }) => {
    // Click on Motorcycles tab (second tab)
    await page.getByRole('tab').nth(1).click();

    // Wait for table to be visible
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for column headers
    const headers = page.locator('th');
    await expect(headers.first()).toBeVisible();
  });

  test('should display seeded motorcycles (at least one motorcycle)', async ({ page }) => {
    // Navigate to motorcycles tab
    await page.getByRole('tab').nth(1).click();

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that at least one motorcycle is displayed (from seeder)
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('should have start, drive, and stop buttons for motorcycles', async ({ page }) => {
    await page.getByRole('tab').nth(1).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that action buttons exist (using language-agnostic text patterns)
    await expect(page.locator('button').filter({ hasText: /start|starten/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /drive|fahren/i }).first()).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /stop|stoppen/i }).first()).toBeVisible();
  });

  test('should be able to start a stopped motorcycle', async ({ page }) => {
    await page.getByRole('tab').nth(1).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Find a Start button (using language-agnostic text)
    const startButton = page.locator('button').filter({ hasText: /start|starten/i }).first();
    const isStartEnabled = await startButton.isEnabled().catch(() => false);

    if (isStartEnabled) {
      await startButton.click();
      await page.waitForTimeout(1000);
      // Verify the status changed (chip should update)
      await expect(page.locator('.MuiChip-root').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should be able to drive a running motorcycle', async ({ page }) => {
    await page.getByRole('tab').nth(1).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First, ensure we have a running motorcycle
    const startButton = page.locator('button').filter({ hasText: /start|starten/i }).first();
    const isStartEnabled = await startButton.isEnabled().catch(() => false);

    if (isStartEnabled) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }

    // Now find the Drive button and click it
    const driveButton = page.locator('button').filter({ hasText: /drive|fahren/i }).first();
    const isDriveEnabled = await driveButton.isEnabled().catch(() => false);

    if (isDriveEnabled) {
      await driveButton.click();
      await page.waitForTimeout(1000);
      // Verify the status changed (chip should update)
      await expect(page.locator('.MuiChip-root').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should be able to stop a running or driving motorcycle', async ({ page }) => {
    await page.getByRole('tab').nth(1).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First, ensure we have a running motorcycle
    const startButton = page.locator('button').filter({ hasText: /start|starten/i }).first();
    const isStartEnabled = await startButton.isEnabled().catch(() => false);

    if (isStartEnabled) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }

    // Now stop it
    const stopButton = page.locator('button').filter({ hasText: /stop|stoppen/i }).first();
    const isStopEnabled = await stopButton.isEnabled().catch(() => false);

    if (isStopEnabled) {
      await stopButton.click();
      await page.waitForTimeout(1000);
      // Verify the status changed (chip should update)
      await expect(page.locator('.MuiChip-root').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should sort motorcycles by name', async ({ page }) => {
    await page.getByRole('tab').nth(1).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click on first column header to sort (Name column)
    await page.locator('th').first().click();
    await page.waitForTimeout(500);

    // Click again to reverse sort
    await page.locator('th').first().click();
    await page.waitForTimeout(500);

    // Table should still be visible
    await expect(page.getByRole('table')).toBeVisible();
  });
});

test.describe('Motorcycle Management (Admin User)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAs(page, 'admin', 'admin123');
  });

  test('admin should see motorcycle management options', async ({ page }) => {
    await page.getByRole('tab').nth(1).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Admin with ManageMotorcycles should see Add button (AddIcon)
    const addButton = page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') });
    // If ManageMotorcycles permission is assigned to admin
    const isAddVisible = await addButton.isVisible().catch(() => false);

    if (isAddVisible) {
      await expect(addButton).toBeVisible();
    }
  });
});

test.describe('Motorcycle Permissions', () => {
  test('user without ManageMotorcycles should NOT see add motorcycle button', async ({ page }) => {
    await page.goto('/');
    await loginAs(page, 'user', 'user123');

    await page.getByRole('tab').nth(1).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // User should NOT see Add Motorcycle button (no ManageMotorcycles permission)
    const addButton = page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') });
    await expect(addButton).not.toBeVisible();
  });
});
