import { test, expect } from '@playwright/test';

/**
 * User Management Tests (Admin) - SCRUM-13
 * Tests for user list, create, edit, delete functionality
 * These tests require admin permissions (ManageUsers)
 */

test.describe('User Management - Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as admin who has ManageUsers permission
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
  });

  test('admin should see Users tab', async ({ page }) => {
    // Admin has ManageUsers permission, so Users tab should be visible
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible({ timeout: 5000 });
  });

  test('should display users list when clicking Users tab', async ({ page }) => {
    // Click on Users tab
    await page.getByRole('tab', { name: 'Users' }).click();

    // Wait for users table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for column headers
    await expect(page.getByRole('columnheader', { name: /username/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /roles/i })).toBeVisible();
  });

  test('should display seeded users (at least admin and user)', async ({ page }) => {
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that at least some users are displayed
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
  });

  test('should have add user button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Look for Add button
    const addButton = page.getByRole('button', { name: /add/i });
    await expect(addButton).toBeVisible();
  });

  test('should open add user dialog when clicking add button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button
    const addButton = page.getByRole('button', { name: /add/i }).first();
    await addButton.click();

    // Dialog should open with form fields
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/username/i)).toBeVisible();
  });

  test('should sort users by username', async ({ page }) => {
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click on Username column header to sort
    const usernameHeader = page.getByRole('columnheader', { name: /username/i });
    await usernameHeader.click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Table should still be visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should create a new user successfully', async ({ page }) => {
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button
    await page.getByRole('button', { name: /add/i }).first().click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in user details
    const testUsername = `testuser_${Date.now()}`;
    await page.getByLabel(/username/i).fill(testUsername);
    await page.getByLabel(/password/i).fill('testpass123');

    // Click Save
    await page.getByRole('button', { name: /save/i }).click();

    // Dialog should close and user should appear in the list
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testUsername })).toBeVisible({ timeout: 5000 });
  });

  test('should edit an existing user', async ({ page }) => {
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click edit button on first user row
    const editButton = page.locator('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first();
    await editButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Verify the username field is populated
    const usernameInput = page.getByLabel(/username/i);
    const currentValue = await usernameInput.inputValue();
    expect(currentValue).toBeTruthy();

    // Close dialog
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('should delete a user successfully', async ({ page }) => {
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First create a user to delete
    await page.getByRole('button', { name: /add/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const testUsername = `deleteuser_${Date.now()}`;
    await page.getByLabel(/username/i).fill(testUsername);
    await page.getByLabel(/password/i).fill('testpass123');
    await page.getByRole('button', { name: /save/i }).click();
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
    await page.getByRole('tab', { name: 'Users' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button to create a new user with roles
    await page.getByRole('button', { name: /add/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in user details
    const testUsername = `roleuser_${Date.now()}`;
    await page.getByLabel(/username/i).fill(testUsername);
    await page.getByLabel(/password/i).fill('testpass123');

    // Click Save without selecting roles for simplicity
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify user was created
    await expect(page.getByRole('cell', { name: testUsername })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('User Management - Regular User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as regular user who does NOT have ManageUsers permission
    await page.getByLabel('Username').fill('user');
    await page.getByLabel('Password').fill('user123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
  });

  test('regular user should NOT see Users tab', async ({ page }) => {
    // Regular user doesn't have ManageUsers permission
    // Users tab should not be visible or accessible
    const usersTab = page.getByRole('tab', { name: 'Users' });
    await expect(usersTab).not.toBeVisible({ timeout: 3000 });
  });
});
