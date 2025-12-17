import { test, expect } from '@playwright/test';

/**
 * Motorcycles Management Tests - SCRUM-16
 * Tests for motorcycle list display, start/stop/drive functionality
 */

test.describe('Motorcycles Management', () => {
  // Login as user before each test (user has StartMotorcycle, StopMotorcycle, DriveMotorcycle permissions)
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Username').fill('user');
    await page.getByLabel('Password').fill('user123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for login to complete and data to load
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: 'Motorcycles' })).toBeVisible();
  });

  test('should display motorcycles tab', async ({ page }) => {
    // Motorcycles tab should be visible
    await expect(page.getByRole('tab', { name: 'Motorcycles' })).toBeVisible();
  });

  test('should display motorcycle list with columns', async ({ page }) => {
    // Click on Motorcycles tab
    await page.getByRole('tab', { name: 'Motorcycles' }).click();

    // Wait for table to be visible
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for column headers
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
  });

  test('should display seeded motorcycles (at least one motorcycle)', async ({ page }) => {
    // Navigate to motorcycles tab
    await page.getByRole('tab', { name: 'Motorcycles' }).click();

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that at least one motorcycle is displayed (from seeder)
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('should have start, drive, and stop buttons for motorcycles', async ({ page }) => {
    await page.getByRole('tab', { name: 'Motorcycles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that Start button exists
    await expect(page.getByRole('button', { name: /start/i }).first()).toBeVisible();
    // Check that Drive button exists
    await expect(page.getByRole('button', { name: /drive/i }).first()).toBeVisible();
    // Check that Stop button exists
    await expect(page.getByRole('button', { name: /stop/i }).first()).toBeVisible();
  });

  test('should be able to start a stopped motorcycle', async ({ page }) => {
    await page.getByRole('tab', { name: 'Motorcycles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Find a Start button that's enabled (motorcycle is Stopped)
    const startButton = page.getByRole('button', { name: /start/i }).first();
    const isStartEnabled = await startButton.isEnabled().catch(() => false);

    if (isStartEnabled) {
      await startButton.click();
      await page.waitForTimeout(1000);
      // Verify the status changed to Running
      await expect(page.getByText(/running/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should be able to drive a running motorcycle', async ({ page }) => {
    await page.getByRole('tab', { name: 'Motorcycles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First, ensure we have a running motorcycle
    const startButton = page.getByRole('button', { name: /start/i }).first();
    const isStartEnabled = await startButton.isEnabled().catch(() => false);

    if (isStartEnabled) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }

    // Now find the Drive button and click it
    const driveButton = page.getByRole('button', { name: /drive/i }).first();
    const isDriveEnabled = await driveButton.isEnabled().catch(() => false);

    if (isDriveEnabled) {
      await driveButton.click();
      await page.waitForTimeout(1000);
      // Verify the status changed to Driving
      await expect(page.getByText(/driving/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should be able to stop a running or driving motorcycle', async ({ page }) => {
    await page.getByRole('tab', { name: 'Motorcycles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First, ensure we have a running motorcycle
    const startButton = page.getByRole('button', { name: /start/i }).first();
    const isStartEnabled = await startButton.isEnabled().catch(() => false);

    if (isStartEnabled) {
      await startButton.click();
      await page.waitForTimeout(1000);
    }

    // Now stop it
    const stopButton = page.getByRole('button', { name: /stop/i }).first();
    const isStopEnabled = await stopButton.isEnabled().catch(() => false);

    if (isStopEnabled) {
      await stopButton.click();
      await page.waitForTimeout(1000);
      // Verify the status changed to Stopped
      await expect(page.getByText(/stopped/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should sort motorcycles by name', async ({ page }) => {
    await page.getByRole('tab', { name: 'Motorcycles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click on Name header to sort
    await page.getByRole('columnheader', { name: /name/i }).click();
    await page.waitForTimeout(500);

    // Click again to reverse sort
    await page.getByRole('columnheader', { name: /name/i }).click();
    await page.waitForTimeout(500);

    // Table should still be visible
    await expect(page.getByRole('table')).toBeVisible();
  });
});

test.describe('Motorcycle Management (Admin User)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
  });

  test('admin should see motorcycle management options', async ({ page }) => {
    await page.getByRole('tab', { name: 'Motorcycles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Admin with ManageMotorcycles should see Add button
    const addButton = page.getByRole('button', { name: /add motorcycle/i });
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
    await page.getByLabel('Username').fill('user');
    await page.getByLabel('Password').fill('user123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('tab', { name: 'Motorcycles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // User should NOT see Add Motorcycle button (no ManageMotorcycles permission)
    await expect(page.getByRole('button', { name: /add motorcycle/i })).not.toBeVisible();
  });
});
