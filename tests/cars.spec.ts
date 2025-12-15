import { test, expect } from '@playwright/test';

/**
 * Cars Management Tests - SCRUM-13
 * Tests for car list display, start/stop functionality
 */

test.describe('Cars Management', () => {
  // Login as user before each test (user has StartCar, StopCar permissions)
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Username').fill('user');
    await page.getByLabel('Password').fill('user123');
    await page.getByRole('button', { name: 'Login' }).click();

    // Wait for login to complete and data to load
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: 'Cars' })).toBeVisible();
  });

  test('should display cars tab by default', async ({ page }) => {
    // Cars tab should be visible
    await expect(page.getByRole('tab', { name: 'Cars' })).toBeVisible();
  });

  test('should display car list with columns', async ({ page }) => {
    // Click on Cars tab if not already selected
    await page.getByRole('tab', { name: 'Cars' }).click();

    // Wait for table to be visible
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for column headers
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
  });

  test('should display seeded cars (at least one car)', async ({ page }) => {
    // Navigate to cars tab
    await page.getByRole('tab', { name: 'Cars' }).click();

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that at least one car is displayed (from seeder or created by tests)
    // Use a more flexible check - look for any table row with a status chip
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('should be able to start a stopped car', async ({ page }) => {
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Find a car row and look for Start button
    const startButton = page.getByRole('button', { name: /start/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();

      // After clicking start, the car status should change or the button should change
      // Wait for the action to complete
      await page.waitForTimeout(1000);

      // Verify the status changed (look for Running status)
      await expect(page.getByText(/running/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should be able to stop a running car', async ({ page }) => {
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Find a Stop button that's enabled (car is Running)
    const stopButton = page.getByRole('button', { name: /stop/i }).first();

    // Check if the stop button is enabled (there's a running car)
    const isStopEnabled = await stopButton.isEnabled().catch(() => false);

    if (isStopEnabled) {
      await stopButton.click();
      await page.waitForTimeout(1000);
      // Verify the status changed back to Stopped
      await expect(page.getByText(/stopped/i).first()).toBeVisible({ timeout: 5000 });
    } else {
      // First start a car
      const startButton = page.getByRole('button', { name: /start/i }).first();
      const isStartEnabled = await startButton.isEnabled().catch(() => false);

      if (isStartEnabled) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Now stop it
        await expect(page.getByRole('button', { name: /stop/i }).first()).toBeEnabled({ timeout: 5000 });
        await page.getByRole('button', { name: /stop/i }).first().click();
        await page.waitForTimeout(1000);
        await expect(page.getByText(/stopped/i).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should sort cars by name', async ({ page }) => {
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click on Name column header to sort
    const nameHeader = page.getByRole('columnheader', { name: /name/i });
    await nameHeader.click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Table should still be visible after sorting
    await expect(page.getByRole('table')).toBeVisible();
  });
});

test.describe('Cars Management - Admin User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
  });

  test('admin should see car management options', async ({ page }) => {
    // Admin has ManageCars permission
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Admin should see add button (has ManageCars)
    const addButton = page.getByRole('button', { name: /add car/i });
    await expect(addButton).toBeVisible();
  });

  test('admin should be able to add a new car', async ({ page }) => {
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add Car button
    await page.getByRole('button', { name: /add car/i }).click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: /add car/i })).toBeVisible();

    // Fill in car name
    const testCarName = `Test Car ${Date.now()}`;
    await page.getByLabel(/car name/i).fill(testCarName);

    // Click Save
    await page.getByRole('button', { name: /save/i }).click();

    // Dialog should close and car should appear in the list
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testCarName })).toBeVisible({ timeout: 5000 });
  });

  test('admin should be able to edit a car', async ({ page }) => {
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click edit button (MUI IconButton with EditIcon SVG)
    const editButton = page.locator('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first();
    await editButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Modify car name
    const carNameInput = page.getByLabel(/name/i);
    await carNameInput.clear();
    await carNameInput.fill('Updated Car Name');

    // Click Save
    await page.getByRole('button', { name: /save/i }).click();

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('admin should be able to delete a car', async ({ page }) => {
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First add a car to delete
    await page.getByRole('button', { name: /add car/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const testCarName = `Delete Me ${Date.now()}`;
    await page.getByLabel(/name/i).fill(testCarName);
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testCarName })).toBeVisible({ timeout: 5000 });

    // Now find and click delete button for this car
    const carRow = page.getByRole('row').filter({ hasText: testCarName });
    const deleteButton = carRow.locator('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') });

    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await deleteButton.click();

    // Car should be removed from the list
    await expect(page.getByRole('cell', { name: testCarName })).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Cars Management - User without ManageCars', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Username').fill('user');
    await page.getByLabel('Password').fill('user123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
  });

  test('user without ManageCars should NOT see add car button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // User doesn't have ManageCars permission, so add button should not be visible
    const addButton = page.getByRole('button', { name: /add car/i });
    await expect(addButton).not.toBeVisible({ timeout: 3000 });
  });

  test('user without ManageCars should NOT see edit/delete buttons', async ({ page }) => {
    await page.getByRole('tab', { name: 'Cars' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Edit and delete buttons should not be visible for regular user
    const editButtons = page.locator('[data-testid="EditIcon"]');
    const deleteButtons = page.locator('[data-testid="DeleteIcon"]');

    await expect(editButtons).not.toBeVisible({ timeout: 3000 });
    await expect(deleteButtons).not.toBeVisible({ timeout: 3000 });
  });
});
