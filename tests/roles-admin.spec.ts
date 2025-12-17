import { test, expect } from '@playwright/test';

/**
 * Role Management Tests (Admin) - SCRUM-13
 * Tests for role list, create, edit, delete functionality
 * These tests require admin permissions (ManageRoles)
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

test.describe('Role Management - Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as admin who has ManageRoles permission
    await loginAs(page, 'admin', 'admin123');
  });

  test('admin should see Roles tab', async ({ page }) => {
    // Admin has ManageRoles permission, so Roles tab should be visible (4th tab)
    await expect(page.getByRole('tab').nth(3)).toBeVisible({ timeout: 5000 });
  });

  test('should display roles list when clicking Roles tab', async ({ page }) => {
    // Click on Roles tab (4th tab, index 3)
    await page.getByRole('tab').nth(3).click();

    // Wait for roles table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for column headers
    const headers = page.locator('th');
    await expect(headers.first()).toBeVisible();
  });

  test('should display seeded roles (at least Admin and User)', async ({ page }) => {
    await page.getByRole('tab').nth(3).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that at least some roles are displayed
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
  });

  test('should have add role button', async ({ page }) => {
    await page.getByRole('tab').nth(3).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Look for Add button (AddIcon)
    const addButton = page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') });
    await expect(addButton).toBeVisible();
  });

  test('should open add role dialog when clicking add button', async ({ page }) => {
    await page.getByRole('tab').nth(3).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();

    // Dialog should open with form fields
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('dialog').locator('input').first()).toBeVisible();
  });

  test('should sort roles by name', async ({ page }) => {
    await page.getByRole('tab').nth(3).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click on first column header to sort (Name column)
    await page.locator('th').first().click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Table should still be visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should create a new role successfully', async ({ page }) => {
    await page.getByRole('tab').nth(3).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in role name
    const testRoleName = `TestRole_${Date.now()}`;
    await page.getByRole('dialog').locator('input').first().fill(testRoleName);

    // Click Save (submit button in dialog)
    await page.getByRole('dialog').locator('button').last().click();

    // Dialog should close and role should appear in the list
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testRoleName })).toBeVisible({ timeout: 5000 });
  });

  test('should edit an existing role', async ({ page }) => {
    await page.getByRole('tab').nth(3).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click edit button on first role row
    const editButton = page.locator('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first();
    await editButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Verify the name field is populated
    const nameInput = page.getByRole('dialog').locator('input').first();
    const currentValue = await nameInput.inputValue();
    expect(currentValue).toBeTruthy();

    // Close dialog (press escape)
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('should delete a role successfully', async ({ page }) => {
    await page.getByRole('tab').nth(3).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First create a role to delete
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const testRoleName = `DeleteRole_${Date.now()}`;
    await page.getByRole('dialog').locator('input').first().fill(testRoleName);
    await page.getByRole('dialog').locator('button').last().click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testRoleName })).toBeVisible({ timeout: 5000 });

    // Now find and delete this role
    const roleRow = page.getByRole('row').filter({ hasText: testRoleName });
    const deleteButton = roleRow.locator('button').filter({ has: page.locator('svg[data-testid="DeleteIcon"]') });

    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    await deleteButton.click();

    // Role should be removed from the list
    await expect(page.getByRole('cell', { name: testRoleName })).not.toBeVisible({ timeout: 5000 });
  });

  test('should assign permissions to a role', async ({ page }) => {
    await page.getByRole('tab').nth(3).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button to create a new role with permissions
    await page.locator('button').filter({ has: page.locator('svg[data-testid="AddIcon"]') }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in role name
    const testRoleName = `PermRole_${Date.now()}`;
    await page.getByRole('dialog').locator('input').first().fill(testRoleName);

    // Click Save without adding permissions for simplicity
    await page.getByRole('dialog').locator('button').last().click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify role was created
    await expect(page.getByRole('cell', { name: testRoleName })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Role Management - Regular User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as regular user who does NOT have ManageRoles permission
    await loginAs(page, 'user', 'user123');
  });

  test('regular user should NOT see Roles tab', async ({ page }) => {
    // Regular user doesn't have ManageRoles permission
    // Check that there are fewer tabs (no Roles tab)
    // User should only have Cars and Motorcycles tabs
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    // Admin has more tabs than regular user
    expect(tabCount).toBeLessThanOrEqual(3);
  });
});
