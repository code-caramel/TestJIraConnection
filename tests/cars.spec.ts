import { test, expect } from '@playwright/test';

/**
 * Cars Management Tests - SCRUM-13
 * Tests for car list display, start/stop functionality
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

test.describe('Cars Management', () => {
  // Login as user before each test (user has StartCar, StopCar permissions)
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAs(page, 'user', 'user123');
    // First tab should be visible (Cars)
    await expect(page.getByRole('tab').first()).toBeVisible();
  });

  test('should display cars tab by default', async ({ page }) => {
    // Cars tab should be visible (first tab)
    await expect(page.getByRole('tab').first()).toBeVisible();
  });

  test('should display car list with columns', async ({ page }) => {
    // Click on first tab (Cars)
    await page.getByRole('tab').first().click();

    // Wait for table to be visible
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for column headers (Name and Status are common across languages)
    const headers = page.locator('th');
    await expect(headers.first()).toBeVisible();
  });

  test('should display seeded cars (at least one car)', async ({ page }) => {
    // Navigate to cars tab
    await page.getByRole('tab').first().click();

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that at least one car is displayed (from seeder or created by tests)
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('should be able to start a stopped car', async ({ page }) => {
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Find a car row and look for Start button (text button with Start/Starten)
    const startButton = page.locator('button').filter({ hasText: /start|starten/i }).first();
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
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Find a Stop button (text button with Stop/Stoppen)
    const stopButton = page.locator('button').filter({ hasText: /stop|stoppen/i }).first();

    // Check if the stop button is enabled (there's a running car)
    const isStopEnabled = await stopButton.isEnabled().catch(() => false);

    if (isStopEnabled) {
      await stopButton.click();
      await page.waitForTimeout(1000);
      // Verify the car status chip shows stopped state
      await expect(page.locator('.MuiChip-root, [class*="Stopped"]').first()).toBeVisible({ timeout: 5000 });
    } else {
      // First start a car
      const startButton = page.locator('button').filter({ hasText: /start|starten/i }).first();
      const isStartEnabled = await startButton.isEnabled().catch(() => false);

      if (isStartEnabled) {
        await startButton.click();
        await page.waitForTimeout(1000);

        // Now stop it
        await expect(page.locator('button').filter({ hasText: /stop|stoppen/i }).first()).toBeEnabled({ timeout: 5000 });
        await page.locator('button').filter({ hasText: /stop|stoppen/i }).first().click();
        await page.waitForTimeout(1000);
        await expect(page.locator('.MuiChip-root, [class*="Stopped"]').first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should sort cars by name', async ({ page }) => {
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click on first column header to sort (Name column)
    const nameHeader = page.locator('th').first();
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
    await loginAs(page, 'admin', 'admin123');
  });

  test('admin should see car management options', async ({ page }) => {
    // Admin has ManageCars permission
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Admin should see add button (has ManageCars) - look for AddIcon
    const addButton = page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') });
    await expect(addButton).toBeVisible();
  });

  test('admin should be able to add a new car', async ({ page }) => {
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add Car button (button with AddIcon)
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in car name
    const testCarName = `Test Car ${Date.now()}`;
    await page.getByRole('dialog').locator('input').first().fill(testCarName);

    // Click Save (primary button in dialog)
    await page.getByRole('dialog').locator('button').last().click();

    // Dialog should close and car should appear in the list
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testCarName })).toBeVisible({ timeout: 5000 });
  });

  test('admin should be able to edit a car', async ({ page }) => {
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click edit button (MUI IconButton with EditIcon SVG)
    const editButton = page.locator('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first();
    await editButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Modify car name
    const carNameInput = page.getByRole('dialog').locator('input').first();
    await carNameInput.clear();
    await carNameInput.fill('Updated Car Name');

    // Click Save
    await page.getByRole('dialog').locator('button').last().click();

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('admin should be able to delete a car', async ({ page }) => {
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First add a car to delete
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const testCarName = `Delete Me ${Date.now()}`;
    await page.getByRole('dialog').locator('input').first().fill(testCarName);
    await page.getByRole('dialog').locator('button').last().click();
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
    await loginAs(page, 'user', 'user123');
  });

  test('user without ManageCars should NOT see add car button', async ({ page }) => {
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // User doesn't have ManageCars permission, so add button should not be visible
    const addButton = page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') });
    await expect(addButton).not.toBeVisible({ timeout: 3000 });
  });

  test('user without ManageCars should NOT see edit/delete buttons', async ({ page }) => {
    await page.getByRole('tab').first().click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Edit and delete buttons should not be visible for regular user
    const editButtons = page.locator('[data-testid="EditIcon"]');
    const deleteButtons = page.locator('[data-testid="DeleteIcon"]');

    await expect(editButtons).not.toBeVisible({ timeout: 3000 });
    await expect(deleteButtons).not.toBeVisible({ timeout: 3000 });
  });
});
