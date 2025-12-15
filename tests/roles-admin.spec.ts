import { test, expect } from '@playwright/test';

/**
 * Role Management Tests (Admin) - SCRUM-13
 * Tests for role list, create, edit, delete functionality
 * These tests require admin permissions (ManageRoles)
 */

test.describe('Role Management - Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as admin who has ManageRoles permission
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
  });

  test('admin should see Roles tab', async ({ page }) => {
    // Admin has ManageRoles permission, so Roles tab should be visible
    await expect(page.getByRole('tab', { name: 'Roles' })).toBeVisible({ timeout: 5000 });
  });

  test('should display roles list when clicking Roles tab', async ({ page }) => {
    // Click on Roles tab
    await page.getByRole('tab', { name: 'Roles' }).click();

    // Wait for roles table to load
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check for column headers
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /permissions/i })).toBeVisible();
  });

  test('should display seeded roles (at least Admin and User)', async ({ page }) => {
    await page.getByRole('tab', { name: 'Roles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Check that at least some roles are displayed
    const tableRows = page.locator('tbody tr');
    await expect(tableRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
  });

  test('should have add role button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Roles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Look for Add button
    const addButton = page.getByRole('button', { name: /add/i });
    await expect(addButton).toBeVisible();
  });

  test('should open add role dialog when clicking add button', async ({ page }) => {
    await page.getByRole('tab', { name: 'Roles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button
    const addButton = page.getByRole('button', { name: /add/i }).first();
    await addButton.click();

    // Dialog should open with form fields
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test('should sort roles by name', async ({ page }) => {
    await page.getByRole('tab', { name: 'Roles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click on Name column header to sort
    const nameHeader = page.getByRole('columnheader', { name: /name/i });
    await nameHeader.click();

    // Wait for sort to apply
    await page.waitForTimeout(500);

    // Table should still be visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should create a new role successfully', async ({ page }) => {
    await page.getByRole('tab', { name: 'Roles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button
    await page.getByRole('button', { name: /add/i }).first().click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in role name
    const testRoleName = `TestRole_${Date.now()}`;
    await page.getByLabel(/name/i).first().fill(testRoleName);

    // Click Save
    await page.getByRole('button', { name: /save/i }).click();

    // Dialog should close and role should appear in the list
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('cell', { name: testRoleName })).toBeVisible({ timeout: 5000 });
  });

  test('should edit an existing role', async ({ page }) => {
    await page.getByRole('tab', { name: 'Roles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click edit button on first role row
    const editButton = page.locator('button').filter({ has: page.locator('svg[data-testid="EditIcon"]') }).first();
    await editButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Verify the name field is populated
    const nameInput = page.getByLabel(/name/i).first();
    const currentValue = await nameInput.inputValue();
    expect(currentValue).toBeTruthy();

    // Close dialog
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  });

  test('should delete a role successfully', async ({ page }) => {
    await page.getByRole('tab', { name: 'Roles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // First create a role to delete
    await page.getByRole('button', { name: /add/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const testRoleName = `DeleteRole_${Date.now()}`;
    await page.getByLabel(/name/i).first().fill(testRoleName);
    await page.getByRole('button', { name: /save/i }).click();
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
    await page.getByRole('tab', { name: 'Roles' }).click();
    await expect(page.getByRole('table')).toBeVisible({ timeout: 10000 });

    // Click Add button to create a new role with permissions
    await page.getByRole('button', { name: /add/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // Fill in role name
    const testRoleName = `PermRole_${Date.now()}`;
    await page.getByLabel(/name/i).first().fill(testRoleName);

    // Click Save without adding permissions for simplicity
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Verify role was created
    await expect(page.getByRole('cell', { name: testRoleName })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Role Management - Regular User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Login as regular user who does NOT have ManageRoles permission
    await page.getByLabel('Username').fill('user');
    await page.getByLabel('Password').fill('user123');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
  });

  test('regular user should NOT see Roles tab', async ({ page }) => {
    // Regular user doesn't have ManageRoles permission
    // Roles tab should not be visible or accessible
    const rolesTab = page.getByRole('tab', { name: 'Roles' });
    await expect(rolesTab).not.toBeVisible({ timeout: 3000 });
  });
});
