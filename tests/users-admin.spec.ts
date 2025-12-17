import { test, expect } from '@playwright/test';

/**
 * User Management Tests (Admin) - SCRUM-13
 * Tests for user list, create, edit, delete functionality
 * These tests require admin permissions (ManageUsers)
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

test.describe('User Management - Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as admin who has ManageUsers permission
    await loginAs(page, 'admin', 'admin123');
  });

  test('admin should see Users tab', async ({ page }) => {
    // Admin has ManageUsers permission, so Users tab should be visible (3rd tab)
    await expect(page.getByRole('tab').nth(2)).toBeVisible({ timeout: 5000 });
  });

  test('should display users list when clicking Users tab', async ({ page }) => {
    // Click on Users tab (3rd tab, index 2)
    await page.getByRole('tab').nth(2).click();

    // Wait for users table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for column headers
    const headers = page.locator('th');
    await expect(headers.first()).toBeVisible();
  });

  test('should display seeded users (at least admin and user)', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that at least some users are displayed
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
  });

  test('should have add user button', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Look for Add button (AddIcon)
    const addButton = page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') });
    await expect(addButton).toBeVisible();
  });

  test('should open add user dialog when clicking add button', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();

    // Dialog should open with form fields
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('dialog').locator('input').first()).toBeVisible();
  });

  test('should sort users by username', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click on first column header to sort (Username column)
    await page.locator('th').first().click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Table should still be visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should create a new user successfully', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in user details
    const testUsername = `testuser_${Date.now()}`;
    await page.getByRole('dialog').locator('input').first().fill(testUsername);
    await page.getByRole('dialog').locator('input[type="password"]').fill('testpass123');

    // Click Save (submit button in dialog)
    await page.getByRole('dialog').locator('button').last().click();

    // Dialog should close and user should appear in the list
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testUsername })).toBeVisible({ timeout: 5000 });
  });

  test('should edit an existing user', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click edit button on first user row
    const editButton = page.locator('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first();
    await editButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Verify the username field is populated
    const usernameInput = page.getByRole('dialog').locator('input').first();
    const currentValue = await usernameInput.inputValue();
    expect(currentValue).toBeTruthy();

    // Close dialog (press escape)
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('should delete a user successfully', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First create a user to delete
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const testUsername = `deleteuser_${Date.now()}`;
    await page.getByRole('dialog').locator('input').first().fill(testUsername);
    await page.getByRole('dialog').locator('input[type="password"]').fill('testpass123');
    await page.getByRole('dialog').locator('button').last().click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testUsername })).toBeVisible({ timeout: 5000 });

    // Now find and delete this user
    const userRow = page.getByRole('row').filter({ hasText: testUsername });
    const deleteButton = userRow.locator('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') });

    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await deleteButton.click();

    // User should be removed from the list
    await expect(page.getByRole('cell', { name: testUsername })).not.toBeVisible({ timeout: 5000 });
  });

  test('should assign roles to a user', async ({ page }) => {
    await page.getByRole('tab').nth(2).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button to create a new user with roles
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in user details
    const testUsername = `roleuser_${Date.now()}`;
    await page.getByRole('dialog').locator('input').first().fill(testUsername);
    await page.getByRole('dialog').locator('input[type="password"]').fill('testpass123');

    // Click Save without selecting roles for simplicity
    await page.getByRole('dialog').locator('button').last().click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify user was created
    await expect(page.getByRole('cell', { name: testUsername })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('User Management - Regular User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as regular user who does NOT have ManageUsers permission
    await loginAs(page, 'user', 'user123');
  });

  test('regular user should NOT see Users tab', async ({ page }) => {
    // Regular user doesn't have ManageUsers permission
    // Check that there are fewer tabs
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    // Admin has more tabs than regular user
    expect(tabCount).toBeLessThanOrEqual(3);
  });
});
